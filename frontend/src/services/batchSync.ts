// src/services/batchSync.ts
import api from '../lib/axios'

export type SnapshotRow = { id: string; backendId: number | null; fields: Record<string, any> }
export type Snapshot = Record<string, Map<string, SnapshotRow>>

export interface ResourceAdapter<TFrontend = any> {
  endpoint: string
  recordKey: string
  toPayload: (item: TFrontend, record?: any) => Record<string, any>
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

export function buildSnapshot(record: any, adapters: ResourceAdapter[]): Snapshot {
  const snapshot: Snapshot = {}
  for (const adapter of adapters) {
    const rows: any[] = record[adapter.recordKey] ?? []
    const map = new Map<string, SnapshotRow>()
    for (const row of rows) {
      map.set(row.id, { id: row.id, backendId: backendIdFrom(row.id), fields: adapter.toPayload(row, record) })
    }
    snapshot[adapter.recordKey] = map
  }
  return snapshot
}

export interface SyncEndpointError { endpoint: string; error: unknown }
interface SyncResult { snapshot: Snapshot; errors: SyncEndpointError[] }

export async function syncBatch(
  containerId: number,
  record: any,
  prevSnapshot: Snapshot,
  adapters: ResourceAdapter[],
  urlFor: (containerId: number, endpoint: string) => string,
): Promise<SyncResult> {
  const nextSnapshot: Snapshot = {}
  const byEndpoint = new Map<string, ResourceAdapter[]>()
  for (const adapter of adapters) {
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
      const rows: any[] = record[adapter.recordKey] ?? []
      const prevRows = prevSnapshot[adapter.recordKey] ?? new Map()
      const seenIds = new Set<string>()

      rows.forEach((row) => {
        seenIds.add(row.id)
        const prevRow = prevRows.get(row.id)
        const payload = adapter.toPayload(row, record)

        if (!prevRow) {
          creates.push({ temp_id: row.id, ...payload })
          tempIdLocations.push({ tempId: row.id, recordKey: adapter.recordKey })
        } else if (!shallowEqual(prevRow.fields, payload) && prevRow.backendId) {
          updates.push({ id: prevRow.backendId, ...payload })
        }
      })

      for (const [id, previous] of prevRows) {
        if (!seenIds.has(id) && previous.backendId) deletes.push(previous.backendId)
      }
    }

    if (creates.length === 0 && updates.length === 0 && deletes.length === 0) return

    try {
      const { data } = await api.post(urlFor(containerId, endpoint), { creates, updates, deletes })
      const returned: any[] = data.data ?? []

      // --- Resolve temp_id -> real backend id for every row we just created ---
      // Preferred path: the backend echoes back the temp_id we sent.
      const matchedTempIds = new Set<string>()
      const createdReturned = returned.filter((r) => r.temp_id !== undefined && r.temp_id !== null)

      for (const created of createdReturned) {
        const loc = tempIdLocations.find((l) => l.tempId === created.temp_id)
        if (!loc) continue
        createdBackendIds.set(`${loc.recordKey}:${loc.tempId}`, Number(created.id))
        matchedTempIds.add(loc.tempId)
      }

      // Fallback path: backend didn't echo temp_id at all (or only partially).
      // Assume the response for freshly-created rows preserves the order of
      // `creates`, and match whatever's left positionally rather than
      // silently dropping the mapping (which orphans the row: it never gets
      // a backendId, so it's skipped on every future sync — neither
      // recreated nor updated).
      const unmatchedLocs = tempIdLocations.filter((l) => !matchedTempIds.has(l.tempId))
      const unmatchedReturned = returned.filter(
        (r) => r.temp_id === undefined || r.temp_id === null || !matchedTempIds.has(r.temp_id),
      )

      if (unmatchedLocs.length > 0) {
        if (unmatchedLocs.length === unmatchedReturned.length) {
          unmatchedLocs.forEach((loc, i) => {
            createdBackendIds.set(`${loc.recordKey}:${loc.tempId}`, Number(unmatchedReturned[i].id))
          })
        } else {
          // Counts don't line up — guessing an order here would risk wiring
          // a row to the wrong backend id, which is worse than leaving it
          // unresolved. Surface it loudly instead of failing silently.
          console.error(
            `[syncBatch] Could not resolve backend ids for endpoint "${endpoint}". ` +
              `Expected ${unmatchedLocs.length} unmatched creates, got ${unmatchedReturned.length} in response.`,
            { unmatchedLocs, returned },
          )
          errors.push({
            endpoint,
            error: new Error(`Unresolved created ids for ${endpoint}: backend response did not echo temp_id and counts mismatched.`),
          })
        }
      }
    } catch (error) {
      errors.push({ endpoint, error })
      failedEndpoints.add(endpoint)
    }
  })

  await Promise.all(requests)

  for (const adapter of adapters) {
    if (failedEndpoints.has(adapter.endpoint)) {
      nextSnapshot[adapter.recordKey] = prevSnapshot[adapter.recordKey] ?? new Map()
      continue
    }
    const recordKey = adapter.recordKey
    const rows: any[] = record[recordKey] ?? []
    const previousRows = prevSnapshot[recordKey] ?? new Map<string, SnapshotRow>()
    const map = new Map<string, SnapshotRow>()
    for (const row of rows) {
      map.set(row.id, {
        id: row.id,
        backendId: previousRows.get(row.id)?.backendId ?? createdBackendIds.get(`${recordKey}:${row.id}`) ?? null,
        fields: adapter.toPayload(row, record),
      })
    }
    nextSnapshot[recordKey] = map
  }

  return { snapshot: nextSnapshot, errors }
}