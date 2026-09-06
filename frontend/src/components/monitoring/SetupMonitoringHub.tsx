import { useEffect, useState, useRef, useMemo } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Check,
  FileDown,
  Globe2,
  LoaderCircle,
  PenTool,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
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

type ActiveTab =
  | 'production_sales'
  | 'employment'
  | 'assets'
  | 'outlets'
  | 'technology'
  | 'narrative'

type SyncStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface Props {
  project: ProjectRecord
  // Both now genuinely optional — when omitted, the hub opens on the real
  // current quarter/year (see getCurrentQuarter()) instead of a hardcoded
  // fallback. Pass these explicitly only when you want to deep-link into a
  // specific historical quarter (e.g. from a report link or query param).
  initialQuarter?: Quarter
  initialYear?: number
  onBack?: () => void
  readOnly?: boolean
}

const BACKEND_SYNC_DEBOUNCE_MS = 1200
const LOCAL_DRAFT_DEBOUNCE_MS = 400

// Single source of truth for "what quarter/year is it right now". Both the
// component's default props and generateQuarterOptions() derive from this,
// so they can never drift apart the way `initialQuarter = 'Q2'` /
// `initialYear = 2024` used to.
function getCurrentQuarter(referenceDate: Date = new Date()): { quarter: Quarter; year: number } {
  const quarterNumber = Math.ceil((referenceDate.getMonth() + 1) / 3)
  return { quarter: `Q${quarterNumber}` as Quarter, year: referenceDate.getFullYear() }
}

// Generates the last N quarters ("Q3 2026", "Q2 2026", ...) counting back from
// today, so the selector isn't frozen on a hardcoded past year.
function generateQuarterOptions(count = 8): Array<{ value: string; label: string; quarter: Quarter; year: number }> {
  const { quarter: startQuarter, year: startYear } = getCurrentQuarter()
  let quarter = Number(startQuarter.slice(1))
  let year = startYear
  const options: Array<{ value: string; label: string; quarter: Quarter; year: number }> = []

  for (let i = 0; i < count; i += 1) {
    const q = `Q${quarter}` as Quarter
    options.push({
      value: `${q} ${year}`,
      label: `${['1st', '2nd', '3rd', '4th'][quarter - 1]} Quarter (${q} ${year})`,
      quarter: q,
      year,
    })
    quarter -= 1
    if (quarter === 0) {
      quarter = 4
      year -= 1
    }
  }

  return options
}

