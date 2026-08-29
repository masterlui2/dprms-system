import {
  CheckCircle2,
  Clock3,
  MessageSquare,
  RotateCcw,
  Send,
  Tag,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ROLE_LABEL, ROLES } from "../../../config/permissions";
import type { ProposalRecord } from "../../../data/admin";
import { getMockUser } from "../../../lib/mockAuth";
import { updateApplicationStatus } from "../../../services/applicationStore";
import {
  applyProposalDecision,
  getProposalAudit,
  type ProposalAuditApiRecord,
  type ProposalDecision,
} from "../../../services/proposalStore";
import { cn } from "../../../utils/cn";

export type DecisionType = ProposalDecision | "note_only";

interface ReviewComment {
  id: string;
  author: string;
  role: string;
  date: string;
  decision?: DecisionType;
  finding?: string;
  note?: string;
  sortKey: number;
}

function getReviewStorageKey(proposalId?: string) {
  return `dprms.proposal-review-logs.${proposalId || "general"}`;
}

function readReviewLogs(proposalId?: string): ReviewComment[] {
  if (typeof window === "undefined" || !proposalId) return [];
  try {
    const raw = window.localStorage.getItem(getReviewStorageKey(proposalId));
    return raw ? (JSON.parse(raw) as ReviewComment[]) : [];
  } catch {
    return [];
  }
}

function storeReviewLogs(proposalId: string | undefined, logs: ReviewComment[]) {
  if (typeof window === "undefined" || !proposalId) return;
  window.localStorage.setItem(getReviewStorageKey(proposalId), JSON.stringify(logs));
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function auditEntryToComment(entry: ProposalAuditApiRecord): ReviewComment {
  const createdAt = new Date(entry.created_at);
  return {
    id: `audit-${entry.id}`,
    author: entry.reviewer?.name ?? "System",
    role: entry.action.replace(/_/g, " "),
    date: formatDate(createdAt),
    note: entry.remarks ?? undefined,
    sortKey: createdAt.getTime(),
  };
}

const quickPresets = [
  "Documentary requirements complete and validated.",
  "Equipment quotation verified against lowest compliant bidder.",
  "Site inspection scheduled for validation.",
  "Incomplete documentary requirements. Please re-submit valid documents.",
  "Non-compliant with program qualification criteria.",
  "Endorsed for Provincial Director final approval.",
];

const decisionOptions: Array<{
  description: string;
  icon: typeof CheckCircle2;
  id: DecisionType;
  label: string;
  newStatus?: string;
  tone: "success" | "warning" | "danger" | "neutral";
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
    description: "Proposal does not meet qualifications or requirements. Mark application as disapproved.",
    icon: XCircle,
    id: "disapprove",
    label: "Disapprove Application",
    newStatus: "Disapproved",
    tone: "danger",
  },
  {
    description: "Log internal review observation without changing the current application status.",
    icon: MessageSquare,
    id: "note_only",
    label: "Internal Note Only",
    tone: "neutral",
  },
];

