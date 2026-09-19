/**
 * System: DPRMS
 * Purpose: Render reports page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    BarChart3,
    Download,
    FileCheck2,
    FolderKanban,
    Loader2,
    PackageSearch,
    Printer,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { reportError } from '../../utils/error_reporting';

import { DataTable, type DataColumn } from '../../components/admin/DataTable';
import g_objApi from '../../lib/axios';
import { getMockUser } from '../../lib/mock_auth';
import { downloadBlob, getAuthorizedDownloadPrograms } from '../../services/download_manager';
import type { ApplicationProgram } from '../../types/application';

interface ReportProject
{
    id: number;
    reference_number: string | null;
    title: string | null;
    program: ApplicationProgram;
    status: string;
    reports_count: number;
    updated_at: string | null;
}

interface ReportDashboard
{
    year: number;
    programs: ApplicationProgram[];
    summary: {
        proposals: number;
        projects: number;
        equipment: number;
        reports: number;
        submitted_reports: number;
        draft_reports: number;
        submission_rate: number;
    };
    projects: ReportProject[];
    generated_at: string;
}

interface SummaryCardProps
{
    icon: ComponentType<{ className?: string; }>;
    strLabel: string;
    value: number | string;
    strDetail: string;
}

/** Render summary card and its available actions. */
function SummaryCard({ icon: Icon, strLabel, value: objValue, strDetail }: SummaryCardProps)
{
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {strLabel}
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{objValue}</p>
                    <p className="mt-1 text-xs text-slate-500">{strDetail}</p>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0f5cc0]">
                    <Icon className="size-5" />
                </span>
            </div>
        </div>
    );
}