export function SetupMonitoringHub({
  project,
  initialQuarter,
  initialYear,
  onBack,
  readOnly = false,
}: Props) {
  // Computed once per mount; if a caller explicitly passes initialQuarter/
  // initialYear (e.g. deep-linking to a past quarter), that wins. Otherwise
  // fall back to the actual current quarter, not a stale literal.
  const currentQuarter = useMemo(() => getCurrentQuarter(), [])

  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(
    initialQuarter ?? currentQuarter.quarter,
  )
  const [selectedYear, setSelectedYear] = useState<number>(
    initialYear ?? currentQuarter.year,
  )
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

  const quarterOptions = useMemo(() => generateQuarterOptions(8), [])

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
    clearPendingTimers()

    fetchQuarterlyMetricsWithId(projectBackendId, selectedYear, selectedQuarter, {
      enterpriseName: project.enterprise,
      enterpriseAddress: project.location,
    })
      .then(({ record: loaded, quarterMetricId: qid }) => {
        if (requestId !== loadRequestRef.current) return
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

    backendInFlightRef.current = true
    setSyncStatus('saving')
    syncQuarter(qid, recordRef.current, snapshotRef.current)
      .then((result) => {
        if (loadRequestRef.current === 0) return
        recordRef.current = result.record
        snapshotRef.current = result.snapshot
        setRecord(result.record)
        setSyncErrors(result.errors)
        setSyncStatus(result.errors.length > 0 ? 'error' : 'saved')
        if (result.errors.length > 0) {
          console.error('Some quarterly-metrics sections failed to save:', result.errors)
        }
      })
      .catch((error) => {
        console.error('Quarter sync failed outright:', error)
        setSyncStatus('error')
      })
      .finally(() => {
        backendInFlightRef.current = false
        if (backendDirtyWhileSavingRef.current) {
          backendDirtyWhileSavingRef.current = false
          runBackendSync()
        }
      })
  }

  const handleRecordChange = (updated: SetupMonitoringQuarterRecord) => {
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
    record?.equipmentAssets.reduce((sum, eq) => sum + (eq.bookValue || 0), 0) ?? 0
  const totalFixedAssets = totalBuildingBookValue + totalEquipmentBookValue

  const tabs: Array<{
    id: ActiveTab
    label: string
    icon: typeof Building2
  }> = [
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
    <div className="w-full space-y-5 pb-20 font-sans">
      {/* Top Header Card with Integrated Navigation Tabs */}
      <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-[#B5BFCD] bg-[#E6EEF4]/50 text-[#285497] transition hover:bg-[#E6EEF4] hover:text-[#285497]"
                title="Back to monitored projects"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {project.enterprise || project.title || record.enterpriseName}
                </h1>
                <span className="rounded-lg bg-[#E6EEF4] px-2.5 py-0.5 text-xs font-bold text-[#285497]">
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
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Quarterly Monitoring Data Sheet · <span className="text-[#285497] font-bold">{activeTabTitle}</span> · {selectedQuarter} {selectedYear}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quarter Selector Dropdown */}
            <select
              value={`${selectedQuarter} ${selectedYear}`}
              onChange={(e) => {
                const [q, y] = e.target.value.split(' ')
                setSelectedQuarter(q as Quarter)
                setSelectedYear(Number(y))
              }}
              className="h-8.5 rounded-xl border border-[#B5BFCD] bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-[#0f53b7] focus:outline-none cursor-pointer"
            >
              {quarterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Summary Metrics Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setShowSummarySidebar(!showSummarySidebar)}
              className={`inline-flex h-8.5 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition shadow-sm active:scale-95 ${
                showSummarySidebar
                  ? 'border-[#0f53b7] bg-[#0f53b7] text-white shadow-md'
                  : 'border-[#B5BFCD] bg-white text-slate-700 hover:bg-[#E6EEF4] hover:text-[#285497]'
              }`}
              title="Toggle Live Summary Sidebar"
            >
              <BarChart3 className="size-3.5" />
              <span>Summary KPI</span>
            </button>

            {/* Save Snapshot Button */}
            <button
              type="button"
              onClick={handleManualSave}
              className="inline-flex size-8.5 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 shadow-sm transition hover:bg-[#E6EEF4] hover:text-[#285497] active:scale-95"
              title="Save Snapshot"
            >
              <SlidersHorizontal className="size-3.5" />
            </button>

            {/* Generate Report / Export Button */}
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-[#E6EEF4] hover:text-[#285497] active:bg-[#0f53b7] active:text-white active:scale-95"
            >
              <FileDown className="size-3.5 text-[#285497]" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {!canSyncToBackend && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex items-center justify-between text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
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
          <div className="flex items-center justify-between text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
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
      </div>

      {/* Modern Line-Style Navigation Tabs & Autosave Label (Open, no outline/fill) */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#B5BFCD]/50 pb-0.5">
        <div className="flex max-w-full items-center gap-6 overflow-x-auto scrollbar-none pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative inline-flex shrink-0 items-center pb-2 text-xs transition-all duration-150 ease-out ${
                  isActive
                    ? 'font-bold text-[#0f53b7] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#0f53b7] after:rounded-full'
                    : 'font-medium text-slate-600 hover:text-slate-900'
                }`}
              >
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
        {/* Left: Active Tab Content (Full Width) */}
        <div className="min-w-0 flex-1 space-y-6">
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