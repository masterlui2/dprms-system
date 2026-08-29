import {
  CheckCircle2,
  Clock3,
  MessageSquare,
  RotateCcw,
  Send,
  Tag,
  UserRound,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ROLES } from "../../../config/permissions";
import type { ProposalRecord } from "../../../data/admin";
import { getMockUser } from "../../../lib/mockAuth";
import { updateApplicationStatus } from "../../../services/applicationStore";
import {
  fetchProposalAuditLogs,
  type ProposalAuditRecord,
} from "../../../services/proposalAuditStore";
import {
  applyProposalDecision,
  type ProposalDecision,
} from "../../../services/proposalStore";
import { cn } from "../../../utils/cn";

export type DecisionType = ProposalDecision | "return_in_process";

type Tone = "success" | "warning" | "danger" | "neutral";

interface ReviewComment {
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

function formatAuditDate(raw?: string): string {
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Humanizes an unrecognized backend action string, e.g.
// "ASSIGN_PROJECT_STAFF" -> "Assign Project Staff"
function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Known backend `action` values -> display metadata. Extend this as you
// discover more action strings being logged (e.g. via the controller/enum).
const ACTION_META: Record<string, { icon: typeof CheckCircle2; tone: Tone; label: string }> = {
  SUBMIT: { icon: Send, tone: "neutral", label: "Submitted" },
  UPDATE: { icon: RotateCcw, tone: "neutral", label: "Updated" },
  DELETE: { icon: XCircle, tone: "danger", label: "Deleted" },
  APPROVE: { icon: CheckCircle2, tone: "success", label: "Approved" },
  DISAPPROVE: { icon: XCircle, tone: "danger", label: "Disapproved" },
  ASSIGN_PROJECT_STAFF: { icon: UserPlus, tone: "neutral", label: "Assigned Project Staff" },
};

function getActionMeta(action: string | null) {
  if (!action) {
    return { icon: MessageSquare, tone: "neutral" as Tone, label: "Review Note" };
  }
  const known = ACTION_META[action];
  if (known) return known;
  return { icon: MessageSquare, tone: "neutral" as Tone, label: humanizeAction(action) };
}

function mapAuditRecord(record: ProposalAuditRecord): ReviewComment {
  const meta = getActionMeta(record.action);
  return {
    id: String(record.id),
    author: record.reviewer?.name || "Unknown Reviewer",
    date: formatAuditDate(record.created_at),
    actionLabel: meta.label,
    actionIcon: meta.icon,
    tone: meta.tone,
    finding: record.findings || undefined,
    note: record.remarks || undefined,
    previousStatus: record.previous_status,
    newStatus: record.new_status,
    assignedEvaluatorName: record.assigned_evaluator?.name,
  };
}

const PRESETS_BY_DECISION: Record<DecisionType, string[]> = {
  endorse: [
    "Documentary requirements complete and validated.",
    "Equipment quotation and Line-Item Budget verified.",
    "Technical assessment and TNA completed. Recommended for Provincial Director approval.",
    "Site validation passed with full technical compliance.",
  ],
  return_revision: [
    "Incomplete documentary requirements. Please re-submit valid documents.",
    "Updated equipment quotation / technical specifications required.",
    "Clarification needed on Line-Item Budget / Financial records.",
    "Non-compliant with program qualification criteria.",
  ],
  approve: [
    "Formally approved for project creation and fund scheduling.",
    "Executive evaluation complete. Proceed to project implementation.",
    "Full compliance with DOST regional grant guidelines.",
  ],
  return_in_process: [
    "Returned to In Process for technical clarification and re-assessment.",
    "Financial or equipment adjustments required from Focal Person.",
  ],
  disapprove: [
    "Project scope falls outside current regional priority areas.",
    "Non-compliant with minimum qualification guidelines.",
  ],
};

const decisionOptions: Array<{
  description: string;
  icon: typeof CheckCircle2;
  id: DecisionType;
  label: string;
  newStatus?: string;
  tone: "success" | "warning" | "danger";
}> = [
  {
    description: "Issue the Provincial Director's final approval and activate the project workflow.",
    icon: CheckCircle2,
    id: "approve",
    label: "Approve Application",
    newStatus: "Approved",
    tone: "success",
  },
  {
    description: "Technical or Line-Item Budget adjustments needed. Return dossier back to In Process.",
    icon: RotateCcw,
    id: "return_in_process",
    label: "Return to In Process (Technical Issue)",
    newStatus: "In Process",
    tone: "warning",
  },
  {
    description: "Documents complete and verified. Forward for Provincial Director executive approval.",
    icon: CheckCircle2,
    id: "endorse",
    label: "Endorse for Approval",
    newStatus: "Executive Approval",
    tone: "success",
  },
  {
    description: "Issues or incomplete records found. Return application to proponent for revision.",
    icon: RotateCcw,
    id: "return_revision",
    label: "Return to Applicant for Revision",
    newStatus: "Returned for Revision",
    tone: "warning",
  },
  {
    description: "Proposal does not meet qualifications or requirements. Formally disapprove application.",
    icon: XCircle,
    id: "disapprove",
    label: "Disapprove Application",
    newStatus: "Disapproved",
    tone: "danger",
  },
];

function getAllowedDecisions(role?: string): DecisionType[] {
  if (role === ROLES.FOCAL) {
    return ["endorse", "return_revision"];
  }

  if (role === ROLES.PROVINCIAL_DIRECTOR) {
    return ["approve", "return_in_process", "disapprove"];
  }

  return [];
}

const TONE_CLASSES: Record<Tone, { badge: string; iconWrap: string }> = {
  success: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    iconWrap: "bg-emerald-600 text-white",
  },
  warning: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    iconWrap: "bg-amber-600 text-white",
  },
  danger: {
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    iconWrap: "bg-rose-600 text-white",
  },
  neutral: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    iconWrap: "bg-slate-500 text-white",
  },
};