/** Format date. */
function _formatDate(strValue: string | null): string
{
    if (!strValue)
    {
        return '—';
    }
    return new Date(strValue).toLocaleDateString('en-PH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** Render reports page and its available actions. */
export function ReportsPage()
{
    const objUser = getMockUser();
    const intCurrentYear = new Date().getFullYear();
    const [intYear, setIntYear] = useState(intCurrentYear);
    const [strProgram, setStrProgram] = useState<'ALL' | ApplicationProgram>('ALL');
    const [objDashboard, setObjDashboard] = useState<ReportDashboard | null>(null);
    const [blnLoading, setBlnLoading] = useState(true);
    const [strError, setStrError] = useState<string | null>(null);
    const [strDownloadNotice, setStrDownloadNotice] = useState<string | null>(null);

    useEffect(
        () =>
        {
            let blnCancelled = false;
            setBlnLoading(true);
            setStrError(null);

            g_objApi
                .get<{ data: ReportDashboard; }>('/reports/dashboard', {
                    params: {
                        year: intYear,
                        ...(strProgram === 'ALL' ? {} : { program: strProgram }),
                    },
                })
                .then((objResponse) =>
                {
                    if (!blnCancelled)
                    {
                        setObjDashboard(objResponse.data.data);
                    }
                })
                .catch((objRequestError) =>
                {
                    reportError(objRequestError, 'Failed to load report dashboard:');
                    if (!blnCancelled)
                    {
                        setStrError('The report data could not be loaded. Please try again.');
                    }
                })
                .finally(() =>
                {
                    if (!blnCancelled)
                    {
                        setBlnLoading(false);
                    }
                });

            return () =>
            {
                blnCancelled = true;
            };
        } /* end ReportsPage */,
        [strProgram, intYear],
    );

    useEffect(() =>
    {
        if (objDashboard && strProgram !== 'ALL' && !objDashboard.programs.includes(strProgram))
        {
            setStrProgram('ALL');
        }
    }, [objDashboard, strProgram]);

    const arrColumns = useMemo<DataColumn<ReportProject>[]>(
        () => [
            {
                id: 'reference',
                header: 'Reference',
                sortValue: (objRow) => objRow.reference_number ?? '',
                render: (objRow) => (
                    <span className="font-mono text-xs font-bold text-[#0b4f9c]">
                        {objRow.reference_number ?? `PROJECT-${objRow.id}`}
                    </span>
                ),
            },
            {
                id: 'project',
                header: 'Project',
                sortValue: (objRow) => objRow.title ?? '',
                render: (objRow) => (
                    <span className="font-semibold text-slate-800">
                        {objRow.title ?? 'Untitled project'}
                    </span>
                ),
            },
            {
                id: 'program',
                header: 'Program',
                sortValue: (objRow) => objRow.program,
                render: (objRow) => (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0f5cc0]">
                        {objRow.program}
                    </span>
                ),
            },
            {
                id: 'reports',
                header: 'Reports',
                sortValue: (objRow) => objRow.reports_count,
                render: (objRow) => (
                    <span className="font-bold text-slate-700">{objRow.reports_count}</span>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                sortValue: (objRow) => objRow.status,
                render: (objRow) => (
                    <span className="capitalize text-slate-600">
                        {objRow.status.replaceAll('_', ' ').toLowerCase()}
                    </span>
                ),
            },
            {
                id: 'updated',
                header: 'Updated',
                sortValue: (objRow) => objRow.updated_at ?? '',
                render: (objRow) => (
                    <span className="text-slate-500">{_formatDate(objRow.updated_at)}</span>
                ),
            },
        ],
        [],
    );

    /** Export csv. */
    async function _exportCsv()
    {
        if (!objDashboard || !objUser)
        {
            return;
        }

        const arrRows = [
            ['Reference', 'Project', 'Program', 'Status', 'Reports', 'Updated'],
            ...objDashboard.projects.map((objProjectRow) => [
                objProjectRow.reference_number ?? `PROJECT-${objProjectRow.id}`,
                objProjectRow.title ?? 'Untitled project',
                objProjectRow.program,
                objProjectRow.status,
                String(objProjectRow.reports_count),
                objProjectRow.updated_at ?? '',
            ]),
        ];
        const strCsv = arrRows
            .map((arrRow) =>
                arrRow.map((strCell) => `"${strCell.replaceAll('"', '""')}"`).join(','),
            )
            .join('\n');
        const arrPrograms = getAuthorizedDownloadPrograms(objUser);
        const strDestinationProgram = strProgram === 'ALL' ? arrPrograms[0] : strProgram;

        try
        {
            const objResult = await downloadBlob({
                blob: new Blob([strCsv], { type: 'text/csv;charset=utf-8' }),
                fileName: `DPRMS_Report_${strProgram}_${intYear}.csv`,
                program: strDestinationProgram,
                user: objUser,
            });
            setStrDownloadNotice(`Saved to ${objResult.destination}`);
        } catch (errDownloadError)
        {
            reportError(errDownloadError, 'ReportsPage: export csv failed.');

            if (!(
                errDownloadError instanceof DOMException && errDownloadError.name === 'AbortError'
            ))
            {
                setStrDownloadNotice('The report could not be downloaded.');
            }
        }
    } /* end _exportCsv */

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Reports</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Live project and reporting data for your authorized records.
                        </p>
                    </div>
                    <div className="print-hidden flex flex-wrap gap-2">
                        <select
                            aria-label="Program"
                            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                            onChange={(objEvent) =>
                                setStrProgram(objEvent.target.value as 'ALL' | ApplicationProgram)
                            }
                            value={strProgram}
                        >
                            <option value="ALL">All programs</option>
                            {(objDashboard?.programs ?? []).map((strItem) => (
                                <option key={strItem} value={strItem}>
                                    {strItem}
                                </option>
                            ))}
                        </select>
                        <select
                            aria-label="Reporting year"
                            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                            onChange={(objEvent) => setIntYear(Number(objEvent.target.value))}
                            value={intYear}
                        >
                            {[
                                intCurrentYear,
                                intCurrentYear - 1,
                                intCurrentYear - 2,
                                intCurrentYear - 3,
                            ].map((intItem) => (
                                <option key={intItem} value={intItem}>
                                    {intItem}
                                </option>
                            ))}
                        </select>
                        <button
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            onClick={() => window.print()}
                            type="button"
                        >
                            <Printer className="size-4" /> Print
                        </button>
                        <button
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f5cc0] px-3 text-sm font-bold text-white hover:bg-[#0b4f9c] disabled:opacity-50"
                            disabled={!objDashboard}
                            onClick={_exportCsv}
                            type="button"
                        >
                            <Download className="size-4" /> Export CSV
                        </button>
                    </div>
                </div>
                {strDownloadNotice ? (
                    <p className="mt-3 text-sm font-semibold text-[#0f5cc0]">{strDownloadNotice}</p>
                ) : null}
            </section>

            {blnLoading ? (
                <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <Loader2 className="size-5 animate-spin" /> Loading live report data…
                    </div>
                </div>
            ) : strError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {strError}
                </div>
            ) : objDashboard ? (
                <>
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            icon={FolderKanban}
                            strLabel="Projects"
                            value={objDashboard.summary.projects}
                            strDetail={`${objDashboard.summary.proposals} proposal records`}
                        />
                        <SummaryCard
                            icon={FileCheck2}
                            strLabel="Reports"
                            value={objDashboard.summary.reports}
                            strDetail={`${objDashboard.summary.submitted_reports} submitted · ${objDashboard.summary.draft_reports} drafts`}
                        />
                        <SummaryCard
                            icon={PackageSearch}
                            strLabel="Equipment"
                            value={objDashboard.summary.equipment}
                            strDetail="Registered assets in scope"
                        />
                        <SummaryCard
                            icon={BarChart3}
                            strLabel="Submission rate"
                            value={`${objDashboard.summary.submission_rate}%`}
                            strDetail={`For reporting year ${objDashboard.year}`}
                        />
                    </section>
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4">
                            <h2 className="font-black text-slate-900">Project report activity</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Only projects you are allowed to view are included.
                            </p>
                        </div>
                        <DataTable
                            arrColumns={arrColumns}
                            arrData={objDashboard.projects}
                            txtEmptyDescription="No project reports were found for this selection."
                            strEmptyTitle="No report activity"
                            getRowKey={(objRow) => String(objRow.id)}
                            strSearchPlaceholder="Search projects…"
                            searchText={(objRow) =>
                                `${objRow.reference_number ?? ''} ${objRow.title ?? ''} ${objRow.program} ${objRow.status}`
                            }
                        />
                    </section>
                </>
            ) : null}
        </div>
    ); // end return
} /* end ReportsPage */
