// src/services/useAutoSavedExecutiveSummary.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { buildSnapshot, syncBatch, type Snapshot, type SyncEndpointError } from './batchSync'
import { EXEC_SUMMARY_ADAPTERS } from './executiveSummaryAdapters'
import { fetchOrCreateExecutiveSummary } from './executiveSummaryStore'
import type { AccomplishmentRow, OutputRow, ActionRow } from '../types/giaMonitoring'

const DEBOUNCE_MS = 1200
export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface ExecSummaryRecord {
  accomplishments: AccomplishmentRow[]
  outputs: OutputRow[]
  actions: ActionRow[]
}

/**
 * projectId: pass null for demo/mock projects (no backendId). The hook then
 * never fetches or syncs — record stays null and the caller should fall
 * back to local state, same pattern as the rest of GiaMonitoringForm.
 */
export function useAutoSavedExecutiveSummary(
  projectId: number | null,
  semester: 1 | 2,
  year: number,
  totalBudget: number,
) {
  const [record, setRecord] = useState<ExecSummaryRecord | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errors, setErrors] = useState<SyncEndpointError[]>([])
  const [loading, setLoading] = useState(projectId != null)

  const recordRef = useRef<ExecSummaryRecord | null>(null)
  const snapshotRef = useRef<Snapshot>({})
  const summaryIdRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)
  const dirtyWhileSavingRef = useRef(false)
  const unmountedRef = useRef(false)

    useEffect(() => {
    unmountedRef.current = false

    if (projectId == null) {
        setLoading(false)
        return () => { unmountedRef.current = true }
    }

    setLoading(true)
    fetchOrCreateExecutiveSummary(projectId, semester, year, totalBudget)
        .then(({ summaryId, accomplishments, outputs, actions }) => {
        if (unmountedRef.current) return
        const rec = { accomplishments, outputs, actions }
        recordRef.current = rec
        snapshotRef.current = buildSnapshot(rec, EXEC_SUMMARY_ADAPTERS)
        summaryIdRef.current = summaryId
        setRecord(rec)
        setStatus('idle')
        setErrors([])
        })
        .catch((error) => {
        if (unmountedRef.current) return
        // Previously silent — a failed GET or POST here just left the hook
        // stuck with summaryIdRef null forever, no error surfaced anywhere.
        console.error('Failed to load/create executive summary:', error)
        setStatus('error')
        setErrors([{ endpoint: 'executive-summary', error }])
        })
        .finally(() => {
        if (!unmountedRef.current) setLoading(false)
        })

    return () => {
        unmountedRef.current = true
        if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, semester, year])

  const runSync = useCallback(async () => {
    const id = summaryIdRef.current
    if (id == null || !recordRef.current) return
    if (inFlightRef.current) {
      dirtyWhileSavingRef.current = true
      return
    }

    inFlightRef.current = true
    setStatus('saving')
    try {
      const result = await syncBatch(
        id,
        recordRef.current,
        snapshotRef.current,
        EXEC_SUMMARY_ADAPTERS,
        (summaryId, endpoint) => `/executive-summary/${summaryId}/${endpoint}/batch`,
      )
      if (unmountedRef.current) return
      snapshotRef.current = result.snapshot
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
    if (summaryIdRef.current == null) return
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus('pending')
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      runSync()
    }, DEBOUNCE_MS)
  }, [runSync])

  const updateAccomplishments = useCallback((rows: AccomplishmentRow[]) => {
    const next = {
        accomplishments: rows,
        outputs: recordRef.current?.outputs ?? [],
        actions: recordRef.current?.actions ?? [],
    }
    recordRef.current = next
    setRecord(next)
    scheduleSync()
    }, [scheduleSync])


  const updateOutputs = useCallback((rows: OutputRow[]) => {
    const next = {
        accomplishments: recordRef.current?.accomplishments ?? [],
        outputs: rows,
        actions: recordRef.current?.actions ?? [],
    }
    recordRef.current = next
    setRecord(next)
    scheduleSync()
    }, [scheduleSync])

    const updateActions = useCallback((rows: ActionRow[]) => {
    const next = {
        accomplishments: recordRef.current?.accomplishments ?? [],
        outputs: recordRef.current?.outputs ?? [],
        actions: rows,
    }
    recordRef.current = next
    setRecord(next)
    scheduleSync()
    }, [scheduleSync])

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    return runSync()
  }, [runSync])

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        runSync()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return { record, updateAccomplishments, updateOutputs, updateActions, status, errors, loading, flush }
}