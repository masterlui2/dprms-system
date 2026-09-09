// src/services/useAutoSavedQuarterRecord.ts
//
// Debounced glue between the quarter-monitoring form and syncQuarter().
// NOTE: narrative (problemsAndActions / plansForImprovement) is intentionally
// NOT synced here — there's no narrativeAdapter in RESOURCE_ADAPTERS because
// the backend side of that resource isn't being fixed right now. Those two
// fields stay local-only (they still live on `record` and get edited via
// updateRecord like everything else, they just never round-trip to the
// server). Do not add a narrative adapter to fix this without confirming
// the backend issue is actually resolved.

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchQuarterlyMetricsWithId } from './setupMonitoringStore'
import { buildSnapshot, syncQuarter, type QuarterSnapshot, type SyncEndpointError } from './useQuarterAutoSave'
import type { Quarter, SetupMonitoringQuarterRecord } from '../types/setupMonitoring'

const DEFAULT_DEBOUNCE_MS = 1200

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface Args {
  projectId: string
  year: number
  quarter: Quarter
  overrides?: Partial<Pick<SetupMonitoringQuarterRecord, 'enterpriseName' | 'enterpriseAddress'>>
  debounceMs?: number
}

export function useAutoSavedQuarterRecord({
  projectId,
  year,
  quarter,
  overrides,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: Args) {
  const [record, setRecord] = useState<SetupMonitoringQuarterRecord | null>(null)
  const [quarterMetricId, setQuarterMetricId] = useState<number | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errors, setErrors] = useState<SyncEndpointError[]>([])
  const [loading, setLoading] = useState(true)

  // Refs so the debounce timer / in-flight sync always see the latest data
  // without re-binding callbacks on every keystroke.
  const recordRef = useRef<SetupMonitoringQuarterRecord | null>(null)
  const snapshotRef = useRef<QuarterSnapshot>({})
  const quarterMetricIdRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)
  // A change arrived while a sync was already running -> run once more
  // right after, instead of losing it.
  const dirtyWhileSavingRef = useRef(false)
  const unmountedRef = useRef(false)

  // --- initial load ---
  useEffect(() => {
    unmountedRef.current = false
    setLoading(true)
    fetchQuarterlyMetricsWithId(projectId, year, quarter, overrides)
      .then(({ record: rec, quarterMetricId: qid }) => {
        if (unmountedRef.current) return
        recordRef.current = rec
        snapshotRef.current = buildSnapshot(rec)
        quarterMetricIdRef.current = qid
        setRecord(rec)
        setQuarterMetricId(qid)
        setStatus('idle')
        setErrors([])
      })
      .finally(() => {
        if (!unmountedRef.current) setLoading(false)
      })
    return () => {
      unmountedRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // overrides intentionally excluded — it's a small object literal that
    // would otherwise re-trigger the fetch on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, year, quarter])

  const runSync = useCallback(async () => {
    const qid = quarterMetricIdRef.current
    if (qid == null || !recordRef.current) return

    if (inFlightRef.current) {
      dirtyWhileSavingRef.current = true
      return
    }

    inFlightRef.current = true
    setStatus('saving')
    try {
      const result = await syncQuarter(qid, recordRef.current, snapshotRef.current)
      if (unmountedRef.current) return
      recordRef.current = result.record
      snapshotRef.current = result.snapshot
      setRecord(result.record)
      setErrors(result.errors)
      setStatus(result.errors.length > 0 ? 'error' : 'saved')
    } finally {
      inFlightRef.current = false
      if (dirtyWhileSavingRef.current) {
        dirtyWhileSavingRef.current = false
        runSync()
      }
    }
  }, [])

  const scheduleSync = useCallback(() => {
    if (quarterMetricIdRef.current == null) return // nothing to sync against yet
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus('pending')
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      runSync()
    }, debounceMs)
  }, [debounceMs, runSync])

  // Drop-in replacement for the `onChange` prop every Tab component expects.
  const updateRecord = useCallback(
    (next: SetupMonitoringQuarterRecord) => {
      recordRef.current = next
      setRecord(next)
      scheduleSync()
    },
    [scheduleSync],
  )

  // Force a pending save to run now (e.g. before navigating away or on an
  // explicit "Save" button) instead of waiting out the debounce window.
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    return runSync()
  }, [runSync])

  useEffect(() => {
    return () => {
      // best-effort flush on unmount so a trailing debounced edit isn't lost
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        runSync()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    record,
    updateRecord,
    status,
    errors,
    loading,
    flush,
    /** false until the backend has a row for this project/year/quarter */
    canAutosave: quarterMetricId != null,
  }
}