/**
 * System: DPRMS
 * Purpose: Render setup monitoring hub for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
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
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProjectRecord } from '../../data/admin';
import
{
    computeEmploymentTotals,
    computeProductionCostTotals,
    computeSalesTotals,
    createQuarterlyMetric,
    fetchQuarterlyMetricsWithId,
    saveQuarterRecord,
    type CreateQuarterlyMetricError,
} from '../../services/setup_monitoring_store';
import
{
    buildSnapshot,
    syncQuarter,
    type QuarterSnapshot,
    type SyncEndpointError,
} from '../../services/use_quarter_auto_save';
import type { Quarter, SetupMonitoringQuarterRecord } from '../../types/setup_monitoring';
import { reportError } from '../../utils/error_reporting';
import
{
    normalizeSetupMonitoringPeriod,
    setupMonitoringPeriodOptions,
} from '../../utils/setup_monitoring_period';
import { ExportMonitoringSheetModal } from './ExportMonitoringSheetModal';
import { AssetsTab } from './tabs/AssetsTab';
import { DistributionOutletsTab } from './tabs/DistributionOutletsTab';
import { EmploymentTab } from './tabs/EmploymentTab';
import { NarrativeTab } from './tabs/NarrativeTab';
import { ProductionSalesTab } from './tabs/ProductionSalesTab';
import { TechInterventionTab } from './tabs/TechInterventionTab';

type ActiveTab =
    | 'profile'
    | 'production_sales'
    | 'employment'
    | 'assets'
    | 'outlets'
    | 'technology'
    | 'narrative';

type SyncStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface Props
{
    objProject: ProjectRecord;
    // Optional deep-link values. Invalid, pre-inception, and future values fall
    // back to the project's current selectable monitoring period.
    strInitialQuarter?: Quarter;
    intInitialYear?: number;
    onBack?: () => void;
    blnReadOnly?: boolean;
}

const BACKEND_SYNC_DEBOUNCE_MS = 1200;
const LOCAL_DRAFT_DEBOUNCE_MS = 400;

/** Render setup monitoring hub and its available actions. */
export function SetupMonitoringHub({
    objProject,
    strInitialQuarter,
    intInitialYear,
    onBack,
    blnReadOnly = false,
}: Props)
{
    const _navigate = useNavigate();
    const objPeriodBounds = useMemo(
        () => ({
            approvedAt: objProject.approvedAt,
            startDate: objProject.startDate,
        }),
        [objProject.approvedAt, objProject.startDate],
    );
    const arrQuarterOptions = useMemo(
        () => setupMonitoringPeriodOptions(objPeriodBounds),
        [objPeriodBounds],
    );
    const objInitialPeriod = useMemo(
        () => normalizeSetupMonitoringPeriod(strInitialQuarter, intInitialYear, objPeriodBounds),
        [strInitialQuarter, intInitialYear, objPeriodBounds],
    );

    // Keep year and quarter in one state value so a period change can never
    // briefly request a new quarter with the previous year (or vice versa).
    const [objSelectedPeriod, setObjSelectedPeriod] = useState(objInitialPeriod);
    const strSelectedQuarter = objSelectedPeriod.quarter;
    const intSelectedYear = objSelectedPeriod.year;
    const [strActiveTab, setStrActiveTab] = useState<ActiveTab>('production_sales');
    const [objRecord, setObjRecord] = useState<SetupMonitoringQuarterRecord | null>(null);
    const [blnIsLoading, setBlnIsLoading] = useState(true);
    const [strLoadError, setStrLoadError] = useState<string | null>(null);
    const [blnShowExportModal, setBlnShowExportModal] = useState(false);
    const [blnShowSummarySidebar, setBlnShowSummarySidebar] = useState(false);
    const [strLastSavedTime, setStrLastSavedTime] = useState<string>('Just now');

    // Backend batch-sync state (everything except Narrative — see NOTE below).
    const [intQuarterMetricId, setIntQuarterMetricId] = useState<number | null>(null);
    const [strSyncStatus, setStrSyncStatus] = useState<SyncStatus>('idle');
    const [arrSyncErrors, setArrSyncErrors] = useState<SyncEndpointError[]>([]);

    // Creating the backend quarterly_metrics row (POST .../quarterly-metrics)
    // for a project/quarter/year combo that doesn't have one yet.
    const [blnIsCreatingQuarter, setBlnIsCreatingQuarter] = useState(false);
    const [strCreateQuarterError, setStrCreateQuarterError] = useState<string | null>(null);

    const objLoadRequestRef = useRef(0);
    const objLocalDraftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const objBackendSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Refs mirroring the state above so the debounced sync loop always reads
    // the latest values without re-binding on every keystroke.
    const objRecordRef = useRef<SetupMonitoringQuarterRecord | null>(null);
    const objSnapshotRef = useRef<QuarterSnapshot>({});
    const objQuarterMetricIdRef = useRef<number | null>(null);
    const objBackendInFlightRef = useRef(false);
    const objBackendDirtyWhileSavingRef = useRef(false);
    const objRecordVersionRef = useRef(0);

    const strProjectBackendId = String(objProject.backendId ?? objProject.id);

    /** Clear pending timers. */
    const _clearPendingTimers = () =>
    {
        if (objLocalDraftTimerRef.current)
        {
            clearTimeout(objLocalDraftTimerRef.current);
            objLocalDraftTimerRef.current = null;
        }
        if (objBackendSyncTimerRef.current)
        {
            clearTimeout(objBackendSyncTimerRef.current);
            objBackendSyncTimerRef.current = null;
        }
    };

    /** Load quarter. */
    const _loadQuarter = () =>
    {
        const intRequestId = ++objLoadRequestRef.current;
        setBlnIsLoading(true);
        setStrLoadError(null);
        setStrCreateQuarterError(null);
        objQuarterMetricIdRef.current = null;
        setIntQuarterMetricId(null);
        objBackendDirtyWhileSavingRef.current = false;
        _clearPendingTimers();

        // Do not leave the previous quarter's figures visible under the newly
        // selected period while its request is in flight.
        if (
            objRecordRef.current &&
            (objRecordRef.current.quarter !== strSelectedQuarter ||
                objRecordRef.current.year !== intSelectedYear)
        )
        {
            objRecordRef.current = null;
            objSnapshotRef.current = {};
            setObjRecord(null);
        }

        fetchQuarterlyMetricsWithId(strProjectBackendId, intSelectedYear, strSelectedQuarter, {
            enterpriseName: objProject.enterprise,
            enterpriseAddress: objProject.location,
        })
            .then(({ record: objLoaded, quarterMetricId: intQid }) =>
            {
                if (intRequestId !== objLoadRequestRef.current)
                {
                    return;
                }
                objRecordVersionRef.current = 0;
                objRecordRef.current = objLoaded;
                objSnapshotRef.current = buildSnapshot(objLoaded);
                objQuarterMetricIdRef.current = intQid;
                setObjRecord(objLoaded);
                setIntQuarterMetricId(intQid);
                setStrSyncStatus('idle');
                setArrSyncErrors([]);
            })
            .catch((errError) =>
            {
                if (intRequestId !== objLoadRequestRef.current)
                {
                    return;
                }
                reportError(errError, 'Failed to load quarterly metrics:');
                setStrLoadError('Could not load quarterly metrics from the server.');
            })
            .finally(() =>
            {
                if (intRequestId === objLoadRequestRef.current)
                {
                    setBlnIsLoading(false);
                }
            });
    }; /* end _loadQuarter */

    useEffect(() =>
    {
        _loadQuarter();
        return () =>
        {
            objLoadRequestRef.current += 1;
            _clearPendingTimers();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        strProjectBackendId,
        intSelectedYear,
        strSelectedQuarter,
        objProject.enterprise,
        objProject.location,
    ]);

    // --- Backend sync (everything except Narrative) ---
    // NOTE: problemsAndActions / plansForImprovement / signOff have no
    // corresponding entry in RESOURCE_ADAPTERS, so syncQuarter never touches
    // them — they only ever get persisted via the local-draft save below. This
    // is intentional: the Narrative backend endpoint isn't being fixed right
    // now. Don't add a narrative adapter to "complete" this without confirming
    // that's resolved.
    const _runBackendSync = () =>
    {
        const intQid = objQuarterMetricIdRef.current;
        if (intQid == null || !objRecordRef.current)
        {
            return;
        }

        if (objBackendInFlightRef.current)
        {
            objBackendDirtyWhileSavingRef.current = true;
            return;
        }

        const intRequestId = objLoadRequestRef.current;
        const intSyncedVersion = objRecordVersionRef.current;
        const objRecordToSync = objRecordRef.current;
        const objSnapshotToSync = objSnapshotRef.current;

        objBackendInFlightRef.current = true;
        setStrSyncStatus('saving');
        syncQuarter(intQid, objRecordToSync, objSnapshotToSync)
            .then((objResult) =>
            {
                if (
                    intRequestId !== objLoadRequestRef.current ||
                    intQid !== objQuarterMetricIdRef.current
                )
                {
                    return;
                }

                // Advance only the persisted baseline. A response must never replace
                // newer edits in the live form or remount the currently focused row.
                objSnapshotRef.current = objResult.snapshot;
                setArrSyncErrors(objResult.errors);
                setStrSyncStatus(
                    objRecordVersionRef.current === intSyncedVersion
                        ? objResult.errors.length > 0
                            ? 'error'
                            : 'saved'
                        : 'pending',
                );
                if (objResult.errors.length > 0)
                {
                    reportError(
                        objResult.errors,
                        'Some quarterly-metrics sections failed to save:',
                    );
                }
            })
            .catch((errError) =>
            {
                if (
                    intRequestId !== objLoadRequestRef.current ||
                    intQid !== objQuarterMetricIdRef.current
                )
                {
                    return;
                }
                reportError(errError, 'Quarter sync failed outright:');
                setStrSyncStatus('error');
            })
            .finally(() =>
            {
                objBackendInFlightRef.current = false;
                if (objBackendDirtyWhileSavingRef.current)
                {
                    objBackendDirtyWhileSavingRef.current = false;
                    if (objBackendSyncTimerRef.current)
                    {
                        clearTimeout(objBackendSyncTimerRef.current);
                        objBackendSyncTimerRef.current = null;
                    }
                    _runBackendSync();
                }
            });
    }; /* end _runBackendSync */

    /** Handle record change. */
    const _handleRecordChange = (objUpdated: SetupMonitoringQuarterRecord) =>
    {
        objRecordVersionRef.current += 1;
        objRecordRef.current = objUpdated;
        setObjRecord(objUpdated);

        // Local draft save — always runs, regardless of backend availability.
        // This is what keeps Narrative edits from being lost, since they never
        // reach the server.
        if (objLocalDraftTimerRef.current)
        {
            clearTimeout(objLocalDraftTimerRef.current);
        }
        objLocalDraftTimerRef.current = setTimeout(() =>
        {
            saveQuarterRecord(objUpdated);
            const dtNow = new Date();
            setStrLastSavedTime(
                dtNow.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
            );
        }, LOCAL_DRAFT_DEBOUNCE_MS);

        // Backend batch sync — only if this quarter already has a backend row.
        if (objQuarterMetricIdRef.current != null)
        {
            if (objBackendInFlightRef.current)
            {
                objBackendDirtyWhileSavingRef.current = true;
            }
            if (objBackendSyncTimerRef.current)
            {
                clearTimeout(objBackendSyncTimerRef.current);
            }
            setStrSyncStatus('pending');
            objBackendSyncTimerRef.current = setTimeout(() =>
            {
                objBackendSyncTimerRef.current = null;
                _runBackendSync();
            }, BACKEND_SYNC_DEBOUNCE_MS);
        }
    }; /* end _handleRecordChange */

    /** Handle manual save. */
    const _handleManualSave = () =>
    {
        if (!objRecord)
        {
            return;
        }
        saveQuarterRecord(objRecord);
        const dtNow = new Date();
        setStrLastSavedTime(
            dtNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        );

        if (objBackendSyncTimerRef.current)
        {
            clearTimeout(objBackendSyncTimerRef.current);
            objBackendSyncTimerRef.current = null;
        }
        if (objQuarterMetricIdRef.current != null)
        {
            _runBackendSync();
        }
    };

    /** Handle retry. */
    const _handleRetry = () =>
    {
        _loadQuarter();
    };

    /** Handle period change. */
    const _handlePeriodChange = (strValue: string) =>
    {
        const objNextPeriod = arrQuarterOptions.find((objOption) => objOption.value === strValue);
        if (
            !objNextPeriod ||
            (objNextPeriod.quarter === strSelectedQuarter && objNextPeriod.year === intSelectedYear)
        )
        {
            return;
        }

        // Invalidate any older request immediately. The effect for the new
        // period will issue a fresh request with the matching year and quarter.
        objLoadRequestRef.current += 1;
        _clearPendingTimers();
        objRecordRef.current = null;
        objSnapshotRef.current = {};
        objQuarterMetricIdRef.current = null;
        setObjRecord(null);
        setIntQuarterMetricId(null);
        setBlnIsLoading(true);
        setStrLoadError(null);
        setStrCreateQuarterError(null);
        setObjSelectedPeriod({
            quarter: objNextPeriod.quarter,
            year: objNextPeriod.year,
        });
    }; /* end _handlePeriodChange */

    // Creates the missing backend quarterly_metrics row for the currently
    // selected quarter/year, then immediately pushes whatever is already in
    // the local draft (record) up to the server so nothing typed before
    // creation is lost.
    const _handleCreateQuarterRecord = () =>
    {
        if (blnIsCreatingQuarter)
        {
            return;
        }
        setBlnIsCreatingQuarter(true);
        setStrCreateQuarterError(null);

        createQuarterlyMetric(strProjectBackendId, intSelectedYear, strSelectedQuarter)
            .then((intQid) =>
            {
                objQuarterMetricIdRef.current = intQid;
                setIntQuarterMetricId(intQid);
                // Push the existing local-draft record up now that a backend row
                // exists to sync it against.
                if (objRecordRef.current)
                {
                    _runBackendSync();
                }
            })
            .catch((errError) =>
            {
                reportError(errError, 'Failed to create quarterly metrics record:');
                const errPayload = errError?.response?.data as
                    CreateQuarterlyMetricError | undefined;
                const txtValidationMessage = errPayload?.errors
                    ? Object.values(errPayload.errors).flat().join(' ')
                    : errPayload?.message;
                setStrCreateQuarterError(
                    txtValidationMessage ||
                    'Could not create a quarterly metrics record for this quarter. Please try again.',
                );
            })
            .finally(() =>
            {
                setBlnIsCreatingQuarter(false);
            });
    }; /* end _handleCreateQuarterRecord */

    const objSalesTotals = objRecord ? computeSalesTotals(objRecord) : null;
    const objCostTotals = objRecord ? computeProductionCostTotals(objRecord) : null;
    const objEmpTotals = objRecord ? computeEmploymentTotals(objRecord) : null;

    const intTotalBuildingBookValue =
        objRecord?.buildingAssets.reduce(
            (intSum, objRight) => intSum + (objRight.bookValue || 0),
            0,
        ) ?? 0;
    const intTotalEquipmentBookValue =
        objRecord && objRecord.equipmentAssets.length > 0
            ? objRecord.equipmentAssets.reduce(
                (intSum, objEq) => intSum + (objEq.bookValue || 0),
                0,
            )
            : (objProject.equipmentRecords?.reduce(
                (intSum, objEq) => intSum + (objEq.book_value || 0),
                0,
            ) ?? 0);
    const intTotalFixedAssets = intTotalBuildingBookValue + intTotalEquipmentBookValue;

    const curTotalFunding = objProject.budget || 0;
    const curTotalRefunded = objProject.used || 0;
    const blnHasFunding = curTotalFunding > 0;
    const curRefundPercentage = blnHasFunding
        ? Math.min(100, Math.round((curTotalRefunded / curTotalFunding) * 100))
        : 0;

    const arrTabs: Array<{
        id: ActiveTab;
        label: string;
        icon: typeof Building2;
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
        ];

    const strActiveTabTitle =
        arrTabs.find((objT) => objT.id === strActiveTab)?.label || 'Quarterly Monitoring';
    const blnCanSyncToBackend = intQuarterMetricId != null;

    if (blnIsLoading && !objRecord)
    {
        return (
            <div className="flex min-h-52 items-center justify-center rounded-2xl border border-[#B5BFCD]/80 bg-white text-sm font-semibold text-slate-500 shadow-sm">
                <LoaderCircle className="mr-2 size-5 animate-spin text-[#285497]" />
                Loading {strSelectedQuarter} {intSelectedYear} monitoring data...
            </div>
        );
    }

    if (strLoadError && !objRecord)
    {
        return (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white px-6 text-center shadow-sm">
                <p className="text-sm font-bold text-rose-700">{strLoadError}</p>
                <button
                    type="button"
                    onClick={_handleRetry}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0b3f8b]"
                >
                    <RefreshCw className="size-3.5" /> Retry
                </button>
            </div>
        );
    }

    if (!objRecord)
    {
        return null;
    }

    const blnHasSynchronizationErrors = strSyncStatus === 'error' && arrSyncErrors.length > 0;
    const blnCanShowSummary =
        blnShowSummarySidebar &&
        objSalesTotals !== null &&
        objCostTotals !== null &&
        objEmpTotals !== null;

    return (
        <div className="w-full space-y-4 pb-20 font-sans">
            {/* Upper Header Breadcrumb Navigation */}
            <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"
            >
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
                <span className="font-bold text-[#285497]">{strActiveTabTitle}</span>
            </nav>

            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-1">
                <div className="flex items-center gap-3">
                    <span className="h-10 w-1.5 rounded-full bg-[#0f53b7] shrink-0" />
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                                {objProject.enterprise ||
                                    objProject.title ||
                                    objRecord.enterpriseName}
                            </h1>
                            <span className="rounded-lg bg-[#E6EEF4] px-2.5 py-0.5 font-mono text-xs font-bold text-[#285497]">
                                {objProject.referenceNumber || objProject.id}
                            </span>
                            {strLoadError && (
                                <span
                                    className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700"
                                    title={strLoadError}
                                >
                                    Showing cached data
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    {objProject.proposalId ? (
                        <button
                            type="button"
                            onClick={() =>
                                _navigate(
                                    `/dashboard/document-checklist?proposalId=${objProject.proposalId}&program=SETUP`,
                                )
                            }
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
                            disabled={blnIsCreatingQuarter}
                            value={`${strSelectedQuarter} ${intSelectedYear}`}
                            onChange={(objEvent) => _handlePeriodChange(objEvent.target.value)}
                            className="h-full cursor-pointer bg-transparent px-3 text-xs font-bold text-slate-700 outline-none disabled:cursor-wait disabled:opacity-60"
                        >
                            {arrQuarterOptions.map((objOpt) => (
                                <option key={objOpt.value} value={objOpt.value}>
                                    {objOpt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Summary Metrics Sidebar Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setBlnShowSummarySidebar(!blnShowSummarySidebar)}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer ${blnShowSummarySidebar
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
                        onClick={_handleManualSave}
                        className="inline-flex size-9 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 shadow-2xs transition hover:bg-[#E6EEF4] hover:text-[#285497] active:scale-95 cursor-pointer"
                        title="Save Snapshot"
                    >
                        <SlidersHorizontal className="size-4" />
                    </button>

                    {/* Generate Report / Export Button */}
                    <button
                        type="button"
                        onClick={() => setBlnShowExportModal(true)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] active:scale-95 cursor-pointer"
                    >
                        <FileDown className="size-4" />
                        <span>Export Sheet</span>
                    </button>
                </div>
            </div>

            {!blnCanSyncToBackend && (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
                    <p className="text-xs text-amber-700">
                        No backend record exists yet for {strSelectedQuarter} {intSelectedYear} —
                        changes are being kept as a local draft only until this quarter is created
                        on the server.
                    </p>
                    <button
                        type="button"
                        onClick={_handleCreateQuarterRecord}
                        disabled={blnIsCreatingQuarter || blnReadOnly}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {blnIsCreatingQuarter ? (
                            <>
                                <LoaderCircle className="size-3 animate-spin" /> Creating...
                            </>
                        ) : (
                            <>Create quarterly metrics record</>
                        )}
                    </button>
                </div>
            )}

            {strCreateQuarterError && (
                <div className="flex items-center justify-between text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 shadow-2xs">
                    <span>{strCreateQuarterError}</span>
                    <button
                        type="button"
                        onClick={_handleCreateQuarterRecord}
                        disabled={blnIsCreatingQuarter}
                        className="ml-3 shrink-0 inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                        <RefreshCw className="size-3" /> Retry
                    </button>
                </div>
            )}

            {blnHasSynchronizationErrors && (
                <div className="flex items-center justify-between text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 shadow-2xs">
                    <span>
                        {arrSyncErrors.length} section{arrSyncErrors.length === 1 ? '' : 's'} failed
                        to save to the server (
                        {arrSyncErrors.map((errEvent) => errEvent.endpoint).join(', ')}). Your edits
                        are still kept as a local draft.
                    </span>
                    <button
                        type="button"
                        onClick={_handleManualSave}
                        className="ml-3 shrink-0 inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
                    >
                        <RefreshCw className="size-3" /> Retry
                    </button>
                </div>
            )}

            {/* Navigation Tabs & Autosave Status */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#B5BFCD]/50 pb-0.5">
                <div className="flex max-w-full items-center gap-6 overflow-x-auto scrollbar-none pb-0">
                    {arrTabs.map((objTab) =>
                    {
                        const blnIsActive = strActiveTab === objTab.id;
                        const Icon = objTab.icon;
                        return (
                            <button
                                key={objTab.id}
                                type="button"
                                onClick={() => setStrActiveTab(objTab.id)}
                                className={`group relative inline-flex shrink-0 items-center gap-2 pb-2.5 text-xs transition-all duration-150 ease-out ${blnIsActive
                                    ? 'font-bold text-[#0f53b7] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#0f53b7] after:rounded-full'
                                    : 'font-medium text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Icon
                                    className={`size-3.5 ${blnIsActive ? 'text-[#0f53b7]' : 'text-slate-400 group-hover:text-slate-600'}`}
                                />
                                <span>{objTab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 pb-2 pr-1">
                    {blnCanSyncToBackend ? (
                        strSyncStatus === 'pending' ? (
                            <>
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                <span>Unsaved changes...</span>
                            </>
                        ) : strSyncStatus === 'saving' ? (
                            <>
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                <span>Saving...</span>
                            </>
                        ) : strSyncStatus === 'error' ? (
                            <>
                                <span className="size-2 rounded-full bg-rose-500" />
                                <span>Save failed</span>
                            </>
                        ) : (
                            <>
                                <Check className="size-3 text-emerald-600" />
                                <span>Saved {strLastSavedTime}</span>
                            </>
                        )
                    ) : (
                        <>
                            <span className="size-2 rounded-full bg-slate-400" />
                            <span>Local draft saved {strLastSavedTime}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Main Workspace Layout with Optional Summary Sidebar */}
            <div className="flex items-start gap-5">
                {/* Left: Active Tab Content */}
                <div className="min-w-0 flex-1 space-y-6">
                    {strActiveTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in duration-150">
                            {/* Executive Operational KPI Strip */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="rounded-2xl border border-emerald-200/80 bg-linear-to-br from-emerald-50/70 to-emerald-100/30 p-4.5 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                                                {blnHasFunding
                                                    ? 'Approved Funding & Balance'
                                                    : 'Repayment Terms'}
                                            </span>
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                {blnHasFunding
                                                    ? `${curRefundPercentage}% Refunded`
                                                    : 'Pending'}
                                            </span>
                                        </div>
                                        {blnHasFunding ? (
                                            <>
                                                <p className="mt-2 text-xl font-black text-emerald-950">
                                                    ₱
                                                    {(
                                                        curTotalFunding - curTotalRefunded
                                                    ).toLocaleString()}
                                                </p>
                                                <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 block">
                                                    of ₱{curTotalFunding.toLocaleString()} total
                                                    funding
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
                                        <div
                                            className="h-full bg-emerald-600 rounded-full"
                                            style={{ width: `${curRefundPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-blue-200/80 bg-linear-to-br from-blue-50/70 to-blue-100/30 p-4.5 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-[#0f53b7]">
                                                Active Monitoring Cycle
                                            </span>
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#0f53b7]">
                                                {strSelectedQuarter} {intSelectedYear}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xl font-black text-slate-900">
                                            {objProject.dueDate ||
                                                objProject.latestReport?.dueDate ||
                                                `${strSelectedQuarter} ${intSelectedYear}`}
                                        </p>
                                        <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                                            {objProject.latestReport?.status
                                                ? `Report: ${objProject.latestReport.status}`
                                                : 'Quarterly Monitoring Period'}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                                        <span>
                                            {objProject.compliance === 'Overdue'
                                                ? 'Action Required'
                                                : 'Schedule On Track'}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-purple-200/80 bg-linear-to-br from-purple-50/70 to-purple-100/30 p-4.5 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">
                                                Equipment Outlay
                                            </span>
                                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                                                {objProject.equipmentRecords?.length ??
                                                    objRecord.equipmentAssets.length}{' '}
                                                Units
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xl font-black text-purple-950">
                                            {(objProject.equipmentRecords?.length ??
                                                objRecord.equipmentAssets.length) > 0
                                                ? 'Deployed & Logged'
                                                : 'No Outlay Recorded'}
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
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                                Master Checklist
                                            </span>
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                {objProject.checklistStats
                                                    ? `${objProject.checklistStats.percentage}% Complied`
                                                    : 'Compliant'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xl font-black text-slate-900">
                                            {objProject.checklistStats
                                                ? `${objProject.checklistStats.complied} of ${objProject.checklistStats.total} Docs`
                                                : 'Document Sets'}
                                        </p>
                                        <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                                            Legal & Audit Clearance Satisfied
                                        </span>
                                    </div>
                                    {objProject.proposalId ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                _navigate(
                                                    `/dashboard/document-checklist?proposalId=${objProject.proposalId}&program=SETUP`,
                                                )
                                            }
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
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Enterprise Legal Profile
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Business registration and proponent background
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-semibold text-emerald-700">
                                            ✓ Auto-Inherited
                                        </span>
                                    </div>

                                    <div className="space-y-3.5">
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                Registered Enterprise Name
                                            </span>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {objProject.enterprise ||
                                                    objProject.title ||
                                                    objRecord.enterpriseName}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                    Proponent / Lead Person
                                                </span>
                                                <p className="mt-1 text-xs font-bold text-slate-900">
                                                    {objProject.proponentName ||
                                                        objProject.manager ||
                                                        'Proponent'}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                    Priority Industry Sector
                                                </span>
                                                <p className="mt-1 text-xs font-bold text-slate-900">
                                                    {objProject.industrySector || 'Food Processing'}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                    Business Structure & Scale
                                                </span>
                                                <p className="mt-1 text-xs font-bold text-slate-900">
                                                    {objProject.businessStructure ||
                                                        'Sole Proprietorship'}
                                                    {objProject.enterpriseSize
                                                        ? ` · ${objProject.enterpriseSize} Enterprise`
                                                        : ''}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                    Contact Information
                                                </span>
                                                <p className="mt-1 text-xs font-bold text-slate-900">
                                                    {objProject.contactNumber || 'Not recorded'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                Manufacturing & Operating Facility
                                            </span>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                                <MapPin className="size-3.5 text-[#0f53b7] shrink-0" />
                                                <span>
                                                    {objProject.location ||
                                                        objRecord.enterpriseAddress ||
                                                        'Location not recorded'}
                                                </span>
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
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Program Directives & Mandate
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    DOST execution terms and monitoring supervision
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-semibold text-[#0f53b7]">
                                            Active Execution
                                        </span>
                                    </div>

                                    <div className="space-y-3.5">
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                DOST Reference / Resolution No.
                                            </span>
                                            <p className="mt-1 text-sm font-mono font-black text-[#0f53b7]">
                                                {objProject.referenceNumber || objProject.id}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                    Assigned Monitoring Officer
                                                </span>
                                                <p className="mt-1 text-xs font-bold text-slate-900">
                                                    {objProject.manager || 'Unassigned'}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                    PSTO Implementing Center
                                                </span>
                                                <p className="mt-1 text-xs font-bold text-slate-900">
                                                    DOST PSTO{' '}
                                                    {objProject.district || 'Davao Region'}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                    Focal / Supervision Officer
                                                </span>
                                                <p className="mt-1 text-xs font-bold text-slate-900">
                                                    {objProject.focalOfficer || 'PSTO Focal Person'}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                    Implementation Cycle
                                                </span>
                                                <p className="mt-1 text-xs font-bold text-slate-900">
                                                    {objProject.startDate
                                                        ? `${objProject.startDate} to ${objProject.dueDate || 'Present'}`
                                                        : '36 Months (3 Years)'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                    Checklist Verification
                                                </span>
                                                <p className="mt-0.5 text-xs font-bold text-slate-800">
                                                    {objProject.checklistStats
                                                        ? `${objProject.checklistStats.complied}/${objProject.checklistStats.total} Document Sets Complied`
                                                        : 'Pre-implementation Requirements Complied'}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-semibold text-emerald-700">
                                                {objProject.compliance}
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
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Deployed Equipment & Machinery Inventory
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                QR-tagged capital assets acquired under SETUP grant
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setStrActiveTab('assets')}
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
                                                <th className="py-2.5 px-3">
                                                    Equipment Description
                                                </th>
                                                <th className="py-2.5 px-3 text-right">
                                                    Acquisition
                                                </th>
                                                <th className="py-2.5 px-3 text-right">
                                                    Useful Life
                                                </th>
                                                <th className="py-2.5 px-3 text-right">
                                                    Acquisition Cost
                                                </th>
                                                <th className="py-2.5 px-3 text-right">
                                                    Book Value
                                                </th>
                                                <th className="py-2.5 px-3 text-center">
                                                    Condition / Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(objProject.equipmentRecords &&
                                                objProject.equipmentRecords.length > 0
                                                ? objProject.equipmentRecords.map((objItem) => ({
                                                    id: objItem.id,
                                                    equipmentName: objItem.equipment_name,
                                                    propertyNumber: objItem.property_number,
                                                    serialNumber: objItem.serial_number,
                                                    qrReference: objItem.qr_reference,
                                                    yearAcquired: objItem.year_acquired,
                                                    usefulLifeYears: objItem.useful_life_years,
                                                    cost: objItem.cost,
                                                    bookValue: objItem.book_value,
                                                    condition: objItem.condition,
                                                }))
                                                : objRecord.equipmentAssets.length > 0
                                                    ? objRecord.equipmentAssets.map((objItem) => ({
                                                        id: objItem.id,
                                                        equipmentName: objItem.equipmentName,
                                                        propertyNumber: undefined,
                                                        serialNumber: undefined,
                                                        qrReference: undefined,
                                                        yearAcquired: objItem.yearAcquired,
                                                        usefulLifeYears: objItem.usefulLifeYears,
                                                        cost: objItem.cost,
                                                        bookValue: objItem.bookValue,
                                                        condition: 'Operational',
                                                    }))
                                                    : []
                                            ).map(
                                                (objItem, intIndex) =>
                                                {
                                                    const blnHasEquipmentReference = Boolean(
                                                        objItem.propertyNumber ||
                                                        objItem.qrReference,
                                                    );
                                                    return (
                                                        <tr
                                                            key={objItem.id || intIndex}
                                                            className="hover:bg-slate-50/70 transition"
                                                        >
                                                            <td className="py-3 px-3">
                                                                <div className="flex items-center gap-2 font-bold text-slate-900">
                                                                    <span className="size-1.5 rounded-full bg-[#0f53b7]" />
                                                                    <span>
                                                                        {objItem.equipmentName}
                                                                    </span>
                                                                </div>
                                                                {blnHasEquipmentReference && (
                                                                    <div className="ml-3.5 mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono">
                                                                        {objItem.propertyNumber && (
                                                                            <span>
                                                                                Prop:{' '}
                                                                                {
                                                                                    objItem.propertyNumber
                                                                                }
                                                                            </span>
                                                                        )}
                                                                        {objItem.qrReference && (
                                                                            <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 border border-purple-200">
                                                                                <QrCode className="size-2.5" />
                                                                                {
                                                                                    objItem.qrReference
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-3 text-right text-slate-600 font-mono">
                                                                {objItem.yearAcquired || 2024}
                                                            </td>
                                                            <td className="py-3 px-3 text-right font-medium text-slate-800">
                                                                {objItem.usefulLifeYears || 5} yrs
                                                            </td>
                                                            <td className="py-3 px-3 text-right font-mono text-slate-700">
                                                                ₱
                                                                {(
                                                                    objItem.cost || 0
                                                                ).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-3 text-right font-mono font-bold text-[#0f53b7]">
                                                                ₱
                                                                {(
                                                                    objItem.bookValue || 0
                                                                ).toLocaleString()}
                                                            </td>
                                                            <td className="py-3 px-3 text-center">
                                                                <span className="text-[10px] font-semibold text-emerald-700">
                                                                    ✓{' '}
                                                                    {objItem.condition ||
                                                                        'Operational'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ); // end return
                                                } /* end SetupMonitoringHub */,
                                            )}
                                            {(!objProject.equipmentRecords ||
                                                objProject.equipmentRecords.length === 0) &&
                                                objRecord.equipmentAssets.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="py-6 text-center text-xs text-slate-400"
                                                    >
                                                        No equipment records currently registered
                                                        for this project.
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
                                        onClick={() => setStrActiveTab('production_sales')}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] active:scale-95"
                                    >
                                        <span>Proceed to Production & Sales</span>
                                        <ArrowRight className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {strActiveTab === 'production_sales' && (
                        <ProductionSalesTab
                            objRecord={objRecord}
                            onChange={_handleRecordChange}
                            blnReadOnly={blnReadOnly}
                        />
                    )}
                    {strActiveTab === 'employment' && (
                        <EmploymentTab
                            objRecord={objRecord}
                            onChange={_handleRecordChange}
                            blnReadOnly={blnReadOnly}
                        />
                    )}
                    {strActiveTab === 'assets' && (
                        <AssetsTab
                            objRecord={objRecord}
                            onChange={_handleRecordChange}
                            blnReadOnly={blnReadOnly}
                        />
                    )}
                    {strActiveTab === 'outlets' && (
                        <DistributionOutletsTab
                            objRecord={objRecord}
                            onChange={_handleRecordChange}
                            blnReadOnly={blnReadOnly}
                        />
                    )}
                    {strActiveTab === 'technology' && (
                        <TechInterventionTab
                            objRecord={objRecord}
                            onChange={_handleRecordChange}
                            blnReadOnly={blnReadOnly}
                        />
                    )}
                    {strActiveTab === 'narrative' && (
                        <NarrativeTab
                            objRecord={objRecord}
                            onChange={_handleRecordChange}
                            blnReadOnly={blnReadOnly}
                        />
                    )}
                </div>

                {/* Right: Live Summary KPI Sidebar (Contextual for Active Tab) */}
                {blnCanShowSummary && (
                    <aside className="w-80 shrink-0 rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm space-y-4 sticky top-6">
                        <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    {strActiveTabTitle} Summary
                                </h3>
                                <p className="text-xs text-slate-400 font-normal">
                                    {objRecord.quarter} {objRecord.year} ·{' '}
                                    {objRecord.enterpriseName}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBlnShowSummarySidebar(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* TAB 1: PRODUCTION & SALES */}
                        {strActiveTab === 'production_sales' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Financial Overview
                                        </span>
                                        <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[10px] font-bold text-[#285497]">
                                            {objSalesTotals.profitMargin}% Margin
                                        </span>
                                    </div>
                                    <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">
                                                Grand Total Sales:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                ₱
                                                {objSalesTotals.grandTotalSales.toLocaleString(
                                                    undefined,
                                                    { minimumFractionDigits: 2 },
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">
                                                Grand Total Cost:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                ₱
                                                {objCostTotals.grandTotalProductionCost.toLocaleString(
                                                    undefined,
                                                    { minimumFractionDigits: 2 },
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                                            <span className="text-[#285497] font-bold">
                                                Net Profit:
                                            </span>
                                            <span className="font-black text-[#285497]">
                                                ₱
                                                {objSalesTotals.netProfit.toLocaleString(
                                                    undefined,
                                                    { minimumFractionDigits: 2 },
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Cost Structure
                                    </span>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Operating Expenses:</span>
                                            <span className="font-semibold text-slate-900">
                                                ₱
                                                {objCostTotals.operatingTotal.toLocaleString(
                                                    undefined,
                                                    { minimumFractionDigits: 2 },
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Direct Labor:</span>
                                            <span className="font-semibold text-slate-900">
                                                ₱
                                                {objCostTotals.laborTotal.toLocaleString(
                                                    undefined,
                                                    { minimumFractionDigits: 2 },
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Raw Materials:</span>
                                            <span className="font-semibold text-slate-900">
                                                ₱
                                                {objCostTotals.rawMaterialsTotal.toLocaleString(
                                                    undefined,
                                                    { minimumFractionDigits: 2 },
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Miscellaneous:</span>
                                            <span className="font-semibold text-slate-900">
                                                ₱
                                                {objCostTotals.miscTotal.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: EMPLOYMENT */}
                        {strActiveTab === 'employment' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Workforce Headcount
                                        </span>
                                        <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[10px] font-bold text-[#285497]">
                                            {objEmpTotals.totalEmployees} Total
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5 text-center">
                                            <span className="block text-[10px] text-slate-400 font-bold">
                                                MALE
                                            </span>
                                            <span className="text-lg font-black text-[#285497]">
                                                {objEmpTotals.maleCount}
                                            </span>
                                        </div>
                                        <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5 text-center">
                                            <span className="block text-[10px] text-slate-400 font-bold">
                                                FEMALE
                                            </span>
                                            <span className="text-lg font-black text-[#285497]">
                                                {objEmpTotals.femaleCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Roster Distribution
                                    </span>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Direct Employees:</span>
                                            <span className="font-semibold text-slate-900">
                                                {objRecord.directEmployees.length} staff
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Indirect Employees:</span>
                                            <span className="font-semibold text-slate-900">
                                                {objRecord.indirectEmployees.length} staff
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t border-[#B5BFCD]/50 pt-2.5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Sectoral Inclusivity
                                    </span>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Youth:</span>
                                            <span className="font-semibold text-slate-900">
                                                {objEmpTotals.youthCount}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Senior Citizens (SC):</span>
                                            <span className="font-semibold text-slate-900">
                                                {objEmpTotals.scCount}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>PWD:</span>
                                            <span className="font-semibold text-slate-900">
                                                {objEmpTotals.pwdCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: ASSETS & CAPITAL */}
                        {strActiveTab === 'assets' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Total Fixed Asset Value
                                    </span>
                                    <div className="rounded-xl border border-[#285497]/40 bg-[#E6EEF4] p-3 text-center">
                                        <span className="block text-[10px] text-slate-500 font-bold uppercase">
                                            Combined Net Valuation
                                        </span>
                                        <span className="text-xl font-black text-[#285497]">
                                            ₱
                                            {intTotalFixedAssets.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Asset Category Summary
                                    </span>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Building Book Value:</span>
                                            <span className="font-semibold text-slate-900">
                                                ₱
                                                {intTotalBuildingBookValue.toLocaleString(
                                                    undefined,
                                                    { minimumFractionDigits: 2 },
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Equipment Book Value:</span>
                                            <span className="font-semibold text-slate-900">
                                                ₱
                                                {intTotalEquipmentBookValue.toLocaleString(
                                                    undefined,
                                                    { minimumFractionDigits: 2 },
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Working Capital Outlay:</span>
                                            <span className="font-semibold text-slate-900">
                                                ₱
                                                {objRecord.workingCapital
                                                    .reduce(
                                                        (intSum, objItem) =>
                                                            intSum + (objItem.amount || 0),
                                                        0,
                                                    )
                                                    .toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                    })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: DISTRIBUTION OUTLETS */}
                        {strActiveTab === 'outlets' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Market Coverage
                                    </span>
                                    <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">
                                                International Markets:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {objRecord.internationalMarkets?.length || 0}{' '}
                                                outlets
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">
                                                Local Market Outlets:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {objRecord.localMarkets?.length || 0} outlets
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                                            <span className="text-[#285497] font-bold">
                                                Total Distribution Reach:
                                            </span>
                                            <span className="font-black text-[#285497]">
                                                {(objRecord.internationalMarkets?.length || 0) +
                                                    (objRecord.localMarkets?.length || 0)}{' '}
                                                channels
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Supply & Forward Network
                                    </span>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Forward Distributors:</span>
                                            <span className="font-semibold text-slate-900">
                                                {objRecord.forwardDistributors?.length || 0}{' '}
                                                entities
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Raw Material Suppliers:</span>
                                            <span className="font-semibold text-slate-900">
                                                {objRecord.forwardSuppliers?.length || 0} partners
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: TECHNOLOGY INTERVENTION */}
                        {strActiveTab === 'technology' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Intervention Portfolio
                                    </span>
                                    <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">
                                                Consultancy Services:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {objRecord.consultancies?.length || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">
                                                Trainings Conducted:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {objRecord.trainings?.length || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">
                                                Technology Transfers:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {objRecord.techTransfers?.length || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">
                                                Support & Testing Services:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {objRecord.supportServices?.length || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                                            <span className="text-[#285497] font-bold">
                                                Other DOST Projects:
                                            </span>
                                            <span className="font-black text-[#285497]">
                                                {objRecord.otherProjects?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 6: NARRATIVE & SIGN-OFF */}
                        {strActiveTab === 'narrative' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Validation Status
                                    </span>
                                    <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">
                                                Interviewer Sign-off:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {objRecord.signOff?.interviewerName
                                                    ? 'Completed'
                                                    : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 font-medium">
                                                Respondent Acknowledgment:
                                            </span>
                                            <span className="font-bold text-slate-900">
                                                {objRecord.signOff?.respondentName
                                                    ? 'Completed'
                                                    : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-[#B5BFCD]/40 pt-1.5">
                                            <span className="text-[#285497] font-bold">
                                                Sheet Status:
                                            </span>
                                            <span className="font-black text-[#285497]">
                                                {objRecord.status}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-normal leading-relaxed">
                                        Narrative & sign-off fields are kept as a local draft only
                                        for now and are not yet synced to the server.
                                    </p>
                                </div>
                            </div>
                        )}
                    </aside>
                )}
            </div>

            {/* Official Sheet Export Modal */}
            {blnShowExportModal && (
                <ExportMonitoringSheetModal
                    objRecord={objRecord}
                    onClose={() => setBlnShowExportModal(false)}
                />
            )}
        </div>
    ); // end return
} /* end SetupMonitoringHub */
