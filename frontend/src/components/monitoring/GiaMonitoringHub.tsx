/**
 * System: DPRMS
 * Purpose: Render gia monitoring hub for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    AlertCircle,
    ArrowLeft,
    BarChart3,
    Check,
    FileDown,
    LoaderCircle,
    LockKeyhole,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { reportError } from '../../utils/error_reporting';

import { formatCurrency, type ProjectRecord } from '../../data/admin';
import
{
    fetchGiaMonitoringReport,
    saveGiaMonitoringReport,
    type GiaMonitoringFormData,
} from '../../services/gia_monitoring_store';
import { GiaMonitoringForm } from './GiaMonitoringForm';

interface Props
{
    objProject: ProjectRecord;
    onBack?: () => void;
    blnReadOnly?: boolean;
    intInitialSemester?: 1 | 2;
    intInitialYear?: number;
}

/** Render gia monitoring hub and its available actions. */
export function GiaMonitoringHub({
    objProject,
    onBack,
    blnReadOnly = false,
    intInitialSemester = 1,
    intInitialYear = new Date().getFullYear(),
}: Props)
{
    const [strSelectedPeriod, setStrSelectedPeriod] = useState<string>(
        `${intInitialSemester === 1 ? '1st' : '2nd'} Semester ${intInitialYear}`,
    );
    const [blnShowSummarySidebar, setBlnShowSummarySidebar] = useState(false);
    const [objReportData, setObjReportData] = useState<GiaMonitoringFormData | null>(null);
    const [strReportUpdatedAt, setStrReportUpdatedAt] = useState<string | null>(null);
    const [blnIsLoadingReport, setBlnIsLoadingReport] = useState(false);
    const [blnIsSaving, setBlnIsSaving] = useState(false);
    const [strSaveError, setStrSaveError] = useState<string | null>(null);
    const [dtSavedAt, setDtSavedAt] = useState<Date | null>(null);
    const objGia = objProject.gia;
    const blnHasPersistedProject = objProject.backendId !== undefined;
    const objSelectedReportPeriod = useMemo(() =>
    {
        const objYearMatch = strSelectedPeriod.match(/(\d{4})$/);
        return {
            semester: (strSelectedPeriod.startsWith('2nd') ? 2 : 1) as 1 | 2,
            year: objYearMatch ? Number(objYearMatch[1]) : intInitialYear,
        };
    }, [intInitialYear, strSelectedPeriod]);

    useEffect(
        () =>
        {
            if (!objProject.backendId)
            {
                setObjReportData(null);
                setStrReportUpdatedAt(null);
                return;
            }

            let blnCancelled = false;
            setBlnIsLoadingReport(true);
            setObjReportData(null);
            setStrReportUpdatedAt(null);
            setStrSaveError(null);
            setDtSavedAt(null);

            fetchGiaMonitoringReport(
                objProject.backendId,
                objSelectedReportPeriod.year,
                objSelectedReportPeriod.semester,
            )
                .then((objReport) =>
                {
                    if (blnCancelled)
                    {
                        return;
                    }
                    setObjReportData(objReport?.form_data ?? null);
                    setStrReportUpdatedAt(objReport?.updated_at ?? null);
                })
                .catch((errError) =>
                {
                    reportError(errError, 'Failed to load GIA monitoring report:');
                    if (!blnCancelled)
                    {
                        setStrSaveError('Saved report could not be loaded. Please try again.');
                    }
                })
                .finally(() =>
                {
                    if (!blnCancelled)
                    {
                        setBlnIsLoadingReport(false);
                    }
                });

            return () =>
            {
                blnCancelled = true;
            };
        } /* end GiaMonitoringHub */,
        [objProject.backendId, objSelectedReportPeriod.semester, objSelectedReportPeriod.year],
    );

    /** Handle save. */
    const _handleSave = async (objFormData: GiaMonitoringFormData) =>
    {
        if (!objProject.backendId)
        {
            setStrSaveError('This project is not connected to a server record.');
            return;
        }

        setBlnIsSaving(true);
        setStrSaveError(null);
        try
        {
            const objSaved = await saveGiaMonitoringReport(
                objProject.backendId,
                objSelectedReportPeriod.year,
                objSelectedReportPeriod.semester,
                objFormData,
            );
            setObjReportData(objSaved.form_data);
            setStrReportUpdatedAt(objSaved.updated_at);
            setDtSavedAt(new Date(objSaved.updated_at));
        } catch (errError)
        {
            reportError(errError, 'GiaMonitoringHub: handle save failed.');

            reportError(errError, 'Failed to save GIA monitoring report:');
            setStrSaveError('Changes were not saved. Please check the form and try again.');
        } finally
        {
            setBlnIsSaving(false);
        }
    }; /* end _handleSave */

    return (
        <div className="w-full space-y-4 pb-20 font-sans text-slate-900">
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm">
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
                                    {objProject.enterprise || objProject.title}
                                </h1>
                                <span className="rounded-lg bg-[#E6EEF4] px-2.5 py-0.5 text-xs font-bold text-[#285497]">
                                    {objProject.referenceNumber || objProject.id}
                                </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                DOST-GIA Form 10 ·{' '}
                                <span className="text-[#285497] font-bold">
                                    Executive Summary of Technical Progress Report
                                </span>{' '}
                                · {strSelectedPeriod}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={strSelectedPeriod}
                            onChange={(objEvent) => setStrSelectedPeriod(objEvent.target.value)}
                            className="h-8.5 rounded-xl border border-[#B5BFCD] bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-[#0f53b7] focus:outline-none cursor-pointer"
                        >
                            <option value={`1st Semester ${intInitialYear}`}>
                                1st Semester {intInitialYear}
                            </option>
                            <option value={`2nd Semester ${intInitialYear}`}>
                                2nd Semester {intInitialYear}
                            </option>
                            <option value={`1st Semester ${intInitialYear - 1}`}>
                                1st Semester {intInitialYear - 1}
                            </option>
                            <option value={`2nd Semester ${intInitialYear - 1}`}>
                                2nd Semester {intInitialYear - 1}
                            </option>
                        </select>

                        <button
                            type="button"
                            onClick={() => setBlnShowSummarySidebar(!blnShowSummarySidebar)}
                            className={`inline-flex h-8.5 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition shadow-sm active:scale-95 ${blnShowSummarySidebar
                                ? 'border-[#0f53b7] bg-[#0f53b7] text-white shadow-md'
                                : 'border-[#B5BFCD] bg-white text-slate-700 hover:bg-[#E6EEF4] hover:text-[#285497]'
                                }`}
                            title="Toggle Live Summary Sidebar"
                        >
                            <BarChart3 className="size-3.5" />
                            <span>Summary KPI</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-[#E6EEF4] hover:text-[#285497] active:bg-[#0f53b7] active:text-white active:scale-95"
                        >
                            <FileDown className="size-3.5 text-[#285497]" />
                            <span>Generate Report</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end pr-1">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    {blnReadOnly ? (
                        <>
                            <LockKeyhole className="size-3.5 text-[#285497]" />
                            <span>Read-only monitoring view</span>
                        </>
                    ) : blnIsLoadingReport ? (
                        <>
                            <LoaderCircle className="size-3.5 animate-spin text-[#285497]" />
                            <span>Loading saved report...</span>
                        </>
                    ) : blnIsSaving ? (
                        <>
                            <LoaderCircle className="size-3.5 animate-spin text-[#285497]" />
                            <span>Saving changes...</span>
                        </>
                    ) : strSaveError ? (
                        <>
                            <AlertCircle className="size-3.5 text-rose-600" />
                            <span className="text-rose-700">{strSaveError}</span>
                        </>
                    ) : dtSavedAt ? (
                        <>
                            <Check className="size-3 text-emerald-600" />
                            <span>
                                Saved at{' '}
                                {dtSavedAt.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </>
                    ) : strReportUpdatedAt ? (
                        <>
                            <Check className="size-3 text-emerald-600" />
                            <span>Last saved {new Date(strReportUpdatedAt).toLocaleString()}</span>
                        </>
                    ) : (
                        <span>No saved report for this period</span>
                    )}
                </div>
            </div>

            <div className="flex items-start gap-5">
                <div className="min-w-0 flex-1 overflow-hidden">
                    <GiaMonitoringForm
                        key={`${objProject.backendId ?? objProject.id}-${strSelectedPeriod}-${strReportUpdatedAt ?? 'new'}`}
                        objProject={objProject}
                        onBack={onBack || (() => { })}
                        blnHideTopBar={true}
                        blnReadOnly={blnReadOnly || blnIsLoadingReport}
                        strSelectedReportingPeriod={strSelectedPeriod}
                        objInitialData={objReportData}
                        blnIsSaving={blnIsSaving}
                        onSave={_handleSave}
                    />
                </div>

                {blnShowSummarySidebar && (
                    <aside className="w-80 shrink-0 rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm space-y-4 sticky top-6">
                        <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    GIA (CEST) Summary
                                </h3>
                                <p className="text-xs text-slate-400 font-normal">
                                    {objProject.referenceNumber || objProject.id} ·{' '}
                                    {objProject.enterprise || objProject.title}
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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Grant Allocation
                                </span>
                                <span className="rounded-full bg-[#E6EEF4] px-2 py-0.5 text-[10px] font-bold text-[#285497]">
                                    {objProject.status || 'Active'}
                                </span>
                            </div>
                            <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">
                                        Total Grant Budget:
                                    </span>
                                    <span className="font-bold text-[#0f53b7]">
                                        {objProject.budget > 0
                                            ? formatCurrency(objProject.budget)
                                            : 'Not recorded'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">
                                        Implementing Agency:
                                    </span>
                                    <span className="font-bold text-slate-900 truncate max-w-[140px]">
                                        {objGia?.agency || objProject.enterprise}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">
                                        Project Leader:
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {objProject.manager || 'Not assigned'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                6Ps Deliverables Target
                            </span>
                            <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-3.5 space-y-2.5 text-xs">
                                {(
                                    objGia?.outputs || [
                                        { category: 'P1 Publications', target: 2, actual: 1 },
                                        { category: 'P2 Patents / IP', target: 1, actual: 0 },
                                        { category: 'P3 Products', target: 3, actual: 2 },
                                        { category: 'P4 People Services', target: 120, actual: 85 },
                                        { category: 'P5 Places / LGUs', target: 4, actual: 3 },
                                        { category: 'P6 Policies', target: 1, actual: 1 },
                                    ]
                                ).map((objO, intIndex) => (
                                    <div
                                        key={intIndex}
                                        className="flex justify-between items-center"
                                    >
                                        <span className="text-slate-600 font-medium truncate">
                                            {objO.category}
                                        </span>
                                        <span className="font-bold text-[#0f53b7]">
                                            {objO.actual} / {objO.target}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Beneficiary Sector Inclusion
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5">
                                    <span className="text-[10px] text-slate-400 block truncate">
                                        Farmers / Fisherfolk
                                    </span>
                                    <strong className="text-sm font-bold text-slate-900">
                                        {blnHasPersistedProject ? 'Not reported' : '210 (44%)'}
                                    </strong>
                                </div>
                                <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5">
                                    <span className="text-[10px] text-slate-400 block truncate">
                                        Women's Groups
                                    </span>
                                    <strong className="text-sm font-bold text-slate-900">
                                        {blnHasPersistedProject ? 'Not reported' : '145 (30%)'}
                                    </strong>
                                </div>
                                <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5">
                                    <span className="text-[10px] text-slate-400 block truncate">
                                        Cooperatives / MSME
                                    </span>
                                    <strong className="text-sm font-bold text-slate-900">
                                        {blnHasPersistedProject ? 'Not reported' : '70 (15%)'}
                                    </strong>
                                </div>
                                <div className="rounded-xl border border-[#B5BFCD]/60 bg-[#E6EEF4]/30 p-2.5">
                                    <span className="text-[10px] text-slate-400 block truncate">
                                        Indigenous (IPs)
                                    </span>
                                    <strong className="text-sm font-bold text-slate-900">
                                        {blnHasPersistedProject ? 'Not reported' : '55 (11%)'}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    ); // end return
} /* end GiaMonitoringHub */
