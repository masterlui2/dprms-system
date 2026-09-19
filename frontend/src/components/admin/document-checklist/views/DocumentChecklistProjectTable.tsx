/**
 * System: DPRMS
 * Purpose: Render document checklist project table for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Eye, FileCheck2 } from 'lucide-react';

import type { ProposalChecklistRecord } from '../../../../services/document_checklist_store';
import { cn } from '../../../../utils/cn';
import { DataTable, type DataColumn } from '../../DataTable';

interface DocumentChecklistProjectTableProps
{
    blnCanReview: boolean;
    blnIsLoading: boolean;
    onSelectProject: (objProposal: ProposalChecklistRecord) => void;
    arrProposals: ProposalChecklistRecord[];
}

type ReviewState = {
    label: string;
    tone: string;
};

/** Get review state. */
function _getReviewState(objProposal: ProposalChecklistRecord): ReviewState
{
    if (!objProposal.detailsLoaded && objProposal.reviewStatus)
    {
        const objTones: Record<NonNullable<ProposalChecklistRecord['reviewStatus']>, string> = {
            Completed: 'text-emerald-700',
            'Needs Revision': 'text-rose-700',
            'In Review': 'text-[#0f53b7]',
            'In Progress': 'text-amber-700',
            'Not Started': 'text-slate-600',
        };
        return { label: objProposal.reviewStatus, tone: objTones[objProposal.reviewStatus] };
    }

    if (objProposal.compliancePercentage >= 100)
    {
        return {
            label: 'Completed',
            tone: 'text-emerald-700',
        };
    }

    if (objProposal.items.some((objItem) => objItem.status === 'Needs Revision'))
    {
        return {
            label: 'Needs Revision',
            tone: 'text-rose-700',
        };
    }

    if (objProposal.items.some((objItem) => objItem.status === 'Under Review'))
    {
        return {
            label: 'In Review',
            tone: 'text-[#0f53b7]',
        };
    }

    if (objProposal.items.some((objItem) => objItem.uploadedDoc || objItem.isPresent))
    {
        return {
            label: 'In Progress',
            tone: 'text-amber-700',
        };
    }

    return {
        label: 'Not Started',
        tone: 'text-slate-600',
    };
} /* end _getReviewState */

/** Get document counts. */
function _getDocumentCounts(objProposal: ProposalChecklistRecord)
{
    if (
        typeof objProposal.uploadedCount === 'number' &&
        typeof objProposal.remainingCount === 'number'
    )
    {
        const intTotal = objProposal.uploadedCount + objProposal.remainingCount;
        return {
            uploaded: objProposal.uploadedCount,
            remaining: objProposal.remainingCount,
            total: intTotal,
            percentage: intTotal > 0 ? Math.round((objProposal.uploadedCount / intTotal) * 100) : 0,
        };
    }

    const arrRequiredItems = objProposal.items.filter((objItem) => objItem.isRequired);
    const arrCountableItems = arrRequiredItems.length > 0 ? arrRequiredItems : objProposal.items;
    const intUploaded =
        arrCountableItems.length > 0
            ? arrCountableItems.filter((objItem) => Boolean(objItem.uploadedDoc)).length
            : objProposal.compliedCount;

    return {
        uploaded: intUploaded,
        remaining: Math.max(0, objProposal.totalRequired - intUploaded),
        total: objProposal.totalRequired,
        percentage:
            objProposal.totalRequired > 0
                ? Math.round((intUploaded / objProposal.totalRequired) * 100)
                : 0,
    };
} /* end _getDocumentCounts */