export function ProposalCommentsSection({
  onDecisionApplied,
  proposal,
  requestedDecision,
}: {
  onDecisionApplied?: (newStatus: string, remarks?: string) => void;
  proposal?: ProposalRecord;
  requestedDecision?: { id: number; type: DecisionType } | null;
}) {
  const currentUser = getMockUser();
  const allowedDecisions = getAllowedDecisions(currentUser?.role);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DecisionType>(
    () => allowedDecisions[0] || "endorse",
  );
  const [selectedFinding, setSelectedFinding] = useState("");
  const [newNote, setNewNote] = useState("");
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleDecisionOptions = decisionOptions.filter((option) =>
    allowedDecisions.includes(option.id),
  );

  const loadAuditTrail = useCallback(async () => {
    if (!proposal?.proposalId) {
      setComments([]);
      return;
    }

    setIsLoadingComments(true);
    setLoadError(null);
    try {
      const records = await fetchProposalAuditLogs(proposal.proposalId);
      setComments(records.map(mapAuditRecord));
    } catch (error) {
      console.error("Failed to load proposal audit trail:", error);
      setLoadError("Could not load the review history. Please try refreshing.");
    } finally {
      setIsLoadingComments(false);
    }
  }, [proposal?.proposalId]);

  useEffect(() => {
    loadAuditTrail();
  }, [loadAuditTrail]);

  useEffect(() => {
    if (
      requestedDecision &&
      getAllowedDecisions(currentUser?.role).includes(requestedDecision.type)
    ) {
      setSelectedDecision(requestedDecision.type);
    }
  }, [currentUser?.role, requestedDecision]);

  async function handleAddComment() {
    if (
      (selectedDecision === "return_revision" ||
        selectedDecision === "return_in_process" ||
        selectedDecision === "disapprove") &&
      !newNote.trim() &&
      !selectedFinding
    ) {
      setSubmitError("Remarks or a standard reason are required for this decision.");
      return;
    }

    const chosen = decisionOptions.find((d) => d.id === selectedDecision);
    const remarks = [selectedFinding, newNote.trim()].filter(Boolean).join("\n");

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (proposal && chosen?.newStatus) {
        if (!proposal.proposalId) {
          throw new Error("This application is not linked to a server proposal.");
        }

        const savedStatus = await applyProposalDecision({
          decision: selectedDecision,
          proposalId: proposal.proposalId,
          remarks,
        });

        updateApplicationStatus(proposal.id, savedStatus);
        onDecisionApplied?.(savedStatus, remarks);

        // The decision + previous/new status are persisted and audited
        // server-side — re-fetch so the trail reflects the authoritative record.
        await loadAuditTrail();
      }
    } catch (error) {
      console.error("Failed to apply proposal decision:", error);
      const serverMessage = (
        error as { response?: { data?: { message?: string } } }
      ).response?.data?.message;
      setSubmitError(
        serverMessage || "The decision could not be saved. Please try again.",
      );
      setIsSubmitting(false);
      return;
    }

    setSelectedFinding("");
    setNewNote("");

    if (chosen?.newStatus) {
      setSubmitNotice(`Decision recorded: Status updated to "${chosen.newStatus}"`);
      setTimeout(() => setSubmitNotice(null), 5000);
    }
    setIsSubmitting(false);
  }

  const currentPresets = PRESETS_BY_DECISION[selectedDecision] || [];

  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#073b82]">
              <MessageSquare className="size-4 text-[#0f53b7]" />
              Review Actions & Assessment Trail ({comments.length})
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Submit formal review decisions and return proposals for revision.
            </p>
          </div>
          {submitNotice && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              {submitNotice}
            </span>
          )}
          {submitError ? (
            <span className="text-xs font-bold text-rose-700" role="alert">
              {submitError}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.95fr)]">
        {/* Comment / Audit Trail List */}
        <div className="divide-y divide-slate-100 border-b border-slate-200 lg:border-b-0 lg:border-r max-h-[560px] overflow-y-auto">
          {isLoadingComments ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
              <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
                <Clock3 className="size-6 animate-pulse" />
              </span>
              <p className="mt-3 text-sm font-bold text-slate-800">Loading review history…</p>
            </div>
          ) : loadError ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
              <p className="text-sm font-bold text-rose-700">{loadError}</p>
              <button
                className="mt-3 text-xs font-bold text-[#0f53b7] underline"
                onClick={loadAuditTrail}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => {
              const toneClasses = TONE_CLASSES[comment.tone];
              const Icon = comment.actionIcon;

              return (
                <article className="p-3.5 transition hover:bg-slate-50/50" key={comment.id}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("grid size-6 place-items-center rounded-full", toneClasses.iconWrap)}>
                        <UserRound className="size-3" />
                      </span>
                      <p className="text-xs font-bold text-slate-900">{comment.author}</p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">{comment.date}</span>
                  </div>

                  <div className="mt-2 pl-8 space-y-1.5">
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border",
                        toneClasses.badge,
                      )}
                    >
                      <Icon className="size-3" />
                      <span>{comment.actionLabel}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                      <span>{comment.previousStatus ?? ""}</span>
                      <span aria-hidden="true">→</span>
                      <span className="text-slate-700">{comment.newStatus ?? ""}</span>
                    </div>

                    {comment.assignedEvaluatorName ? (
                      <p className="text-[10px] font-semibold text-slate-500">
                        Assigned to: <span className="text-slate-700">{comment.assignedEvaluatorName}</span>
                      </p>
                    ) : null}

                    {comment.finding ? (
                      <div className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        <Tag className="size-2.5 text-slate-500" />
                        <span>{comment.finding}</span>
                      </div>
                    ) : null}

                    {comment.note ? (
                      <p className="text-xs leading-5 text-slate-600">{comment.note}</p>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
              <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
                <Clock3 className="size-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-slate-800">No review actions recorded yet</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                This proposal hasn't received any review actions or remarks. Use the action panel on the right to record your review decision.
              </p>
            </div>
          )}
        </div>

        {/* Review Decision & Remarks Form */}
        {visibleDecisionOptions.length > 0 ? (
        <div className="flex flex-col justify-between p-3.5 bg-slate-50/40">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                1. Review Action / Decision
              </label>
              <div className="space-y-1.5">
                {visibleDecisionOptions.map((option) => {
                  const isSelected = selectedDecision === option.id;
                  const Icon = option.icon;

                  return (
                    <button
                      className={cn(
                        "w-full flex items-start gap-2.5 rounded-lg border p-2 text-left transition",
                        isSelected
                          ? option.tone === "success"
                            ? "border-emerald-500 bg-emerald-50/80 shadow-2xs"
                            : option.tone === "warning"
                              ? "border-amber-500 bg-amber-50/80 shadow-2xs"
                              : "border-rose-500 bg-rose-50/80 shadow-2xs"
                          : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                      key={option.id}
                      onClick={() => {
                        setSelectedDecision(option.id);
                        setSelectedFinding("");
                      }}
                      type="button"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md text-[11px]",
                          isSelected
                            ? option.tone === "success"
                              ? "bg-emerald-600 text-white"
                              : option.tone === "warning"
                                ? "bg-amber-600 text-white"
                                : "bg-rose-600 text-white"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        <Icon className="size-3" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-xs font-bold leading-snug",
                            isSelected ? "text-slate-900" : "text-slate-700",
                          )}
                        >
                          {option.label}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="remark-preset" className="block text-[11px] font-semibold text-slate-700 mb-1">
                2. Standard Finding / Reason (Optional)
              </label>
              <select
                id="remark-preset"
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-2 focus:ring-blue-100"
                value={selectedFinding}
                onChange={(e) => setSelectedFinding(e.target.value)}
              >
                <option value="">
                  -- Select a standard finding / reason --
                </option>
                {currentPresets.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="comment-text" className="block text-[11px] font-semibold text-slate-700 mb-1">
                3. Remarks / Decision Instructions
              </label>
              <textarea
                id="comment-text"
                className="min-h-[85px] w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-2 focus:ring-blue-100"
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={
                  selectedDecision === "return_revision"
                    ? "Specify required revisions or missing documents..."
                    : selectedDecision === "return_in_process"
                      ? "Specify technical or financial clarifications needed..."
                      : selectedDecision === "disapprove"
                        ? "Specify reason for disapproval..."
                        : "Optional justification or notes for applicant..."
                }
                value={newNote}
              />
            </div>
          </div>

          <button
            className={cn(
              "mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-bold text-white transition shadow-xs disabled:opacity-50",
              selectedDecision === "approve" || selectedDecision === "endorse"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : selectedDecision === "disapprove"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-amber-600 hover:bg-amber-700",
            )}
            disabled={
              isSubmitting ||
              ((selectedDecision === "return_revision" ||
                selectedDecision === "return_in_process" ||
                selectedDecision === "disapprove") &&
                !newNote.trim() &&
                !selectedFinding)
            }
            onClick={handleAddComment}
            type="button"
          >
            <Send className="size-3.5" />
            {isSubmitting
              ? "Saving decision..."
              : selectedDecision === "approve"
                ? "Confirm Approval"
                : selectedDecision === "return_in_process"
                  ? "Return to In Process"
                  : selectedDecision === "endorse"
                    ? "Endorse for Approval"
                    : selectedDecision === "return_revision"
                      ? "Return to Applicant for Revision"
                      : selectedDecision === "disapprove"
                        ? "Confirm Disapproval"
                        : "Submit Decision"}
          </button>
        </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center bg-slate-50/40 p-8 text-center">
            <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <UserRound className="size-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-800">Read-only review trail</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
              Your role can view the review history but cannot submit an application decision.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}