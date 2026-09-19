/**
 * System: DPRMS
 * Purpose: Render proposal review modal for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    ArrowRight,
    CheckCircle2,
    FileCheck2,
    FileText,
    RotateCcw,
    Send,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportError } from '../../utils/error_reporting';

import { ROLES } from '../../config/permissions';
import type { ProposalRecord } from '../../data/admin';
import { getMockUser } from '../../lib/mock_auth';
import { updateApplicationStatus } from '../../services/application_store';
import { markProposalInProcess } from '../../services/proposal_store';
import type { ApplicationRecord } from '../../types/application';
import { cn } from '../../utils/cn';
import { InternalDocumentsSection } from './proposal-review/InternalDocumentsSection';
import
{
    ProposalCommentsSection,
    type DecisionType,
} from './proposal-review/ProposalCommentsSection';
import { ProposalDocumentsSection } from './proposal-review/ProposalDocumentsSection';
import { ProposalOverviewSection } from './proposal-review/ProposalOverviewSection';
import type { ReviewSection } from './proposal-review/types';
import { StatusPill } from './StatusPill';

export type { ReviewSection } from './proposal-review/types';

interface ProposalReviewModalProps
{
    strInitialSection?: ReviewSection;
    onClose: () => void;
    onStatusChange?: (strStatus: ApplicationRecord['status'], txtRemarks?: string) => void;
    objProposal: ProposalRecord;
}

/** Render proposal review modal and its available actions. */
export function ProposalReviewModal({
    strInitialSection = 'overview',
    onClose,
    onStatusChange,
    objProposal: objInitialProposal,
}: ProposalReviewModalProps)
{
    const _navigate = useNavigate();
    const objCloseButtonRef = useRef<HTMLButtonElement>(null);
    const objUser = getMockUser();
    const blnIsProjectStaff = objUser?.role === ROLES.PROJECT_STAFF;
    const blnIsFocal = objUser?.role === ROLES.FOCAL;
    const blnIsDirector = objUser?.role === ROLES.PROVINCIAL_DIRECTOR;
    const [objProposal, setObjProposal] = useState<ProposalRecord>(objInitialProposal);
    const [strSection, setStrSection] = useState<ReviewSection>(strInitialSection);
    const [blnProponentDocumentsReady, setBlnProponentDocumentsReady] = useState(false);
    const [blnInternalDocumentsReady, setBlnInternalDocumentsReady] = useState(false);
    const [strWorkflowStage, setStrWorkflowStage] = useState<
        'initial_review' | 'in_process' | 'endorsed' | 'approved' | 'closed'
    >(() =>
    {
        if (
            objInitialProposal.status === 'Disapproved' ||
            objInitialProposal.status === 'Rejected' ||
            objInitialProposal.status === 'Returned for Revision'
        )
        {
            return 'closed';
        }
        if (objInitialProposal.status === 'Approved' || objInitialProposal.stage === 4)
        {
            return 'approved';
        }
        if (objInitialProposal.stage === 3)
        {
            return 'endorsed';
        }
        if (objInitialProposal.stage === 2)
        {
            return 'in_process';
        }
        return 'initial_review';
    });
    const [objDecisionRequest, setObjDecisionRequest] = useState<{
        id: number;
        type: DecisionType;
    } | null>(null);
    const [blnIsUpdating, setBlnIsUpdating] = useState(false);
    const [strFooterError, setStrFooterError] = useState<string | null>(null);

    const arrReviewTabs: Array<[ReviewSection, string]> = [
        ['overview', 'Overview'],
        ['documents', 'Document Checklist'],
        ['internalDocuments', 'Internal Documents'],
        ...(blnIsFocal || blnIsDirector
            ? ([
                ['comments', blnIsDirector ? 'Executive Decision' : 'Review Decision & Remarks'],
            ] as Array<[ReviewSection, string]>)
            : []),
    ];
    const strReviewStatus =
        strWorkflowStage === 'closed'
            ? String(objProposal.status)
            : strWorkflowStage === 'approved'
                ? 'Approved'
                : strWorkflowStage === 'endorsed'
                    ? 'Executive Approval'
                    : strWorkflowStage === 'in_process'
                        ? 'In Process'
                        : String(objProposal.status || 'Document Validation');

    useEffect(() =>
    {
        const objPreviousActiveElement = document.activeElement as HTMLElement | null;
        const strPreviousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        objCloseButtonRef.current?.focus();

        /** Handle key down. */
        function _handleKeyDown(objEvent: KeyboardEvent)
        {
            if (objEvent.key === 'Escape')
            {
                onClose();
            }
        }

        document.addEventListener('keydown', _handleKeyDown);

        return () =>
        {
            document.removeEventListener('keydown', _handleKeyDown);
            document.body.style.overflow = strPreviousOverflow;
            objPreviousActiveElement?.focus();
        };
    }, [onClose]);

    /** Handle mark in process. */
    async function _handleMarkInProcess()
    {
        setStrFooterError(null);
        setBlnIsUpdating(true);

        try
        {
            if (objProposal.proposalId)
            {
                await markProposalInProcess(objProposal.proposalId);
            }

            updateApplicationStatus(objProposal.id, 'In Process');
            setObjProposal((objCurrent) => ({ ...objCurrent, stage: 2, status: 'In Process' }));
            setStrWorkflowStage('in_process');
            onStatusChange?.('In Process');
        } catch (errError)
        {
            reportError(errError, 'ProposalReviewModal: handle mark in process failed.');

            reportError(errError, 'Failed to mark proposal as in process:');
            setStrFooterError('The application could not be updated. Please try again.');
        } finally
        {
            setBlnIsUpdating(false);
        }
    } /* end _handleMarkInProcess */

    /** Open decision. */
    function _openDecision(strType: DecisionType)
    {
        setObjDecisionRequest({ id: Date.now(), type: strType });
        setStrSection('comments');
    }

    const blnHasReviewStatus = Boolean(
        strReviewStatus && strReviewStatus !== 'Document Validation',
    );
    const blnCanPerformInitialReview = blnIsFocal && strWorkflowStage === 'initial_review';
    const blnCanProcessProposal = blnIsProjectStaff && strWorkflowStage === 'in_process';
    const blnIsAwaitingInitialReview = blnIsProjectStaff && strWorkflowStage === 'initial_review';
    const blnCanEvaluateProposal = blnIsFocal && strWorkflowStage === 'in_process';
    const blnCanApproveProposal = blnIsDirector && strWorkflowStage === 'endorsed';
    const blnIsAwaitingEndorsement =
        blnIsDirector &&
        strWorkflowStage !== 'endorsed' &&
        strWorkflowStage !== 'approved' &&
        strWorkflowStage !== 'closed';
    const blnIsAwaitingDirectorApproval = strWorkflowStage === 'endorsed' && !blnIsDirector;

    return (
        <div
            aria-labelledby="proposal-review-title"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 backdrop-blur-sm"
            role="dialog"
        >
            <div className="flex h-[92vh] max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0f53b7]">
                            <FileText className="size-4.5" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#0f53b7]">
                                    {objProposal.id}
                                </span>
                                <span className="text-slate-300">·</span>
                                <StatusPill strTone="info">{objProposal.program}</StatusPill>
                                {blnHasReviewStatus ? (
                                    <StatusPill
                                        strTone={
                                            strReviewStatus === 'Approved'
                                                ? 'success'
                                                : strReviewStatus === 'Disapproved' ||
                                                    strReviewStatus === 'Returned for Revision' ||
                                                    strReviewStatus === 'Rejected'
                                                    ? 'danger'
                                                    : 'warning'
                                        }
                                    >
                                        {strReviewStatus}
                                    </StatusPill>
                                ) : null}
                            </div>
                            <h2
                                className="truncate text-sm sm:text-base font-bold text-[#073b82]"
                                id="proposal-review-title"
                                title={objProposal.title}
                            >
                                {objProposal.title}
                            </h2>
                            <p className="truncate text-[11px] text-slate-500">
                                {objProposal.organization} · Submitted {objProposal.submitted}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                            {
                                onClose();
                                _navigate(
                                    `/dashboard/document-checklist?proposalId=${objProposal.proposalId || objProposal.id}&program=${objProposal.program}`,
                                );
                            }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#0f53b7] transition"
                            title="Open full Master Document Checklist"
                        >
                            <FileCheck2 className="size-3.5 text-[#0f53b7]" />
                            <span className="hidden sm:inline">Master Checklist</span>
                        </button>
                        <button
                            aria-label="Close proposal review"
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
                            onClick={onClose}
                            ref={objCloseButtonRef}
                            type="button"
                        >
                            <X className="size-4.5" />
                        </button>
                    </div>
                </header>

                <nav
                    aria-label="Proposal review sections"
                    className="relative z-10 flex shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-4 sm:px-6"
                >
                    {arrReviewTabs.map(([strValue, strLabel]) =>
                    {
                        return (
                            <button
                                aria-current={strSection === strValue ? 'page' : undefined}
                                className={cn(
                                    'whitespace-nowrap border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition',
                                    strSection === strValue
                                        ? 'border-[#0f53b7] text-[#073b82]'
                                        : 'border-transparent text-slate-500 hover:text-slate-800',
                                )}
                                key={strValue}
                                onClick={() => setStrSection(strValue)}
                                type="button"
                            >
                                {strLabel}
                            </button>
                        );
                    })}
                </nav>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-4">
                    {strSection === 'overview' ? (
                        <ProposalOverviewSection
                            onReviewFiles={() => setStrSection('documents')}
                            objProposal={objProposal}
                        />
                    ) : null}

                    {strSection === 'documents' ? (
                        objProposal.proposalId ? (
                            <ProposalDocumentsSection
                                onVerificationCompleteChange={setBlnProponentDocumentsReady}
                                strProgram={objProposal.program}
                                intProposalId={objProposal.proposalId}
                            />
                        ) : (
                            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
                                <FileCheck2 className="size-8 text-slate-400" />
                                <p className="mt-3 font-bold text-slate-800">
                                    Documents unavailable
                                </p>
                                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                                    This application isn't linked to a backend proposal record, so
                                    its submitted documents can't be loaded.
                                </p>
                            </div>
                        )
                    ) : null}

                    {strSection === 'internalDocuments' ? (
                        <InternalDocumentsSection
                            strMode={
                                blnIsProjectStaff
                                    ? strWorkflowStage === 'in_process'
                                        ? 'edit'
                                        : 'view'
                                    : blnIsFocal
                                        ? 'review'
                                        : 'view'
                            }
                            onRequiredStatusChange={setBlnInternalDocumentsReady}
                            strProgram={objProposal.program}
                            intProposalId={objProposal.proposalId}
                        />
                    ) : null}

                    {strSection === 'comments' ? (
                        <ProposalCommentsSection
                            objRequestedDecision={objDecisionRequest}
                            onDecisionApplied={
                                (strNewStatus, txtRemarks) =>
                                {
                                    const strStatus = strNewStatus as ProposalRecord['status'];
                                    setObjProposal((objPrevious) => ({
                                        ...objPrevious,
                                        stage:
                                            strNewStatus === 'Approved'
                                                ? 4
                                                : strNewStatus === 'Executive Approval'
                                                    ? 3
                                                    : strNewStatus === 'In Process'
                                                        ? 2
                                                        : objPrevious.stage,
                                        status: strStatus,
                                    }));
                                    if (strNewStatus === 'Approved')
                                    {
                                        setStrWorkflowStage('approved');
                                    } else if (strNewStatus === 'Executive Approval')
                                    {
                                        setStrWorkflowStage('endorsed');
                                    } else if (strNewStatus === 'In Process')
                                    {
                                        setStrWorkflowStage('in_process');
                                    } else if (
                                        strNewStatus === 'Disapproved' ||
                                        strNewStatus === 'Returned for Revision'
                                    )
                                    {
                                        setStrWorkflowStage('closed');
                                    }
                                    onStatusChange?.(
                                        strNewStatus as ApplicationRecord['status'],
                                        txtRemarks,
                                    );
                                } /* end ProposalReviewModal */
                            }
                            objProposal={objProposal}
                        />
                    ) : null}
                </div>

                <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <button
                        className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        onClick={onClose}
                        type="button"
                    >
                        Close review
                    </button>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {strFooterError ? (
                            <span className="text-xs font-bold text-rose-700" role="alert">
                                {strFooterError}
                            </span>
                        ) : null}

                        {blnCanPerformInitialReview ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {!blnProponentDocumentsReady ? (
                                    <span className="text-xs font-semibold text-amber-700">
                                        Verify all submitted proponent documents to advance to In
                                        Process
                                    </span>
                                ) : null}
                                <button
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0f53b7] px-4 text-xs font-bold text-white transition hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={!blnProponentDocumentsReady || blnIsUpdating}
                                    onClick={_handleMarkInProcess}
                                    title={
                                        !blnProponentDocumentsReady
                                            ? 'All submitted proponent documents must be verified first'
                                            : undefined
                                    }
                                    type="button"
                                >
                                    <Send className="size-3.5" />
                                    {blnIsUpdating
                                        ? 'Updating...'
                                        : 'Advance to In Process (Assessment & TNA)'}
                                </button>
                            </div>
                        ) : null}

                        {blnCanProcessProposal ? (
                            <button
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0f53b7] px-4 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
                                onClick={() => setStrSection('internalDocuments')}
                                type="button"
                            >
                                <FileCheck2 className="size-3.5" />
                                {blnInternalDocumentsReady
                                    ? 'View Internal Documents'
                                    : 'Upload Internal Documents'}
                            </button>
                        ) : null}

                        {blnIsAwaitingInitialReview ? (
                            <span className="text-xs font-semibold text-slate-500">
                                Waiting for Focal Person to start evaluation before document upload
                                is enabled
                            </span>
                        ) : null}

                        {blnCanEvaluateProposal ? (
                            <>
                                <button
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-50"
                                    onClick={() => _openDecision('return_revision')}
                                    type="button"
                                >
                                    <RotateCcw className="size-3.5" />
                                    Return for Revision
                                </button>
                                <button
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0f53b7] px-4 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
                                    onClick={() => _openDecision('endorse')}
                                    type="button"
                                >
                                    <Send className="size-3.5" />
                                    Recommend Approval
                                </button>
                            </>
                        ) : null}

                        {blnCanApproveProposal ? (
                            <>
                                <button
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-50"
                                    onClick={() => _openDecision('return_in_process')}
                                    type="button"
                                >
                                    <RotateCcw className="size-3.5" />
                                    Return to In Process
                                </button>
                                <button
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                                    onClick={() => _openDecision('disapprove')}
                                    type="button"
                                >
                                    <XCircle className="size-3.5" />
                                    Disapprove
                                </button>
                                <button
                                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700"
                                    onClick={() => _openDecision('approve')}
                                    type="button"
                                >
                                    <CheckCircle2 className="size-3.5" />
                                    Approve Application
                                </button>
                            </>
                        ) : null}

                        {blnIsAwaitingEndorsement ? (
                            <span className="text-xs font-semibold text-slate-500">
                                Waiting for Focal recommendation
                            </span>
                        ) : null}

                        {blnIsAwaitingDirectorApproval ? (
                            <span className="text-xs font-bold text-[#0f53b7]">
                                Endorsed to the Provincial Director
                            </span>
                        ) : null}

                        {strWorkflowStage === 'approved' ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                    <CheckCircle2 className="size-3.5" />
                                    Approved
                                </span>
                                {objProposal.proposalId ? (
                                    <button
                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-100 hover:text-[#0f53b7] transition"
                                        onClick={() =>
                                        {
                                            onClose();
                                            _navigate(
                                                `/dashboard/document-checklist?proposalId=${objProposal.proposalId}&program=${objProposal.program}`,
                                            );
                                        }}
                                        type="button"
                                    >
                                        <FileCheck2 className="size-3.5 text-slate-500" />
                                        Open Document Checklist
                                    </button>
                                ) : null}
                                {blnIsFocal ? (
                                    <button
                                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800"
                                        onClick={() =>
                                        {
                                            onClose();
                                            _navigate(
                                                `/dashboard/project-monitoring?program=${objProposal.program}&view=projects`,
                                            );
                                        }}
                                        type="button"
                                    >
                                        <span>Open in Monitored Projects</span>
                                        <ArrowRight className="size-3.5" />
                                    </button>
                                ) : null}
                            </div>
                        ) : null}

                        {strWorkflowStage === 'closed' ? (
                            <span className="text-xs font-bold text-slate-600">
                                {objProposal.status}
                            </span>
                        ) : null}
                    </div>
                </footer>
            </div>
        </div>
    ); // end return
} /* end ProposalReviewModal */
