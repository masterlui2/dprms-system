/**
 * System: DPRMS
 * Purpose: Render budget page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { AlertTriangle, ArrowRight, Check, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { DataTable, type DataColumn } from '../../components/admin/DataTable';
import { RepaymentLedgerView } from '../../components/admin/RepaymentLedgerView';
import { AnimatedTabs } from '../../components/common/AnimatedTabs';
import { ROLES } from '../../config/permissions';
import type { ProjectRecord } from '../../data/admin';
import { getMockUser } from '../../lib/mock_auth';
import { fetchSetupMonitoringProjects } from '../../services/setup_monitoring_store';

/** Format funding. */
function _formatFunding(intValue: number): string
{
    if (intValue <= 0)
    {
        return 'Not recorded';
    }

    return new Intl.NumberFormat('en-PH', {
        currency: 'PHP',
        maximumFractionDigits: 2,
        style: 'currency',
    }).format(intValue);
}

/** Format release date. */
function _formatReleaseDate(strValue?: string | null): string | null
{
    if (!strValue)
    {
        return null;
    }

    const dtDate = /^\d{4}-\d{2}-\d{2}$/.test(strValue)
        ? new Date(`${strValue}T00:00:00`)
        : new Date(strValue);

    return Number.isNaN(dtDate.getTime())
        ? strValue
        : dtDate.toLocaleDateString('en-PH', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
}

/** Render budget page and its available actions. */
export function BudgetPage()
{
    const _navigate = useNavigate();
    const { projectId: strProjectIdParam } = useParams();
    const objUser = getMockUser();
    const [arrProjects, setArrProjects] = useState<ProjectRecord[]>([]);
    const [strFilterTab, setStrFilterTab] = useState<'all' | 'active' | 'needs_schedule'>('all');
    const [blnIsLoading, setBlnIsLoading] = useState(true);
    const [strError, setStrError] = useState<string | null>(null);
    const blnIsDirector = objUser?.role === ROLES.PROVINCIAL_DIRECTOR;
    const blnHasSetupAccess =
        blnIsDirector || (objUser?.role === ROLES.FOCAL && objUser.program === 'SETUP');
    const intProjectId = Number(strProjectIdParam);

    useEffect(
        () =>
        {
            if (!blnHasSetupAccess || strProjectIdParam)
            {
                return;
            }

            let blnCancelled = false;
            setBlnIsLoading(true);
            setStrError(null);

            fetchSetupMonitoringProjects({
                perPage: 100,
            })
                .then((objResult) =>
                {
                    if (blnCancelled)
                    {
                        return;
                    }
                    setArrProjects(objResult.projects);
                })
                .catch((objLoadError: unknown) =>
                {
                    if (blnCancelled)
                    {
                        return;
                    }
                    setStrError(
                        objLoadError instanceof Error
                            ? objLoadError.message
                            : 'Could not load SETUP projects.',
                    );
                })
                .finally(() =>
                {
                    if (!blnCancelled)
                    {
                        setBlnIsLoading(false);
                    }
                });

            return () =>
            {
                blnCancelled = true;
            };
        } /* end BudgetPage */,
        [blnHasSetupAccess, strProjectIdParam],
    );

    if (!blnHasSetupAccess)
    {
        return (
            <div className="space-y-6 font-sans">
                <div className="flex items-center gap-3">
                    <span className="h-9 sm:h-10 w-1.5 rounded-full bg-[#0f53b7]" />
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-slate-400">
                            <span>Repayment Monitoring</span>
                            <span>&gt;</span>
                            <span className="font-bold text-[#285497]">SETUP Program</span>
                        </div>
                        <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
                            Repayment Ledger
                        </h1>
                    </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
                    <AlertTriangle className="mx-auto size-7 text-amber-700" />
                    <p className="mt-3 font-black text-amber-900">SETUP access required</p>
                    <p className="mt-1 text-sm text-amber-700">
                        This ledger is available to the SSCP Focal and Provincial Director.
                    </p>
                </div>
            </div>
        );
    }

    if (strProjectIdParam)
    {
        return Number.isInteger(intProjectId) && intProjectId > 0 ? (
            <RepaymentLedgerView
                onBack={() => _navigate('/dashboard/repayment-monitoring')}
                intProjectId={intProjectId}
            />
        ) : (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center font-bold text-rose-800">
                Invalid project ledger.
            </div>
        );
    }

    const intAllCount = arrProjects.length;
    const intNeedsScheduleCount = arrProjects.filter(
        (objItem) => objItem.budget <= 0 || !objItem.fullRelease,
    ).length;
    const intActiveCount = intAllCount - intNeedsScheduleCount;

    const arrFilteredProjects = arrProjects.filter((objItem) =>
    {
        const blnNeedsInit = objItem.budget <= 0 || !objItem.fullRelease;
        if (strFilterTab === 'needs_schedule')
        {
            return blnNeedsInit;
        }
        if (strFilterTab === 'active')
        {
            return !blnNeedsInit;
        }
        return true;
    });

    const arrColumns: DataColumn<ProjectRecord>[] = [
        {
            className: 'w-[12%]',
            header: 'Reference',
            id: 'reference',
            render: (objProject) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200/80 font-mono text-xs font-bold text-slate-700 whitespace-nowrap shadow-2xs">
                    {objProject.referenceNumber ?? objProject.id}
                </span>
            ),
            sortValue: (objProject) => objProject.referenceNumber ?? objProject.id,
        },
        {
            className: 'w-[20%]',
            header: 'Project Title',
            id: 'title',
            render: (objProject) => (
                <p
                    className="font-bold leading-snug text-slate-900 text-sm line-clamp-2 hover:text-[#0f53b7] transition-colors"
                    title={objProject.title}
                >
                    {objProject.title}
                </p>
            ),
            sortValue: (objProject) => objProject.title,
        },
        {
            className: 'w-[22%]',
            header: 'Project Beneficiary',
            id: 'enterprise',
            render: (objProject) => (
                <div className="space-y-0.5">
                    <p className="font-bold text-sm text-slate-900 leading-snug">
                        {objProject.enterprise}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                        {objProject.proponentName || objProject.manager || 'Cooperator'}
                    </p>
                    {objProject.contactNumber ? (
                        <p className="text-[11px] font-normal text-slate-400">
                            {objProject.contactNumber}
                        </p>
                    ) : null}
                </div>
            ),
            sortValue: (objProject) => objProject.enterprise,
        },
        {
            align: 'right',
            className: 'w-[13%]',
            header: 'SETUP Funding',
            id: 'funding',
            render: (objProject) =>
            {
                const blnNeedsInit = objProject.budget <= 0 || !objProject.fullRelease;
                return blnNeedsInit ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        Needs Terms
                    </span>
                ) : (
                    <span className="font-bold text-sm text-[#073b82] leading-snug">
                        {_formatFunding(objProject.budget)}
                    </span>
                );
            },
            sortValue: (objProject) => objProject.budget,
        },
        {
            className: 'w-[11%]',
            header: 'Full Release',
            id: 'fullRelease',
            render: (objProject) => (
                <span className="text-xs font-medium text-slate-700 whitespace-nowrap block">
                    {_formatReleaseDate(objProject.fullRelease) || (
                        <span className="text-slate-400 font-normal">Not recorded</span>
                    )}
                </span>
            ),
            sortValue: (objProject) => objProject.fullRelease || '',
        },
        {
            className: 'w-[10%]',
            header: 'Status',
            id: 'status',
            render: (objProject) =>
            {
                const blnNeedsInit = objProject.budget <= 0 || !objProject.fullRelease;
                return blnNeedsInit ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 whitespace-nowrap">
                        <Clock className="size-3" />
                        Needs Schedule
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                        <Check className="size-3" />
                        Active
                    </span>
                );
            },
            sortValue: (objProject) =>
                objProject.budget <= 0 || !objProject.fullRelease ? 'Needs Schedule' : 'Active',
        },
        {
            className: 'w-[12%] text-right',
            header: 'ACTION',
            id: 'action',
            render: (objProject) =>
            {
                const objId = objProject.backendId ?? objProject.id;
                const blnNeedsInit = objProject.budget <= 0 || !objProject.fullRelease;
                return (
                    <div className="flex items-center justify-end">
                        <button
                            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#0f53b7] px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0b3f8b]"
                            onClick={(objEvent) =>
                            {
                                objEvent.stopPropagation();
                                _navigate(`/dashboard/repayment-monitoring/${objId}`);
                            }}
                            title={
                                blnNeedsInit && !blnIsDirector
                                    ? 'Initialize Repayment Schedule'
                                    : 'Open Repayment Ledger'
                            }
                            type="button"
                        >
                            <span>
                                {blnIsDirector ? 'View' : blnNeedsInit ? 'Initialize' : 'Ledger'}
                            </span>
                            <ArrowRight className="size-3.5" />
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6 font-sans">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="h-9 sm:h-10 w-1.5 rounded-full bg-[#0f53b7]" />
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-slate-400">
                            <span>Repayment Monitoring</span>
                            <span>&gt;</span>
                            <span className="font-bold text-[#285497]">SETUP Program</span>
                        </div>
                        <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
                            Repayment Ledger
                        </h1>
                    </div>
                </div>
                {blnIsDirector ? (
                    <span className="self-start sm:self-auto rounded-full bg-slate-200 px-3 py-1.5 text-xs font-black text-slate-600">
                        Read only
                    </span>
                ) : null}
            </div>

            {/* Modern Segmented Filter Tabs */}
            <div>
                <AnimatedTabs
                    strActiveTab={strFilterTab}
                    strLayoutId="repayment-overview-tabs"
                    onChange={(strId) =>
                        setStrFilterTab(strId as 'all' | 'active' | 'needs_schedule')
                    }
                    arrTabs={[
                        { id: 'all', label: 'All', count: intAllCount },
                        { id: 'active', label: 'Active Repayment', count: intActiveCount },
                        {
                            id: 'needs_schedule',
                            label: 'Needs Schedule',
                            count: intNeedsScheduleCount,
                        },
                    ]}
                />
            </div>

            <section className="overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
                {strError ? (
                    <p className="p-6 text-sm text-rose-600">{strError}</p>
                ) : (
                    <DataTable
                        arrColumns={arrColumns}
                        arrData={arrFilteredProjects}
                        txtEmptyDescription="There are no active SETUP projects matching your filter criteria."
                        strEmptyTitle="No repayment projects found"
                        getRowKey={(objProject) => String(objProject.backendId ?? objProject.id)}
                        blnFitColumns
                        intInitialRowsPerPage={10}
                        blnIsLoading={blnIsLoading}
                        mobileRender={
                            (objProject) =>
                            {
                                const objId = objProject.backendId ?? objProject.id;
                                const blnNeedsInit =
                                    objProject.budget <= 0 || !objProject.fullRelease;
                                return (
                                    <div className="space-y-3 font-sans">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200/80 font-mono text-xs font-bold text-slate-700 whitespace-nowrap shadow-2xs">
                                                {objProject.referenceNumber ?? objProject.id}
                                            </span>
                                            {blnNeedsInit ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                                                    <Clock className="size-3" /> Needs Schedule
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                                    <Check className="size-3" /> Active
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold leading-snug text-slate-900 text-sm">
                                                {objProject.title}
                                            </p>
                                            <p className="mt-0.5 text-xs font-semibold text-slate-800">
                                                {objProject.enterprise}
                                            </p>
                                            <p className="text-[11px] font-medium text-slate-500">
                                                {objProject.proponentName ||
                                                    objProject.manager ||
                                                    'Cooperator'}
                                            </p>
                                        </div>
                                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-slate-50 p-3 text-xs">
                                            <div>
                                                <dt className="font-bold text-slate-400">
                                                    Contact No.
                                                </dt>
                                                <dd className="mt-1 font-semibold text-slate-700">
                                                    {objProject.contactNumber || 'Not recorded'}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-bold text-slate-400">
                                                    SETUP Funding
                                                </dt>
                                                <dd className="mt-1 font-bold text-[#073b82]">
                                                    {blnNeedsInit
                                                        ? 'Needs Terms'
                                                        : _formatFunding(objProject.budget)}
                                                </dd>
                                            </div>
                                            <div className="col-span-2">
                                                <dt className="font-bold text-slate-400">
                                                    Full Release
                                                </dt>
                                                <dd className="mt-1 font-semibold text-slate-700">
                                                    {_formatReleaseDate(objProject.fullRelease) ||
                                                        'Not recorded'}
                                                </dd>
                                            </div>
                                        </dl>
                                        <button
                                            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0f53b7] text-xs font-semibold text-white transition hover:bg-[#0b3f8b]"
                                            onClick={() =>
                                                _navigate(
                                                    `/dashboard/repayment-monitoring/${objId}`,
                                                )
                                            }
                                            type="button"
                                        >
                                            <span>
                                                {blnIsDirector
                                                    ? 'View Ledger'
                                                    : blnNeedsInit
                                                        ? 'Initialize Ledger'
                                                        : 'Open Ledger'}
                                            </span>
                                            <ArrowRight className="size-3.5" />
                                        </button>
                                    </div>
                                ); // end return
                            } /* end BudgetPage */
                        }
                        strSearchPlaceholder="Search projects by reference, title, or beneficiary..."
                        searchText={(objProject) =>
                            `${objProject.referenceNumber ?? objProject.id} ${objProject.title} ${objProject.enterprise} ${objProject.contactNumber ?? ''} ${objProject.fullRelease ?? ''}`
                        }
                    />
                )}
            </section>
        </div>
    ); // end return
} /* end BudgetPage */