/** Render document checklist project table and its available actions. */
export function DocumentChecklistProjectTable({
    blnCanReview,
    blnIsLoading,
    onSelectProject,
    arrProposals,
}: DocumentChecklistProjectTableProps)
{
    const strActionLabel = blnCanReview ? 'Review' : 'View';

    const arrColumns: DataColumn<ProposalChecklistRecord>[] = [
        {
            id: 'project',
            header: 'Project',
            className: 'w-[29%]',
            sortValue: (objProposal) => objProposal.enterpriseName,
            render: (objProposal) => (
                <div className="min-w-0">
                    <p className="line-clamp-2 font-semibold leading-snug text-slate-900">
                        {objProposal.enterpriseName}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-[#285497]">
                        {objProposal.referenceNumber}
                    </p>
                </div>
            ),
        },
        {
            id: 'proponent',
            header: 'Proponent',
            className: 'w-[21%]',
            sortValue: (objProposal) => objProposal.proponentName,
            render: (objProposal) => (
                <p
                    className="truncate font-medium text-slate-800"
                    title={objProposal.proponentName}
                >
                    {objProposal.proponentName}
                </p>
            ),
        },
        {
            id: 'documents',
            header: 'Documents',
            align: 'right',
            className: 'w-[25%]',
            sortValue: (objProposal) => _getDocumentCounts(objProposal).percentage,
            render: (objProposal) =>
            {
                const objCounts = _getDocumentCounts(objProposal);
                return (
                    <div className="ml-auto w-full max-w-48">
                        <div className="flex items-center justify-between gap-3 text-xs tabular-nums">
                            <span className="font-semibold text-[#0f53b7]">
                                {objCounts.uploaded}/{objCounts.total} uploaded
                            </span>
                            <span className="text-slate-500">{objCounts.remaining} left</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-[#0f53b7] transition-[width] duration-300"
                                style={{ width: `${objCounts.percentage}%` }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'reviewStatus',
            header: 'Status',
            className: 'w-[13%]',
            sortValue: (objProposal) => _getReviewState(objProposal).label,
            render: (objProposal) =>
            {
                const objState = _getReviewState(objProposal);
                return (
                    <span
                        className={cn(
                            'inline-flex text-xs font-semibold leading-snug',
                            objState.tone,
                        )}
                    >
                        {objState.label}
                    </span>
                );
            },
        },
        {
            id: 'action',
            header: 'Action',
            align: 'right',
            className: 'w-[12%]',
            render: (objProposal) => (
                <button
                    type="button"
                    aria-label={`${strActionLabel} for ${objProposal.enterpriseName}`}
                    title={strActionLabel}
                    onClick={(objEvent) =>
                    {
                        objEvent.stopPropagation();
                        onSelectProject(objProposal);
                    }}
                    className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#0f53b7] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0b438f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                >
                    {blnCanReview ? (
                        <FileCheck2 className="size-3.5" />
                    ) : (
                        <Eye className="size-3.5" />
                    )}
                    <span>{strActionLabel}</span>
                </button>
            ),
        },
    ];

    return (
        <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
            <DataTable
                arrColumns={arrColumns}
                arrData={arrProposals}
                txtEmptyDescription="Approved projects will appear here when they are ready for document review."
                strEmptyTitle="No projects available"
                blnFitColumns
                getRowKey={(objProposal) => String(objProposal.proposalId)}
                intInitialRowsPerPage={10}
                blnIsLoading={blnIsLoading}
                mobileRender={
                    (objProposal) =>
                    {
                        const objState = _getReviewState(objProposal);
                        const objCounts = _getDocumentCounts(objProposal);
                        return (
                            <div className="space-y-3">
                                <div>
                                    <div className="min-w-0">
                                        <p className="font-semibold leading-snug text-slate-900">
                                            {objProposal.enterpriseName}
                                        </p>
                                        <p className="mt-1 truncate font-mono text-xs text-[#285497]">
                                            {objProposal.referenceNumber}
                                        </p>
                                    </div>
                                </div>

                                <div className="min-w-0 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        Proponent
                                    </p>
                                    <p className="mt-1 truncate font-semibold text-slate-800">
                                        {objProposal.proponentName}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-3 text-xs">
                                    <div className="flex items-center justify-between gap-3 tabular-nums">
                                        <span className="font-semibold text-[#0f53b7]">
                                            {objCounts.uploaded}/{objCounts.total} uploaded
                                        </span>
                                        <span className="text-slate-500">
                                            {objCounts.remaining} left
                                        </span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full rounded-full bg-[#0f53b7] transition-[width] duration-300"
                                            style={{ width: `${objCounts.percentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <span
                                        className={cn(
                                            'text-xs font-semibold leading-snug',
                                            objState.tone,
                                        )}
                                    >
                                        {objState.label}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={(objEvent) =>
                                    {
                                        objEvent.stopPropagation();
                                        onSelectProject(objProposal);
                                    }}
                                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-3 text-xs font-semibold text-white"
                                >
                                    {blnCanReview ? (
                                        <FileCheck2 className="size-3.5" />
                                    ) : (
                                        <Eye className="size-3.5" />
                                    )}
                                    {strActionLabel}
                                </button>
                            </div>
                        ); // end return
                    } /* end DocumentChecklistProjectTable */
                }
                onRowClick={onSelectProject}
                strSearchPlaceholder="Search projects..."
                searchText={(objProposal) =>
                    `${objProposal.enterpriseName} ${objProposal.referenceNumber} ${objProposal.proponentName} ${objProposal.proponentEmail} ${objProposal.district || ''} ${objProposal.focalName || ''} ${objProposal.submittedDate} ${_getReviewState(objProposal).label}`
                }
                strVariant="clean"
            />
        </section>
    ); // end return
} /* end DocumentChecklistProjectTable */