function getAllowedDecisions(role?: string): DecisionType[] {
  if (role === ROLES.FOCAL) {
    return ["endorse", "return_revision", "note_only"];
  }

  if (role === ROLES.PROVINCIAL_DIRECTOR) {
    return ["approve", "disapprove", "note_only"];
  }

  if (role === ROLES.PROJECT_STAFF) {
    return ["note_only"];
  }

  return [];
}

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
  const [localComments, setLocalComments] = useState<ReviewComment[]>(() =>
    readReviewLogs(proposal?.id),
  );
  const [auditEntries, setAuditEntries] = useState<ProposalAuditApiRecord[]>([]);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DecisionType>("note_only");
  const [selectedFinding, setSelectedFinding] = useState("");
  const [newNote, setNewNote] = useState("");
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedDecisions = getAllowedDecisions(currentUser?.role);
  const visibleDecisionOptions = decisionOptions.filter((option) =>
    allowedDecisions.includes(option.id),
  );

  useEffect(() => {
    setLocalComments(readReviewLogs(proposal?.id));
  }, [proposal?.id]);

  useEffect(() => {
    if (!proposal?.proposalId) {
      setAuditEntries([]);
      return;
    }
    let cancelled = false;
    setAuditError(null);
    getProposalAudit(proposal.proposalId)
      .then((entries) => {
        if (!cancelled) setAuditEntries(entries);
      })
      .catch((err) => {
        console.error("Failed to load proposal audit trail:", err);
        if (!cancelled) setAuditError("Could not load the audit trail.");
      });
    return () => {
      cancelled = true;
    };
  }, [proposal?.proposalId]);

  useEffect(() => {
    if (
      requestedDecision &&
      getAllowedDecisions(currentUser?.role).includes(requestedDecision.type)
    ) {
      setSelectedDecision(requestedDecision.type);
    }
  }, [currentUser?.role, requestedDecision]);

  const combinedTrail = [
    ...localComments,
    ...auditEntries.map(auditEntryToComment),
  ].sort((a, b) => b.sortKey - a.sortKey);

  async function handleAddComment() {
    if (!newNote.trim() && !selectedFinding && selectedDecision === "note_only") return;

    const chosen = decisionOptions.find((d) => d.id === selectedDecision);
    const remarks = [selectedFinding, newNote.trim()].filter(Boolean).join("\n");

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (proposal && chosen?.newStatus && selectedDecision !== "note_only") {
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

        const refreshedAudit = await getProposalAudit(proposal.proposalId);
        setAuditEntries(refreshedAudit);
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

    const now = new Date();

    const comment: ReviewComment = {
      author: currentUser?.name || "Reviewing Officer",
      date: formatDate(now),
      decision: selectedDecision,
      finding: selectedFinding || undefined,
      id: String(Date.now()),
      note: newNote.trim() || undefined,
      role: (currentUser?.role && ROLE_LABEL[currentUser.role]) || "Internal Review",
      sortKey: now.getTime(),
    };

    const next = [comment, ...localComments];
    setLocalComments(next);
    storeReviewLogs(proposal?.id, next);

    setSelectedFinding("");
    setNewNote("");
    setSelectedDecision("note_only");

    if (chosen?.newStatus) {
      setSubmitNotice(`Decision recorded: Status updated to "${chosen.newStatus}"`);
      setTimeout(() => setSubmitNotice(null), 5000);
    }
    setIsSubmitting(false);
  }

  return (
    <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#073b82]">
              <MessageSquare className="size-4 text-[#0f53b7]" />
              Review Actions & Assessment Trail ({combinedTrail.length})
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Submit formal review decisions, return proposals for revision, or log internal notes.
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
          {auditError ? (
            <span className="text-xs font-bold text-rose-700" role="alert">
              {auditError}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.95fr)]">
        <div className="divide-y divide-slate-100 border-b border-slate-200 lg:border-b-0 lg:border-r max-h-[560px] overflow-y-auto">
          {combinedTrail.length > 0 ? (
            combinedTrail.map((comment) => {
              const decisionMeta = decisionOptions.find((d) => d.id === comment.decision);

              return (
                <article className="p-3.5 transition hover:bg-slate-50/50" key={comment.id}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-blue-50 text-[#0f53b7]">
                        <UserRound className="size-3" />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{comment.author}</p>
                        <span className="text-[10px] font-medium text-slate-400">{comment.role}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">{comment.date}</span>
                  </div>

                  <div className="mt-2 pl-8 space-y-1.5">
                    {decisionMeta && decisionMeta.id !== "note_only" ? (
                      <div
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border",
                          decisionMeta.tone === "success" && "bg-emerald-50 text-emerald-800 border-emerald-200",
                          decisionMeta.tone === "warning" && "bg-amber-50 text-amber-800 border-amber-200",
                          decisionMeta.tone === "danger" && "bg-rose-50 text-rose-800 border-rose-200",
                        )}
                      >
                        <decisionMeta.icon className="size-3" />
                        <span>{decisionMeta.label}</span>
                      </div>
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
                              : option.tone === "danger"
                                ? "border-rose-500 bg-rose-50/80 shadow-2xs"
                                : "border-slate-400 bg-white shadow-2xs"
                          : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                      key={option.id}
                      onClick={() => setSelectedDecision(option.id)}
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
                                : option.tone === "danger"
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-700 text-white"
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
                {quickPresets.map((preset) => (
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
                placeholder="Specify instructions for applicant, revision details, or internal justification..."
                value={newNote}
              />
            </div>
          </div>

          <button
            className={cn(
              "mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-bold text-white transition shadow-xs disabled:opacity-50",
              selectedDecision === "endorse"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : selectedDecision === "return_revision"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : selectedDecision === "disapprove"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#0f53b7] hover:bg-[#0b3f8b]",
            )}
            disabled={
              isSubmitting ||
              (!newNote.trim() && !selectedFinding && selectedDecision === "note_only") ||
              (selectedDecision === "return_revision" && !newNote.trim() && !selectedFinding) ||
              (selectedDecision === "disapprove" && !newNote.trim() && !selectedFinding)
            }
            onClick={handleAddComment}
            type="button"
          >
            <Send className="size-3.5" />
            {isSubmitting
              ? "Saving decision..."
              : selectedDecision === "approve"
                ? "Confirm Approval"
                : selectedDecision === "endorse"
              ? "Endorse Application"
              : selectedDecision === "return_revision"
                ? "Return to Applicant for Revision"
                : selectedDecision === "disapprove"
                  ? "Confirm Disapproval"
                  : "Post Review Note"}
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