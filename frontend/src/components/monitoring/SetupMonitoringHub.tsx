import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileDown,
  Globe2,
  LoaderCircle,
  MapPin,
  PenTool,
  QrCode,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  TrendingUp,
  Users2,
  X,
} from 'lucide-react'
import {
  computeEmploymentTotals,
  computeProductionCostTotals,
  computeSalesTotals,
  createQuarterlyMetric,
  fetchQuarterlyMetricsWithId,
  saveQuarterRecord,
  type CreateQuarterlyMetricError,
} from '../../services/setupMonitoringStore'
import {
  buildSnapshot,
  syncQuarter,
  type QuarterSnapshot,
  type SyncEndpointError,
} from '../../services/useQuarterAutoSave'
import type { Quarter, SetupMonitoringQuarterRecord } from '../../types/setupMonitoring'
import { AssetsTab } from './tabs/AssetsTab'
import { DistributionOutletsTab } from './tabs/DistributionOutletsTab'
import { EmploymentTab } from './tabs/EmploymentTab'
import { NarrativeTab } from './tabs/NarrativeTab'
import { ProductionSalesTab } from './tabs/ProductionSalesTab'
import { TechInterventionTab } from './tabs/TechInterventionTab'
import { ExportMonitoringSheetModal } from './ExportMonitoringSheetModal'
import type { ProjectRecord } from '../../data/admin'
import {
  normalizeSetupMonitoringPeriod,
  setupMonitoringPeriodOptions,
} from '../../utils/setupMonitoringPeriod'

type ActiveTab =
  | 'profile'
  | 'production_sales'
  | 'employment'
  | 'assets'
  | 'outlets'
  | 'technology'
  | 'narrative'

type SyncStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface Props {
  project: ProjectRecord
  // Optional deep-link values. Invalid, pre-inception, and future values fall
  // back to the project's current selectable monitoring period.
  initialQuarter?: Quarter
  initialYear?: number
  onBack?: () => void
  readOnly?: boolean
}

const BACKEND_SYNC_DEBOUNCE_MS = 1200
const LOCAL_DRAFT_DEBOUNCE_MS = 400

