// src/services/useQuarterAutoSave.ts
import api from '../lib/axios'
// comment. Unless there's a re-export shim elsewhere with the singular
// name, the old path would fail module resolution outright.
import { RESOURCE_ADAPTERS, type ResourceAdapter } from './quarterResourceAdapter'
import type { SetupMonitoringQuarterRecord } from '../types/setupMonitoring'

type SnapshotRow = { id: string; fields: Record<string, any> }
export type QuarterSnapshot = Record<string, Map<string, SnapshotRow>>

// Ids loaded from the backend look like `prod_42`; ids created locally
// look like `prod_1725984000123` (Date.now()). We know which ids are
// "real" because they exist in the snapshot built at load time —
// no id-shape guessing needed.
export function buildSnapshot(record: SetupMonitoringQuarterRecord): QuarterSnapshot {
  const snapshot: QuarterSnapshot = {}
  for (const adapter of RESOURCE_ADAPTERS) {
    const rows: any[] = (record as any)[adapter.recordKey] ?? []
    const map = new Map<string, SnapshotRow>()
    for (const row of rows) {
      map.set(row.id, { id: row.id, fields: adapter.toPayload(row) })
    }
    snapshot[adapter.recordKey as string] = map
  }
  return snapshot
}

function backendIdFrom(frontendId: string): number | null {
  const match = frontendId.match(/_(\d+)$/)
  return match ? Number(match[1]) : null
}

function shallowEqual(a: Record<string, any>, b: Record<string, any>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) if (a[k] !== b[k]) return false
  return true
}

export interface SyncEndpointError {
  endpoint: string
  error: unknown
}

interface SyncResult {
  record: SetupMonitoringQuarterRecord
  snapshot: QuarterSnapshot
  /**
   * Non-empty if one or more backend endpoints failed. The record/snapshot
   * returned still reflect everything that DID succeed — callers should
   * apply them to state regardless of whether errors is empty, then
   * separately surface `errors` as a "some changes didn't save" notice.
   * Do NOT discard record/snapshot just because errors is non-empty, or
   * you'll re-POST already-created rows as duplicates on the next sync.
   */
  errors: SyncEndpointError[]
}

export async function syncQuarter(
  quarterId: number,
  record: SetupMonitoringQuarterRecord,
  prevSnapshot: QuarterSnapshot,
): Promise<SyncResult> {
  const nextSnapshot: QuarterSnapshot = {}
  const patchedRecord: any = { ...record }

  // Group adapters by endpoint since several arrays share one backend table
  const byEndpoint = new Map<string, ResourceAdapter[]>()
  for (const adapter of RESOURCE_ADAPTERS) {
    const list = byEndpoint.get(adapter.endpoint) ?? []
    list.push(adapter)
    byEndpoint.set(adapter.endpoint, list)
  }

  const errors: SyncEndpointError[] = []
  const failedEndpoints = new Set<string>()

  const requests = Array.from(byEndpoint.entries()).map(async ([endpoint, adapters]) => {
    const creates: any[] = []
    const updates: any[] = []
    const deletes: number[] = []
    // temp_id -> { recordKey, index } so we can splice the real id back in
    const tempIdLocations: { tempId: string; recordKey: string; index: number }[] = []

    for (const adapter of adapters) {
      const rows: any[] = patchedRecord[adapter.recordKey] ?? []
      const prevRows = prevSnapshot[adapter.recordKey as string] ?? new Map()
      const seenIds = new Set<string>()

      rows.forEach((row, index) => {
        seenIds.add(row.id)
        const backendId = backendIdFrom(row.id)
        const prevRow = prevRows.get(row.id)
        const payload = adapter.toPayload(row)

        if (!prevRow) {
          // never synced before -> create
          creates.push({ temp_id: row.id, ...payload })
          tempIdLocations.push({ tempId: row.id, recordKey: adapter.recordKey as string, index })
        } else if (!shallowEqual(prevRow.fields, payload) && backendId) {
          updates.push({ id: backendId, ...payload })
        }
      })

      // anything in the snapshot but missing from current rows -> delete
      for (const [id] of prevRows) {
        if (!seenIds.has(id)) {
          const backendId = backendIdFrom(id)
          if (backendId) deletes.push(backendId)
        }
      }
    }

    if (creates.length === 0 && updates.length === 0 && deletes.length === 0) return

    try {
      const { data } = await api.post(
        `/quarterly-metrics/${quarterId}/${endpoint}/batch`,
        { creates, updates, deletes },
      )

      // reconcile temp_ids -> real backend ids
      const returned: any[] = data.data ?? []
      for (const created of returned) {
        if (!created.temp_id) continue
        const loc = tempIdLocations.find((l) => l.tempId === created.temp_id)
        if (!loc) continue
        const arr = [...patchedRecord[loc.recordKey]]
        arr[loc.index] = { ...arr[loc.index], id: `${loc.recordKey}_${created.id}` }
        patchedRecord[loc.recordKey] = arr
      }
    } catch (error) {
      // FIXED: previously an uncaught rejection here propagated straight
      // through Promise.all, which meant EVERY endpoint's work — including
      // ones that had already succeeded — was discarded by the caller.
      // Catch per-endpoint instead so a single failing batch can't destroy
      // successful reconciliation from the others, and so the caller still
      // gets an accurate record/snapshot back to persist as the new
      // baseline for whatever DID work.
      errors.push({ endpoint, error })
      failedEndpoints.add(endpoint)
    }
  })

  await Promise.all(requests)

  // Rebuild the snapshot from the reconciled record. For any endpoint that
  // failed, deliberately reuse its OLD snapshot entries instead of
  // recomputing from current rows. This keeps the next sync's diff
  // identical to this one for that data — so failed creates/updates/deletes
  // get retried next time instead of silently falling out of the diff
  // (which would happen if we baked "current but never-persisted" state in
  // as the new baseline).
  for (const adapter of RESOURCE_ADAPTERS) {
    if (failedEndpoints.has(adapter.endpoint)) {
      nextSnapshot[adapter.recordKey as string] =
        prevSnapshot[adapter.recordKey as string] ?? new Map()
      continue
    }
    const rows: any[] = patchedRecord[adapter.recordKey] ?? []
    const map = new Map<string, SnapshotRow>()
    for (const row of rows) map.set(row.id, { id: row.id, fields: adapter.toPayload(row) })
    nextSnapshot[adapter.recordKey as string] = map
  }

  return { record: patchedRecord, snapshot: nextSnapshot, errors }
}