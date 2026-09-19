/**
 * System: DPRMS
 * Purpose: Render proposal comments section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    CheckCircle2,
    Clock3,
    MessageSquare,
    RotateCcw,
    Send,
    Tag,
    UserPlus,
    UserRound,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { reportError } from '../../../utils/error_reporting';

import { ROLES } from '../../../config/permissions';
import type { ProposalRecord } from '../../../data/admin';
import { getMockUser } from '../../../lib/mock_auth';
import { updateApplicationStatus } from '../../../services/application_store';
import
{
    fetchProposalAuditLogs,
    type ProposalAuditRecord,
} from '../../../services/proposal_audit_store';
import { applyProposalDecision, type ProposalDecision } from '../../../services/proposal_store';
import { cn } from '../../../utils/cn';

export type DecisionType = ProposalDecision | 'return_in_process';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

interface ReviewComment
{
    id: string;
    author: string;
    date: string;
    actionLabel: string;
    actionIcon: typeof CheckCircle2;
    tone: Tone;
    finding?: string;
    note?: string;
    previousStatus: string | null;
    newStatus: string | null;
    assignedEvaluatorName?: string | null;
}

/** Format audit date. */
function _formatAuditDate(strRaw?: string): string
{
    if (!strRaw)
    {
        return '';
    }
    const dtParsed = new Date(strRaw);
    if (Number.isNaN(dtParsed.getTime()))
    {
        return strRaw;
    }
    return dtParsed.toLocaleDateString('en-US', {
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

// Humanizes an unrecognized backend action string, e.g.
// "ASSIGN_PROJECT_STAFF" -> "Assign Project Staff"
function _humanizeAction(strAction: string): string
{
    return strAction
        .toLowerCase()
        .split('_')
        .map((strWord) => strWord.charAt(0).toUpperCase() + strWord.slice(1))
        .join(' ');
}

// Known backend `action` values -> display metadata. Extend this as you
// discover more action strings being logged (e.g. via the controller/enum).
const ACTION_META: Record<string, { icon: typeof CheckCircle2; tone: Tone; label: string; }> = {
    SUBMIT: { icon: Send, tone: 'neutral', label: 'Submitted' },
    UPDATE: { icon: RotateCcw, tone: 'neutral', label: 'Updated' },
    DELETE: { icon: XCircle, tone: 'danger', label: 'Deleted' },
    APPROVE: { icon: CheckCircle2, tone: 'success', label: 'Approved' },
    DISAPPROVE: { icon: XCircle, tone: 'danger', label: 'Disapproved' },
    ASSIGN_PROJECT_STAFF: { icon: UserPlus, tone: 'neutral', label: 'Assigned Project Staff' },
};

/** Get action meta. */
function _getActionMeta(strAction: string | null)
{
    if (!strAction)
    {
        return { icon: MessageSquare, tone: 'neutral' as Tone, label: 'Review Note' };
    }
    const objKnown = ACTION_META[strAction];
    if (objKnown)
    {
        return objKnown;
    }
    return { icon: MessageSquare, tone: 'neutral' as Tone, label: _humanizeAction(strAction) };
}

/** Map audit record. */
function _mapAuditRecord(objRecord: ProposalAuditRecord): ReviewComment
{
    const objMeta = _getActionMeta(objRecord.action);
    return {
        id: String(objRecord.id),
        author: objRecord.reviewer?.name || 'Unknown Reviewer',
        date: _formatAuditDate(objRecord.created_at),
        actionLabel: objMeta.label,
        actionIcon: objMeta.icon,
        tone: objMeta.tone,
        finding: objRecord.findings || undefined,
        note: objRecord.remarks || undefined,
        previousStatus: objRecord.previous_status,
        newStatus: objRecord.new_status,
        assignedEvaluatorName: objRecord.assigned_evaluator?.name,
    };
}

const PRESETS_BY_DECISION: Record<DecisionType, string[]> = {
    endorse: [
        'Documentary requirements complete and validated.',
        'Equipment quotation and Line-Item Budget verified.',
        'Technical assessment and TNA completed. Recommended for Provincial Director approval.',
        'Site validation passed with full technical compliance.',
    ],
    return_revision: [
        'Incomplete documentary requirements. Please re-submit valid documents.',
        'Updated equipment quotation / technical specifications required.',
        'Clarification needed on Line-Item Budget / Financial records.',
        'Non-compliant with program qualification criteria.',
    ],
    approve: [
        'Formally approved for project creation and fund scheduling.',
        'Executive evaluation complete. Proceed to project implementation.',
        'Full compliance with DOST regional grant guidelines.',
    ],
    return_in_process: [
        'Returned to In Process for technical clarification and re-assessment.',
        'Financial or equipment adjustments required from Focal Person.',
    ],
    disapprove: [
        'Project scope falls outside current regional priority areas.',
        'Non-compliant with minimum qualification guidelines.',
    ],
};

const DECISION_OPTIONS: Array<{
    description: string;
    icon: typeof CheckCircle2;
    id: DecisionType;
    label: string;
    newStatus?: string;
    tone: 'success' | 'warning' | 'danger';
}> = [
        {
            description:
                "Issue the Provincial Director's final approval and activate the project workflow.",
            icon: CheckCircle2,
            id: 'approve',
            label: 'Approve Application',
            newStatus: 'Approved',
            tone: 'success',
        },
        {
            description:
                'Technical or Line-Item Budget adjustments needed. Return proposal back to In Process.',
            icon: RotateCcw,
            id: 'return_in_process',
            label: 'Return to In Process (Technical Issue)',
            newStatus: 'In Process',
            tone: 'warning',
        },
        {
            description:
                'Documents complete and verified. Forward for Provincial Director executive approval.',
            icon: CheckCircle2,
            id: 'endorse',
            label: 'Endorse for Approval',
            newStatus: 'Executive Approval',
            tone: 'success',
        },
        {
            description:
                'Issues or incomplete records found. Return application to proponent for revision.',
            icon: RotateCcw,
            id: 'return_revision',
            label: 'Return to Applicant for Revision',
            newStatus: 'Returned for Revision',
            tone: 'warning',
        },
        {
            description:
                'Proposal does not meet qualifications or requirements. Formally disapprove application.',
            icon: XCircle,
            id: 'disapprove',
            label: 'Disapprove Application',
            newStatus: 'Disapproved',
            tone: 'danger',
        },
    ];

/** Get allowed decisions. */
function _getAllowedDecisions(strRole?: string): DecisionType[]
{
    if (strRole === ROLES.FOCAL)
    {
        return ['endorse', 'return_revision'];
    }

    if (strRole === ROLES.PROVINCIAL_DIRECTOR)
    {
        return ['approve', 'return_in_process', 'disapprove'];
    }

    return [];
}

const TONE_CLASSES: Record<Tone, { badge: string; iconWrap: string; }> = {
    success: {
        badge: 'text-emerald-700',
        iconWrap: 'bg-emerald-600 text-white',
    },
    warning: {
        badge: 'text-amber-700',
        iconWrap: 'bg-amber-600 text-white',
    },
    danger: {
        badge: 'text-rose-700',
        iconWrap: 'bg-rose-600 text-white',
    },
    neutral: {
        badge: 'text-slate-600',
        iconWrap: 'bg-slate-500 text-white',
    },
};

/** Render proposal comments section and its available actions. */
export function ProposalCommentsSection({
    onDecisionApplied,
    objProposal,
    objRequestedDecision,
}: {
    onDecisionApplied?: (strNewStatus: string, txtRemarks?: string) => void;
    objProposal?: ProposalRecord;
    objRequestedDecision?: { id: number; type: DecisionType; } | null;
})
{
    const objCurrentUser = getMockUser();
    const arrAllowedDecisions = _getAllowedDecisions(objCurrentUser?.role);
    const [arrComments, setArrComments] = useState<ReviewComment[]>([]);
    const [blnIsLoadingComments, setBlnIsLoadingComments] = useState(false);
    const [strLoadError, setStrLoadError] = useState<string | null>(null);
    const [strSelectedDecision, setStrSelectedDecision] = useState<DecisionType>(
        () => arrAllowedDecisions[0] || 'endorse',
    );
    const [strSelectedFinding, setStrSelectedFinding] = useState('');
    const [strNewNote, setStrNewNote] = useState('');
    const [strSubmitNotice, setStrSubmitNotice] = useState<string | null>(null);
    const [strSubmitError, setStrSubmitError] = useState<string | null>(null);
    const [blnIsSubmitting, setBlnIsSubmitting] = useState(false);

    const arrVisibleDecisionOptions = DECISION_OPTIONS.filter((objOption) =>
        arrAllowedDecisions.includes(objOption.id),
    );

    const _loadAuditTrail = useCallback(async () =>
    {
        if (!objProposal?.proposalId)
        {
            setArrComments([]);
            return;
        }

        setBlnIsLoadingComments(true);
        setStrLoadError(null);
        try
        {
            const arrRecords = await fetchProposalAuditLogs(objProposal.proposalId);
            setArrComments(arrRecords.map(_mapAuditRecord));
        } catch (errError)
        {
            reportError(errError, 'ProposalCommentsSection: load audit trail failed.');

            reportError(errError, 'Failed to load proposal audit trail:');
            setStrLoadError('Could not load the review history. Please try refreshing.');
        } finally
        {
            setBlnIsLoadingComments(false);
        }
    }, [objProposal?.proposalId]);

    useEffect(() =>
    {
        _loadAuditTrail();
    }, [_loadAuditTrail]);

    useEffect(() =>
    {
        if (
            objRequestedDecision &&
            _getAllowedDecisions(objCurrentUser?.role).includes(objRequestedDecision.type)
        )
        {
            setStrSelectedDecision(objRequestedDecision.type);
        }
    }, [objCurrentUser?.role, objRequestedDecision]);

    /** Handle add comment. */
    async function _handleAddComment()
    {
        if (
            (strSelectedDecision === 'return_revision' ||
                strSelectedDecision === 'return_in_process' ||
                strSelectedDecision === 'disapprove') &&
            !strNewNote.trim() &&
            !strSelectedFinding
        )
        {
            setStrSubmitError('Remarks or a standard reason are required for this decision.');
            return;
        }

        const objChosen = DECISION_OPTIONS.find((objItem) => objItem.id === strSelectedDecision);
        const txtRemarks = [strSelectedFinding, strNewNote.trim()].filter(Boolean).join('\n');

        setStrSubmitError(null);
        setBlnIsSubmitting(true);

        try
        {
            if (objProposal && objChosen?.newStatus)
            {
                if (!objProposal.proposalId)
                {
                    throw new Error('This application is not linked to a server proposal.');
                }

                const strSavedStatus = await applyProposalDecision({
                    decision: strSelectedDecision,
                    proposalId: objProposal.proposalId,
                    remarks: txtRemarks,
                });

                updateApplicationStatus(objProposal.id, strSavedStatus);
                onDecisionApplied?.(strSavedStatus, txtRemarks);

                // The decision + previous/new status are persisted and audited
                // server-side — re-fetch so the trail reflects the authoritative record.
                await _loadAuditTrail();
            }
        } catch (errError)
        {
            reportError(errError, 'ProposalCommentsSection: handle add comment failed.');

            reportError(errError, 'Failed to apply proposal decision:');
            const txtServerMessage = (errError as { response?: { data?: { message?: string; }; }; })
                .response?.data?.message;
            setStrSubmitError(
                txtServerMessage || 'The decision could not be saved. Please try again.',
            );
            setBlnIsSubmitting(false);
            return;
        }

        setStrSelectedFinding('');
        setStrNewNote('');

        if (objChosen?.newStatus)
        {
            setStrSubmitNotice(`Decision recorded: Status updated to "${objChosen.newStatus}"`);
            setTimeout(() => setStrSubmitNotice(null), 5000);
        }
        setBlnIsSubmitting(false);
    } /* end _handleAddComment */

    const arrCurrentPresets = PRESETS_BY_DECISION[strSelectedDecision] || [];

    return (
        <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#073b82]">
                            <MessageSquare className="size-4 text-[#0f53b7]" />
                            Review Actions & Assessment Trail ({arrComments.length})
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            Submit formal review decisions and return proposals for revision.
                        </p>
                    </div>
                    {strSubmitNotice && (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            {strSubmitNotice}
                        </span>
                    )}
                    {strSubmitError ? (
                        <span className="text-xs font-bold text-rose-700" role="alert">
                            {strSubmitError}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.95fr)]">
                {/* Comment / Audit Trail List */}
                <div className="divide-y divide-slate-100 border-b border-slate-200 lg:border-b-0 lg:border-r max-h-[560px] overflow-y-auto">
                    {blnIsLoadingComments ? (
                        <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                            <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
                                <Clock3 className="size-6 animate-pulse" />
                            </span>
                            <p className="mt-3 text-sm font-bold text-slate-800">
                                Loading review history…
                            </p>
                        </div>
                    ) : strLoadError ? (
                        <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                            <p className="text-sm font-bold text-rose-700">{strLoadError}</p>
                            <button
                                className="mt-3 text-xs font-bold text-[#0f53b7] underline"
                                onClick={_loadAuditTrail}
                                type="button"
                            >
                                Retry
                            </button>
                        </div>
                    ) : arrComments.length > 0 ? (
                        arrComments.map(
                            (objComment) =>
                            {
                                const objToneClasses = TONE_CLASSES[objComment.tone];
                                const Icon = objComment.actionIcon;

                                return (
                                    <article
                                        className="p-3.5 transition hover:bg-slate-50/50"
                                        key={objComment.id}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'grid size-6 place-items-center rounded-full',
                                                        objToneClasses.iconWrap,
                                                    )}
                                                >
                                                    <UserRound className="size-3" />
                                                </span>
                                                <p className="text-xs font-bold text-slate-900">
                                                    {objComment.author}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {objComment.date}
                                            </span>
                                        </div>

                                        <div className="mt-2 pl-8 space-y-1.5">
                                            <div
                                                className={cn(
                                                    'inline-flex items-center gap-1 text-[10px] font-semibold',
                                                    objToneClasses.badge,
                                                )}
                                            >
                                                <Icon className="size-3" />
                                                <span>{objComment.actionLabel}</span>
                                            </div>

                                            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                                                <span>{objComment.previousStatus ?? ''}</span>
                                                <span aria-hidden="true">→</span>
                                                <span className="text-slate-700">
                                                    {objComment.newStatus ?? ''}
                                                </span>
                                            </div>

                                            {objComment.assignedEvaluatorName ? (
                                                <p className="text-[10px] font-semibold text-slate-500">
                                                    Assigned to:{' '}
                                                    <span className="text-slate-700">
                                                        {objComment.assignedEvaluatorName}
                                                    </span>
                                                </p>
                                            ) : null}

                                            {objComment.finding ? (
                                                <div className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                                    <Tag className="size-2.5 text-slate-500" />
                                                    <span>{objComment.finding}</span>
                                                </div>
                                            ) : null}

                                            {objComment.note ? (
                                                <p className="text-xs leading-5 text-slate-600">
                                                    {objComment.note}
                                                </p>
                                            ) : null}
                                        </div>
                                    </article>
                                ); // end return
                            } /* end ProposalCommentsSection */,
                        )
                    ) : (
                        <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                            <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
                                <Clock3 className="size-6" />
                            </span>
                            <p className="mt-3 text-sm font-bold text-slate-800">
                                No review actions recorded yet
                            </p>
                            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                                This proposal hasn't received any review actions or remarks. Use the
                                action panel on the right to record your review decision.
                            </p>
                        </div>
                    )}
                </div>

                {/* Review Decision & Remarks Form */}
                {arrVisibleDecisionOptions.length > 0 ? (
                    <div className="flex flex-col justify-between p-3.5 bg-slate-50/40">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                    1. Review Action / Decision
                                </label>
                                <div className="space-y-1.5">
                                    {arrVisibleDecisionOptions.map(
                                        (objOption) =>
                                        {
                                            const blnIsSelected =
                                                strSelectedDecision === objOption.id;
                                            const Icon = objOption.icon;

                                            return (
                                                <button
                                                    className={cn(
                                                        'w-full flex items-start gap-2.5 rounded-lg border p-2 text-left transition',
                                                        blnIsSelected
                                                            ? objOption.tone === 'success'
                                                                ? 'border-emerald-500 bg-emerald-50/80 shadow-2xs'
                                                                : objOption.tone === 'warning'
                                                                    ? 'border-amber-500 bg-amber-50/80 shadow-2xs'
                                                                    : 'border-rose-500 bg-rose-50/80 shadow-2xs'
                                                            : 'border-slate-200 bg-white hover:border-slate-300',
                                                    )}
                                                    key={objOption.id}
                                                    onClick={() =>
                                                    {
                                                        setStrSelectedDecision(objOption.id);
                                                        setStrSelectedFinding('');
                                                    }}
                                                    type="button"
                                                >
                                                    <span
                                                        className={cn(
                                                            'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md text-[11px]',
                                                            blnIsSelected
                                                                ? objOption.tone === 'success'
                                                                    ? 'bg-emerald-600 text-white'
                                                                    : objOption.tone === 'warning'
                                                                        ? 'bg-amber-600 text-white'
                                                                        : 'bg-rose-600 text-white'
                                                                : 'bg-slate-100 text-slate-500',
                                                        )}
                                                    >
                                                        <Icon className="size-3" />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p
                                                            className={cn(
                                                                'text-xs font-bold leading-snug',
                                                                blnIsSelected
                                                                    ? 'text-slate-900'
                                                                    : 'text-slate-700',
                                                            )}
                                                        >
                                                            {objOption.label}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                                            {objOption.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            ); // end return
                                        } /* end ProposalCommentsSection */,
                                    )}
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="remark-preset"
                                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                                >
                                    2. Standard Finding / Reason (Optional)
                                </label>
                                <select
                                    id="remark-preset"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-2 focus:ring-blue-100"
                                    value={strSelectedFinding}
                                    onChange={(objEvent) =>
                                        setStrSelectedFinding(objEvent.target.value)
                                    }
                                >
                                    <option value="">
                                        -- Select a standard finding / reason --
                                    </option>
                                    {arrCurrentPresets.map((strPreset) => (
                                        <option key={strPreset} value={strPreset}>
                                            {strPreset}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="comment-text"
                                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                                >
                                    3. Remarks / Decision Instructions
                                </label>
                                <textarea
                                    id="comment-text"
                                    className="min-h-[85px] w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-2 focus:ring-blue-100"
                                    onChange={(objEvent) => setStrNewNote(objEvent.target.value)}
                                    placeholder={
                                        strSelectedDecision === 'return_revision'
                                            ? 'Specify required revisions or missing documents...'
                                            : strSelectedDecision === 'return_in_process'
                                                ? 'Specify technical or financial clarifications needed...'
                                                : strSelectedDecision === 'disapprove'
                                                    ? 'Specify reason for disapproval...'
                                                    : 'Optional justification or notes for applicant...'
                                    }
                                    value={strNewNote}
                                />
                            </div>
                        </div>

                        <button
                            className={cn(
                                'mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-bold text-white transition shadow-xs disabled:opacity-50',
                                strSelectedDecision === 'approve' ||
                                    strSelectedDecision === 'endorse'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : strSelectedDecision === 'disapprove'
                                        ? 'bg-rose-600 hover:bg-rose-700'
                                        : 'bg-amber-600 hover:bg-amber-700',
                            )}
                            disabled={
                                blnIsSubmitting ||
                                ((strSelectedDecision === 'return_revision' ||
                                    strSelectedDecision === 'return_in_process' ||
                                    strSelectedDecision === 'disapprove') &&
                                    !strNewNote.trim() &&
                                    !strSelectedFinding)
                            }
                            onClick={_handleAddComment}
                            type="button"
                        >
                            <Send className="size-3.5" />
                            {blnIsSubmitting
                                ? 'Saving decision...'
                                : strSelectedDecision === 'approve'
                                    ? 'Confirm Approval'
                                    : strSelectedDecision === 'return_in_process'
                                        ? 'Return to In Process'
                                        : strSelectedDecision === 'endorse'
                                            ? 'Endorse for Approval'
                                            : strSelectedDecision === 'return_revision'
                                                ? 'Return to Applicant for Revision'
                                                : strSelectedDecision === 'disapprove'
                                                    ? 'Confirm Disapproval'
                                                    : 'Submit Decision'}
                        </button>
                    </div>
                ) : (
                    <div className="flex min-h-[360px] flex-col items-center justify-center bg-slate-50/40 p-8 text-center">
                        <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
                            <UserRound className="size-5" />
                        </span>
                        <p className="mt-3 text-sm font-bold text-slate-800">
                            Read-only review trail
                        </p>
                        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                            Your role can view the review history but cannot submit an application
                            decision.
                        </p>
                    </div>
                )}
            </div>
        </section>
    ); // end return
} /* end ProposalCommentsSection */