export function SetupMonitoringHub({
  project,
  initialQuarter,
  initialYear,
  onBack,
  readOnly = false,
}: Props) {
  const navigate = useNavigate()
  const periodBounds = useMemo(
    () => ({
      approvedAt: project.approvedAt,
      startDate: project.startDate,
    }),
    [project.approvedAt, project.startDate],
  )
  const quarterOptions = useMemo(
    () => setupMonitoringPeriodOptions(periodBounds),
    [periodBounds],
  )
  const initialPeriod = useMemo(
    () => normalizeSetupMonitoringPeriod(initialQuarter, initialYear, periodBounds),
    [initialQuarter, initialYear, periodBounds],
  )

  // Keep year and quarter in one state value so a period change can never
  // briefly request a new quarter with the previous year (or vice versa).
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod)
  const selectedQuarter = selectedPeriod.quarter
  const selectedYear = selectedPeriod.year
  const [activeTab, setActiveTab] = useState<ActiveTab>('production_sales')
  const [record, setRecord] = useState<SetupMonitoringQuarterRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showSummarySidebar, setShowSummarySidebar] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now')

  // Backend batch-sync state (everything except Narrative — see NOTE below).
  const [quarterMetricId, setQuarterMetricId] = useState<number | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncErrors, setSyncErrors] = useState<SyncEndpointError[]>([])

  // Creating the backend quarterly_metrics row (POST .../quarterly-metrics)
  // for a project/quarter/year combo that doesn't have one yet.
  const [isCreatingQuarter, setIsCreatingQuarter] = useState(false)
  const [createQuarterError, setCreateQuarterError] = useState<string | null>(null)

  const loadRequestRef = useRef(0)
  const localDraftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backendSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Refs mirroring the state above so the debounced sync loop always reads
  // the latest values without re-binding on every keystroke.
  const recordRef = useRef<SetupMonitoringQuarterRecord | null>(null)
  const snapshotRef = useRef<QuarterSnapshot>({})
  const quarterMetricIdRef = useRef<number | null>(null)
  const backendInFlightRef = useRef(false)
  const backendDirtyWhileSavingRef = useRef(false)
  const recordVersionRef = useRef(0)

  const projectBackendId = String(project.backendId ?? project.id)

  const clearPendingTimers = () => {
    if (localDraftTimerRef.current) {
      clearTimeout(localDraftTimerRef.current)
      localDraftTimerRef.current = null
    }
    if (backendSyncTimerRef.current) {
      clearTimeout(backendSyncTimerRef.current)
      backendSyncTimerRef.current = null
    }
  }

  const loadQuarter = () => {
    const requestId = ++loadRequestRef.current
    setIsLoading(true)
    setLoadError(null)
    setCreateQuarterError(null)
    quarterMetricIdRef.current = null
    setQuarterMetricId(null)
    backendDirtyWhileSavingRef.current = false
    clearPendingTimers()

    // Do not leave the previous quarter's figures visible under the newly
    // selected period while its request is in flight.
    if (
      recordRef.current
      && (
        recordRef.current.quarter !== selectedQuarter
        || recordRef.current.year !== selectedYear
      )
    ) {
      recordRef.current = null
      snapshotRef.current = {}
      setRecord(null)
    }

    fetchQuarterlyMetricsWithId(projectBackendId, selectedYear, selectedQuarter, {
      enterpriseName: project.enterprise,
      enterpriseAddress: project.location,
    })
      .then(({ record: loaded, quarterMetricId: qid }) => {
        if (requestId !== loadRequestRef.current) return
        recordVersionRef.current = 0
        recordRef.current = loaded
        snapshotRef.current = buildSnapshot(loaded)
        quarterMetricIdRef.current = qid
        setRecord(loaded)
        setQuarterMetricId(qid)
        setSyncStatus('idle')
        setSyncErrors([])
      })
      .catch((error) => {
        if (requestId !== loadRequestRef.current) return
        console.error('Failed to load quarterly metrics:', error)
        setLoadError('Could not load quarterly metrics from the server.')
      })
      .finally(() => {
        if (requestId === loadRequestRef.current) setIsLoading(false)
      })
  }

  useEffect(() => {
    loadQuarter()
    return () => {
      loadRequestRef.current += 1
      clearPendingTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectBackendId, selectedYear, selectedQuarter, project.enterprise, project.location])

  // --- Backend sync (everything except Narrative) ---
  // NOTE: problemsAndActions / plansForImprovement / signOff have no
  // corresponding entry in RESOURCE_ADAPTERS, so syncQuarter never touches
  // them — they only ever get persisted via the local-draft save below. This
  // is intentional: the Narrative backend endpoint isn't being fixed right
  // now. Don't add a narrative adapter to "complete" this without confirming
  // that's resolved.
  const runBackendSync = () => {
    const qid = quarterMetricIdRef.current
    if (qid == null || !recordRef.current) return

    if (backendInFlightRef.current) {
      backendDirtyWhileSavingRef.current = true
      return
    }

    const requestId = loadRequestRef.current
    const syncedVersion = recordVersionRef.current
    const recordToSync = recordRef.current
    const snapshotToSync = snapshotRef.current

    backendInFlightRef.current = true
    setSyncStatus('saving')
    syncQuarter(qid, recordToSync, snapshotToSync)
      .then((result) => {
        if (
          requestId !== loadRequestRef.current
          || qid !== quarterMetricIdRef.current
        ) return

        // Advance only the persisted baseline. A response must never replace
        // newer edits in the live form or remount the currently focused row.
        snapshotRef.current = result.snapshot
        setSyncErrors(result.errors)
        setSyncStatus(
          recordVersionRef.current === syncedVersion
            ? (result.errors.length > 0 ? 'error' : 'saved')
            : 'pending',
        )
        if (result.errors.length > 0) {
          console.error('Some quarterly-metrics sections failed to save:', result.errors)
        }
      })
      .catch((error) => {
        if (
          requestId !== loadRequestRef.current
          || qid !== quarterMetricIdRef.current
        ) return
        console.error('Quarter sync failed outright:', error)
        setSyncStatus('error')
      })
      .finally(() => {
        backendInFlightRef.current = false
        if (backendDirtyWhileSavingRef.current) {
          backendDirtyWhileSavingRef.current = false
          if (backendSyncTimerRef.current) {
            clearTimeout(backendSyncTimerRef.current)
            backendSyncTimerRef.current = null
          }
          runBackendSync()
        }
      })
  }

  const handleRecordChange = (updated: SetupMonitoringQuarterRecord) => {
    recordVersionRef.current += 1
    recordRef.current = updated
    setRecord(updated)

    // Local draft save — always runs, regardless of backend availability.
    // This is what keeps Narrative edits from being lost, since they never
    // reach the server.
    if (localDraftTimerRef.current) clearTimeout(localDraftTimerRef.current)
    localDraftTimerRef.current = setTimeout(() => {
      saveQuarterRecord(updated)
      const now = new Date()
      setLastSavedTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      )
    }, LOCAL_DRAFT_DEBOUNCE_MS)

    // Backend batch sync — only if this quarter already has a backend row.
    if (quarterMetricIdRef.current != null) {
      if (backendInFlightRef.current) backendDirtyWhileSavingRef.current = true
      if (backendSyncTimerRef.current) clearTimeout(backendSyncTimerRef.current)
      setSyncStatus('pending')
      backendSyncTimerRef.current = setTimeout(() => {
        backendSyncTimerRef.current = null
        runBackendSync()
      }, BACKEND_SYNC_DEBOUNCE_MS)
    }
  }

  const handleManualSave = () => {
    if (!record) return
    saveQuarterRecord(record)
    const now = new Date()
    setLastSavedTime(
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    )

    if (backendSyncTimerRef.current) {
      clearTimeout(backendSyncTimerRef.current)
      backendSyncTimerRef.current = null
    }
    if (quarterMetricIdRef.current != null) {
      runBackendSync()
    }
  }

  const handleRetry = () => {
    loadQuarter()
  }

  const handlePeriodChange = (value: string) => {
    const nextPeriod = quarterOptions.find((option) => option.value === value)
    if (
      !nextPeriod
      || (
        nextPeriod.quarter === selectedQuarter
        && nextPeriod.year === selectedYear
      )
    ) return

    // Invalidate any older request immediately. The effect for the new
    // period will issue a fresh request with the matching year and quarter.
    loadRequestRef.current += 1
    clearPendingTimers()
    recordRef.current = null
    snapshotRef.current = {}
    quarterMetricIdRef.current = null
    setRecord(null)
    setQuarterMetricId(null)
    setIsLoading(true)
    setLoadError(null)
    setCreateQuarterError(null)
    setSelectedPeriod({
      quarter: nextPeriod.quarter,
      year: nextPeriod.year,
    })
  }

  // Creates the missing backend quarterly_metrics row for the currently
  // selected quarter/year, then immediately pushes whatever is already in
  // the local draft (record) up to the server so nothing typed before
  // creation is lost.
  const handleCreateQuarterRecord = () => {
    if (isCreatingQuarter) return
    setIsCreatingQuarter(true)
    setCreateQuarterError(null)

    createQuarterlyMetric(projectBackendId, selectedYear, selectedQuarter)
      .then((qid) => {
        quarterMetricIdRef.current = qid
        setQuarterMetricId(qid)
        // Push the existing local-draft record up now that a backend row
        // exists to sync it against.
        if (recordRef.current) {
          runBackendSync()
        }
      })
      .catch((error) => {
        console.error('Failed to create quarterly metrics record:', error)
        const payload = error?.response?.data as CreateQuarterlyMetricError | undefined
        const validationMessage = payload?.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload?.message
        setCreateQuarterError(
          validationMessage ||
            'Could not create a quarterly metrics record for this quarter. Please try again.',
        )
      })
      .finally(() => {
        setIsCreatingQuarter(false)
      })
  }

  const salesTotals = record ? computeSalesTotals(record) : null
  const costTotals = record ? computeProductionCostTotals(record) : null
  const empTotals = record ? computeEmploymentTotals(record) : null

  const totalBuildingBookValue =
    record?.buildingAssets.reduce((sum, b) => sum + (b.bookValue || 0), 0) ?? 0
  const totalEquipmentBookValue =
    record && record.equipmentAssets.length > 0
      ? record.equipmentAssets.reduce((sum, eq) => sum + (eq.bookValue || 0), 0)
      : (project.equipmentRecords?.reduce((sum, eq) => sum + (eq.book_value || 0), 0) ?? 0)
  const totalFixedAssets = totalBuildingBookValue + totalEquipmentBookValue

  const totalFunding = project.budget || 0
  const totalRefunded = project.used || 0
  const hasFunding = totalFunding > 0
  const refundPercentage = hasFunding
    ? Math.min(100, Math.round((totalRefunded / totalFunding) * 100))
    : 0

  const tabs: Array<{
    id: ActiveTab
    label: string
    icon: typeof Building2
  }> = [
    {
      id: 'profile',
      label: 'Profile & Details',
      icon: Store,
    },
    {
      id: 'production_sales',
      label: 'Production & Sales',
      icon: TrendingUp,
    },
    {
      id: 'employment',
      label: 'Employment',
      icon: Users2,
    },
    {
      id: 'assets',
      label: 'Assets & Capital',
      icon: Building2,
    },
    {
      id: 'outlets',
      label: 'Distribution Outlets',
      icon: Globe2,
    },
    {
      id: 'technology',
      label: 'Technology Intervention',
      icon: Sparkles,
    },
    {
      id: 'narrative',
      label: 'Narrative & Sign-off',
      icon: PenTool,
    },
  ]

  const activeTabTitle = tabs.find((t) => t.id === activeTab)?.label || 'Quarterly Monitoring'
  const canSyncToBackend = quarterMetricId != null

  if (isLoading && !record) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-2xl border border-[#B5BFCD]/80 bg-white text-sm font-semibold text-slate-500 shadow-sm">
        <LoaderCircle className="mr-2 size-5 animate-spin text-[#285497]" />
        Loading {selectedQuarter} {selectedYear} monitoring data...
      </div>
    )
  }

  if (loadError && !record) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white px-6 text-center shadow-sm">
        <p className="text-sm font-bold text-rose-700">{loadError}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0b3f8b]"
        >
          <RefreshCw className="size-3.5" /> Retry
        </button>
      </div>
    )
  }

  if (!record) {
    return null
  }

  return (
    <div className="w-full space-y-4 pb-20 font-sans">
      {/* Upper Header Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center text-slate-500 transition hover:text-[#0f53b7] hover:underline cursor-pointer"
          >
            DOST Regional Monitoring Hub
          </button>
        ) : (
          <span>DOST Regional Monitoring Hub</span>
        )}
        <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center text-slate-500 transition hover:text-[#0f53b7] hover:underline cursor-pointer"
          >
            Monitored Projects
          </button>
        ) : (
          <span>Monitored Projects</span>
        )}
        <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
        <span className="font-bold text-[#285497]">{activeTabTitle}</span>
      </nav>

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-1">
        <div className="flex items-center gap-3">
          <span className="h-10 w-1.5 rounded-full bg-[#0f53b7] shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {project.enterprise || project.title || record.enterpriseName}
              </h1>
              <span className="rounded-lg bg-[#E6EEF4] px-2.5 py-0.5 font-mono text-xs font-bold text-[#285497]">
                {project.referenceNumber || project.id}
              </span>
              {loadError && (
                <span
                  className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700"
                  title={loadError}
                >
                  Showing cached data
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {project.proposalId ? (
            <button
              type="button"
              onClick={() => navigate(`/dashboard/document-checklist?proposalId=${project.proposalId}&program=SETUP`)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-[#0f53b7] active:scale-95 cursor-pointer"
              title="Open Master Document Checklist"
            >
              <FileCheck2 className="size-4 text-[#0f53b7]" />
              <span>Master Checklist</span>
            </button>
          ) : null}

          {/* Project-bound quarter selector. Historical periods remain
              available for backfill, while future periods never appear. */}
          <div className="flex h-9 items-center overflow-hidden rounded-xl border border-[#B5BFCD] bg-white shadow-2xs focus-within:border-[#0f53b7]">
            <select
              aria-label="Monitoring period"
              disabled={isCreatingQuarter}
              value={`${selectedQuarter} ${selectedYear}`}
              onChange={(event) => handlePeriodChange(event.target.value)}
              className="h-full cursor-pointer bg-transparent px-3 text-xs font-bold text-slate-700 outline-none disabled:cursor-wait disabled:opacity-60"
            >
              {quarterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Summary Metrics Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => setShowSummarySidebar(!showSummarySidebar)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer ${
              showSummarySidebar
                ? 'border-[#0f53b7] bg-[#0f53b7] text-white shadow-md'
                : 'border-[#B5BFCD] bg-white text-slate-700 hover:bg-[#E6EEF4] hover:text-[#285497]'
            }`}
            title="Toggle Live Summary Sidebar"
          >
            <BarChart3 className="size-4" />
            <span>Summary KPI</span>
          </button>

          {/* Save Snapshot Button */}
          <button
            type="button"
            onClick={handleManualSave}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 shadow-2xs transition hover:bg-[#E6EEF4] hover:text-[#285497] active:scale-95 cursor-pointer"
            title="Save Snapshot"
          >
            <SlidersHorizontal className="size-4" />
          </button>

          {/* Generate Report / Export Button */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] active:scale-95 cursor-pointer"
          >
            <FileDown className="size-4" />
            <span>Export Sheet</span>
          </button>
        </div>
      </div>

      {!canSyncToBackend && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
          <p className="text-xs text-amber-700">
            No backend record exists yet for {selectedQuarter} {selectedYear} — changes are being
            kept as a local draft only until this quarter is created on the server.
          </p>
          <button
            type="button"
            onClick={handleCreateQuarterRecord}
            disabled={isCreatingQuarter || readOnly}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingQuarter ? (
              <>
                <LoaderCircle className="size-3 animate-spin" /> Creating...
              </>
            ) : (
              <>Create quarterly metrics record</>
            )}
          </button>
        </div>
      )}

      {createQuarterError && (
        <div className="flex items-center justify-between text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 shadow-2xs">
          <span>{createQuarterError}</span>
          <button
            type="button"
            onClick={handleCreateQuarterRecord}
            disabled={isCreatingQuarter}
            className="ml-3 shrink-0 inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        </div>
      )}

      {syncStatus === 'error' && syncErrors.length > 0 && (
        <div className="flex items-center justify-between text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 shadow-2xs">
          <span>
            {syncErrors.length} section{syncErrors.length === 1 ? '' : 's'} failed to save to the
            server ({syncErrors.map((e) => e.endpoint).join(', ')}). Your edits are still kept as a
            local draft.
          </span>
          <button
            type="button"
            onClick={handleManualSave}
            className="ml-3 shrink-0 inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs & Autosave Status */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#B5BFCD]/50 pb-0.5">
        <div className="flex max-w-full items-center gap-6 overflow-x-auto scrollbar-none pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative inline-flex shrink-0 items-center gap-2 pb-2.5 text-xs transition-all duration-150 ease-out ${
                  isActive
                    ? 'font-bold text-[#0f53b7] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#0f53b7] after:rounded-full'
                    : 'font-medium text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`size-3.5 ${isActive ? 'text-[#0f53b7]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 pb-2 pr-1">
          {canSyncToBackend ? (
            syncStatus === 'pending' ? (
              <>
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Unsaved changes...</span>
              </>
            ) : syncStatus === 'saving' ? (
              <>
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Saving...</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <span className="size-2 rounded-full bg-rose-500" />
                <span>Save failed</span>
              </>
            ) : (
              <>
                <Check className="size-3 text-emerald-600" />
                <span>Saved {lastSavedTime}</span>
              </>
            )
          ) : (
            <>
              <span className="size-2 rounded-full bg-slate-400" />
              <span>Local draft saved {lastSavedTime}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Layout with Optional Summary Sidebar */}
      <div className="flex items-start gap-5">
        {/* Left: Active Tab Content */}
        <div className="min-w-0 flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Executive Operational KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-emerald-200/80 bg-linear-to-br from-emerald-50/70 to-emerald-100/30 p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        {hasFunding ? 'Approved Funding & Balance' : 'Repayment Terms'}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {hasFunding ? `${refundPercentage}% Refunded` : 'Pending'}
                      </span>
                    </div>
                    {hasFunding ? (
                      <>
                        <p className="mt-2 text-xl font-black text-emerald-950">
                          ₱{(totalFunding - totalRefunded).toLocaleString()}
                        </p>
                        <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 block">
                          of ₱{totalFunding.toLocaleString()} total funding
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-base font-bold text-slate-600">
                          Schedule Pending
                        </p>
                        <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                          Repayment terms not initialized
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mt-3.5 h-1.5 w-full rounded-full bg-emerald-200/70 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${refundPercentage}%` }} />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200/80 bg-linear-to-br from-blue-50/70 to-blue-100/30 p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0f53b7]">Active Monitoring Cycle</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0f53b7]">
                        {selectedQuarter} {selectedYear}
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-black text-slate-900">
                      {project.dueDate || project.latestReport?.dueDate || `${selectedQuarter} ${selectedYear}`}
                    </p>
                    <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                      {project.latestReport?.status ? `Report: ${project.latestReport.status}` : 'Quarterly Monitoring Period'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>{project.compliance === 'Overdue' ? 'Action Required' : 'Schedule On Track'}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-200/80 bg-linear-to-br from-purple-50/70 to-purple-100/30 p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">Equipment Outlay</span>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        {(project.equipmentRecords?.length ?? record.equipmentAssets.length)} Units
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-black text-purple-950">
                      {(project.equipmentRecords?.length ?? record.equipmentAssets.length) > 0 ? 'Deployed & Logged' : 'No Outlay Recorded'}
                    </p>
                    <span className="text-[11px] font-semibold text-purple-700 mt-0.5 block">
                      Verified Machinery Inventory
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-purple-800">
                    <QrCode className="size-3.5" />
                    <span>Inspection Ready</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100/50 p-4.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Master Checklist</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {project.checklistStats ? `${project.checklistStats.percentage}% Complied` : 'Compliant'}
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-black text-slate-900">
                      {project.checklistStats ? `${project.checklistStats.complied} of ${project.checklistStats.total} Docs` : 'Document Sets'}
                    </p>
                    <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                      Legal & Audit Clearance Satisfied
                    </span>
                  </div>
                  {project.proposalId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/document-checklist?proposalId=${project.proposalId}&program=SETUP`)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0f53b7] hover:underline"
                    >
                      <span>Open Master Checklist</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 2-Column Comprehensive Dossier */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Column 1: Enterprise Legal Identity & Ownership */}
                <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#0f53b7]">
                        <Building2 className="size-4.5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Enterprise Legal Profile</h3>
                        <p className="text-xs text-slate-500">Business registration and proponent background</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                      ✓ Auto-Inherited
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Registered Enterprise Name</span>
                      <p className="mt-1 text-sm font-bold text-slate-900">{project.enterprise || project.title || record.enterpriseName}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Proponent / Lead Person</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">{project.proponentName || project.manager || 'Proponent'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Priority Industry Sector</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">{project.industrySector || 'Food Processing'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Business Structure & Scale</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">
                          {project.businessStructure || 'Sole Proprietorship'}
                          {project.enterpriseSize ? ` · ${project.enterpriseSize} Enterprise` : ''}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact Information</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">{project.contactNumber || 'Not recorded'}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Manufacturing & Operating Facility</span>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <MapPin className="size-3.5 text-[#0f53b7] shrink-0" />
                        <span>{project.location || record.enterpriseAddress || 'Location not recorded'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Program Operations & Monitoring Mandate */}
                <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                        <ShieldCheck className="size-4.5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Program Directives & Mandate</h3>
                        <p className="text-xs text-slate-500">DOST execution terms and monitoring supervision</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0f53b7] border border-blue-200">
                      Active Execution
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">DOST Reference / Resolution No.</span>
                      <p className="mt-1 text-sm font-mono font-black text-[#0f53b7]">{project.referenceNumber || project.id}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assigned Monitoring Officer</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">{project.manager || 'Unassigned'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">PSTO Implementing Center</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">
                          DOST PSTO {project.district || 'Davao Region'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Focal / Supervision Officer</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">{project.focalOfficer || 'PSTO Focal Person'}</p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Implementation Cycle</span>
                        <p className="mt-1 text-xs font-bold text-slate-900">
                          {project.startDate ? `${project.startDate} to ${project.dueDate || 'Present'}` : '36 Months (3 Years)'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Checklist Verification</span>
                        <p className="mt-0.5 text-xs font-bold text-slate-800">
                          {project.checklistStats ? `${project.checklistStats.complied}/${project.checklistStats.total} Document Sets Complied` : 'Pre-implementation Requirements Complied'}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {project.compliance}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment Outlay & Inventory Table Preview */}
              <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                      <QrCode className="size-4.5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Deployed Equipment & Machinery Inventory</h3>
                      <p className="text-xs text-slate-500">QR-tagged capital assets acquired under SETUP grant</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('assets')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0f53b7] hover:underline"
                  >
                    <span>View Assets Tab</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Equipment Description</th>
                        <th className="py-2.5 px-3 text-right">Acquisition</th>
                        <th className="py-2.5 px-3 text-right">Useful Life</th>
                        <th className="py-2.5 px-3 text-right">Acquisition Cost</th>
                        <th className="py-2.5 px-3 text-right">Book Value</th>
                        <th className="py-2.5 px-3 text-center">Condition / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(project.equipmentRecords && project.equipmentRecords.length > 0
                        ? project.equipmentRecords.map((item) => ({
                            id: item.id,
                            equipmentName: item.equipment_name,
                            propertyNumber: item.property_number,
                            serialNumber: item.serial_number,
                            qrReference: item.qr_reference,
                            yearAcquired: item.year_acquired,
                            usefulLifeYears: item.useful_life_years,
                            cost: item.cost,
                            bookValue: item.book_value,
                            condition: item.condition,
                          }))
                        : record.equipmentAssets.length > 0
                          ? record.equipmentAssets.map((item) => ({
                              id: item.id,
                              equipmentName: item.equipmentName,
                              propertyNumber: undefined,
                              serialNumber: undefined,
                              qrReference: undefined,
                              yearAcquired: item.yearAcquired,
                              usefulLifeYears: item.usefulLifeYears,
                              cost: item.cost,
                              bookValue: item.bookValue,
                              condition: 'Operational',
                            }))
                          : []
                      ).map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2 font-bold text-slate-900">
                              <span className="size-1.5 rounded-full bg-[#0f53b7]" />
                              <span>{item.equipmentName}</span>
                            </div>
                            {(item.propertyNumber || item.qrReference) && (
                              <div className="ml-3.5 mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono">
                                {item.propertyNumber && <span>Prop: {item.propertyNumber}</span>}
                                {item.qrReference && (
                                  <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-200">
                                    <QrCode className="size-2.5" />
                                    {item.qrReference}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 font-mono">{item.yearAcquired || 2024}</td>
                          <td className="py-3 px-3 text-right font-medium text-slate-800">{item.usefulLifeYears || 5} yrs</td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">₱{(item.cost || 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#0f53b7]">₱{(item.bookValue || 0).toLocaleString()}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              ✓ {item.condition || 'Operational'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!project.equipmentRecords || project.equipmentRecords.length === 0) && record.equipmentAssets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-xs text-slate-400">
                            No equipment records currently registered for this project.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Direct Operational Navigation Shortcuts */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="size-2 rounded-full bg-[#0f53b7]" />
                  <span>Ready to input quarterly monitoring logs?</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('production_sales')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] active:scale-95"
                  >
                    <span>Proceed to Production & Sales</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'production_sales' && (
            <ProductionSalesTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'employment' && (
            <EmploymentTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'assets' && (
            <AssetsTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'outlets' && (
            <DistributionOutletsTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'technology' && (
            <TechInterventionTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'narrative' && (
            <NarrativeTab
              record={record}
              onChange={handleRecordChange}
              readOnly={readOnly}
            />
          )}
        </div>

        {/* Right: Live Summary KPI Sidebar (Contextual for Active Tab) */}
        {showSummarySidebar && salesTotals && costTotals && empTotals && (
          <aside className="w-80 shrink-0 rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeTabTitle} Summary</h3>
                <p className="text-xs text-slate-400 font-normal">{record.quarter} {record.year} · {record.enterpriseName}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSummarySidebar(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* TAB 1: PRODUCTION & SALES */}
            {activeTab === 'production_sales' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Overview</span>
                    <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[10px] font-bold text-[#285497]">
                      {salesTotals.profitMargin}% Margin
                    </span>
                  </div>
                  <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Grand Total Sales:</span>
                      <span className="font-bold text-slate-900">₱{salesTotals.grandTotalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Grand Total Cost:</span>
                      <span className="font-bold text-slate-900">₱{costTotals.grandTotalProductionCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                      <span className="text-[#285497] font-bold">Net Profit:</span>
                      <span className="font-black text-[#285497]">₱{salesTotals.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cost Structure</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Operating Expenses:</span>
                      <span className="font-semibold text-slate-900">₱{costTotals.operatingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Direct Labor:</span>
                      <span className="font-semibold text-slate-900">₱{costTotals.laborTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Raw Materials:</span>
                      <span className="font-semibold text-slate-900">₱{costTotals.rawMaterialsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Miscellaneous:</span>
                      <span className="font-semibold text-slate-900">₱{costTotals.miscTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMPLOYMENT */}
            {activeTab === 'employment' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Workforce Headcount</span>
                    <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[10px] font-bold text-[#285497]">
                      {empTotals.totalEmployees} Total
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5 text-center">
                      <span className="block text-[10px] text-slate-400 font-bold">MALE</span>
                      <span className="text-lg font-black text-[#285497]">{empTotals.maleCount}</span>
                    </div>
                    <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5 text-center">
                      <span className="block text-[10px] text-slate-400 font-bold">FEMALE</span>
                      <span className="text-lg font-black text-[#285497]">{empTotals.femaleCount}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Roster Distribution</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Direct Employees:</span>
                      <span className="font-semibold text-slate-900">{record.directEmployees.length} staff</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Indirect Employees:</span>
                      <span className="font-semibold text-slate-900">{record.indirectEmployees.length} staff</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#B5BFCD]/50 pt-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sectoral Inclusivity</span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Youth:</span>
                      <span className="font-semibold text-slate-900">{empTotals.youthCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Senior Citizens (SC):</span>
                      <span className="font-semibold text-slate-900">{empTotals.scCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>PWD:</span>
                      <span className="font-semibold text-slate-900">{empTotals.pwdCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ASSETS & CAPITAL */}
            {activeTab === 'assets' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Fixed Asset Value</span>
                  <div className="rounded-xl border border-[#285497]/40 bg-[#E6EEF4] p-3 text-center">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">Combined Net Valuation</span>
                    <span className="text-xl font-black text-[#285497]">
                      ₱{totalFixedAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Asset Category Summary</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Building Book Value:</span>
                      <span className="font-semibold text-slate-900">₱{totalBuildingBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Equipment Book Value:</span>
                      <span className="font-semibold text-slate-900">₱{totalEquipmentBookValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Working Capital Outlay:</span>
                      <span className="font-semibold text-slate-900">
                        ₱{record.workingCapital.reduce((sum, w) => sum + (w.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DISTRIBUTION OUTLETS */}
            {activeTab === 'outlets' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Market Coverage</span>
                  <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">International Markets:</span>
                      <span className="font-bold text-slate-900">{record.internationalMarkets?.length || 0} outlets</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Local Market Outlets:</span>
                      <span className="font-bold text-slate-900">{record.localMarkets?.length || 0} outlets</span>
                    </div>
                    <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                      <span className="text-[#285497] font-bold">Total Distribution Reach:</span>
                      <span className="font-black text-[#285497]">
                        {(record.internationalMarkets?.length || 0) + (record.localMarkets?.length || 0)} channels
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Supply & Forward Network</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Forward Distributors:</span>
                      <span className="font-semibold text-slate-900">{record.forwardDistributors?.length || 0} entities</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Raw Material Suppliers:</span>
                      <span className="font-semibold text-slate-900">{record.forwardSuppliers?.length || 0} partners</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: TECHNOLOGY INTERVENTION */}
            {activeTab === 'technology' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Intervention Portfolio</span>
                  <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Consultancy Services:</span>
                      <span className="font-bold text-slate-900">{record.consultancies?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Trainings Conducted:</span>
                      <span className="font-bold text-slate-900">{record.trainings?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Technology Transfers:</span>
                      <span className="font-bold text-slate-900">{record.techTransfers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Support & Testing Services:</span>
                      <span className="font-bold text-slate-900">{record.supportServices?.length || 0}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                      <span className="text-[#285497] font-bold">Other DOST Projects:</span>
                      <span className="font-black text-[#285497]">{record.otherProjects?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: NARRATIVE & SIGN-OFF */}
            {activeTab === 'narrative' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Validation Status</span>
                  <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Interviewer Sign-off:</span>
                      <span className="font-bold text-slate-900">{record.signOff?.interviewerName ? 'Completed' : 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Respondent Acknowledgment:</span>
                      <span className="font-bold text-slate-900">{record.signOff?.respondentName ? 'Completed' : 'Pending'}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                      <span className="text-[#285497] font-bold">Sheet Status:</span>
                      <span className="font-black text-[#285497]">{record.status}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal leading-relaxed">
                    Narrative & sign-off fields are kept as a local draft only for now and are not
                    yet synced to the server.
                  </p>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Official Sheet Export Modal */}
      {showExportModal && (
        <ExportMonitoringSheetModal
          record={record}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}
