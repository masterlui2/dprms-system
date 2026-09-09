// src/services/useQuarterAutoSave.ts
import api from '../lib/axios'
import { RESOURCE_ADAPTERS, type ResourceAdapter } from './quarterResourceAdapter'
import type { SetupMonitoringQuarterRecord } from '../types/setupMonitoring'

type SnapshotRow = {
  id: string
  backendId: number | null
  fields: Record<string, any>
}
export type QuarterSnapshot = Record<string, Map<string, SnapshotRow>>

export function buildSnapshot(record: SetupMonitoringQuarterRecord): QuarterSnapshot {
  const snapshot: QuarterSnapshot = {}
  for (const adapter of RESOURCE_ADAPTERS) {
    const rows: any[] = (record as any)[adapter.recordKey] ?? []
    const map = new Map<string, SnapshotRow>()
    for (const row of rows) {
      map.set(row.id, {
        id: row.id,
        backendId: backendIdFrom(row.id),
        fields: adapter.toPayload(row, record),
      })
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
  snapshot: QuarterSnapshot
  /**
   * Non-empty if one or more backend endpoints failed. The snapshot still
   * acknowledges successful endpoints so their creates are not duplicated.
   */
  errors: SyncEndpointError[]
}

export async function syncQuarter(
  quarterId: number,
  record: SetupMonitoringQuarterRecord,
  prevSnapshot: QuarterSnapshot,
): Promise<SyncResult> {
  const nextSnapshot: QuarterSnapshot = {}

  // Group adapters by endpoint since several arrays share one backend table
  const byEndpoint = new Map<string, ResourceAdapter[]>()
  for (const adapter of RESOURCE_ADAPTERS) {
    const list = byEndpoint.get(adapter.endpoint) ?? []
    list.push(adapter)
    byEndpoint.set(adapter.endpoint, list)
  }

  const errors: SyncEndpointError[] = []
  const failedEndpoints = new Set<string>()
  const createdBackendIds = new Map<string, number>()

  const requests = Array.from(byEndpoint.entries()).map(async ([endpoint, adapters]) => {
    const creates: any[] = []
    const updates: any[] = []
    const deletes: number[] = []
    const tempIdLocations: { tempId: string; recordKey: string }[] = []

    for (const adapter of adapters) {
      const rows: any[] = (record as any)[adapter.recordKey] ?? []
      const prevRows = prevSnapshot[adapter.recordKey as string] ?? new Map()
      const seenIds = new Set<string>()

      rows.forEach((row) => {
        seenIds.add(row.id)
        const prevRow = prevRows.get(row.id)
        const payload = adapter.toPayload(row, record)

        if (!prevRow) {
          // never synced before -> create
          creates.push({ temp_id: row.id, ...payload })
          tempIdLocations.push({ tempId: row.id, recordKey: adapter.recordKey as string })
        } else if (!shallowEqual(prevRow.fields, payload) && prevRow.backendId) {
          updates.push({ id: prevRow.backendId, ...payload })
        }
      })

      // anything in the snapshot but missing from current rows -> delete
      for (const [id, previous] of prevRows) {
        if (!seenIds.has(id)) {
          if (previous.backendId) deletes.push(previous.backendId)
        }
      }
    }

    if (creates.length === 0 && updates.length === 0 && deletes.length === 0) return

    try {
      const { data } = await api.post(
        `/quarterly-metrics/${quarterId}/${endpoint}/batch`,
        { creates, updates, deletes },
      )

      // Keep UI row ids stable and store the backend identity in the
      // snapshot. Changing a React row key here would steal input focus.
      const returned: any[] = data.data ?? []
      for (const created of returned) {
        if (!created.temp_id) continue
        const loc = tempIdLocations.find((l) => l.tempId === created.temp_id)
        if (!loc) continue
        createdBackendIds.set(`${loc.recordKey}:${loc.tempId}`, Number(created.id))
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

  // Rebuild the snapshot from the submitted record. For any endpoint that
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
    const recordKey = adapter.recordKey as string
    const rows: any[] = (record as any)[adapter.recordKey] ?? []
    const previousRows = prevSnapshot[recordKey] ?? new Map<string, SnapshotRow>()
    const map = new Map<string, SnapshotRow>()
    for (const row of rows) {
      map.set(row.id, {
        id: row.id,
        backendId:
          previousRows.get(row.id)?.backendId
          ?? createdBackendIds.get(`${recordKey}:${row.id}`)
          ?? null,
        fields: adapter.toPayload(row, record),
      })
    }
    nextSnapshot[recordKey] = map
  }

  return { snapshot: nextSnapshot, errors }
}
