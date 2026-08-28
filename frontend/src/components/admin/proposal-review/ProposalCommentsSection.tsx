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
  type ProposalDecision,
} from "../../../services/proposalStore";
import { cn } from "../../../utils/cn";

export type DecisionType = ProposalDecision | "return_in_process";

interface ReviewComment {
  id: string;
  author: string;
  role: string;
  date: string;
  decision?: DecisionType;
  finding?: string;
  note?: string;
}

function getReviewStorageKey(proposalId?: string) {
  return `dprms.proposal-review-logs.${proposalId || "general"}`;
}

function isActionValidForStage(decision: DecisionType | undefined, stage: number, status: string): boolean {
  if (!decision) return true;
  if (decision === "approve" && stage < 4 && status !== "Approved") return false;
  if (decision === "disapprove" && status !== "Disapproved") return false;
  if (decision === "endorse" && stage < 3 && status !== "Executive Approval" && status !== "Approved") return false;
  return true;
}

function readReviewLogs(proposal?: ProposalRecord): ReviewComment[] {
  if (typeof window === "undefined" || !proposal?.id) return [];
  try {
    const raw = window.localStorage.getItem(getReviewStorageKey(proposal.id));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReviewComment[];
    // Filter out inconsistent/stale test decisions that don't match the current database stage
    return parsed.filter((comment) =>
      isActionValidForStage(comment.decision, proposal.stage, proposal.status),
    );
  } catch {
    return [];
  }
}

function getInitialTimeline(proposal?: ProposalRecord): ReviewComment[] {
  if (!proposal) return [];
  const stored = readReviewLogs(proposal);
  if (stored.length > 0) return stored;

  const initial: ReviewComment[] = [];
  const dateStr = proposal.submitted
    ? new Date(proposal.submitted).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  initial.push({
    id: `sub-${proposal.id}`,
    author: proposal.proponentName || "Applicant",
    role: "Applicant",
    date: dateStr,
    note: `Submitted application for ${proposal.program} project: "${proposal.title}".`,
  });

  if (proposal.stage >= 1) {
    initial.push({
      id: `rev-${proposal.id}`,
      author: proposal.reviewer || "DOST Focal Person",
      role: "DOST Focal Person",
      date: dateStr,
      note: "Initial documentary requirements submitted and opened for desk validation.",
    });
  }

  if (proposal.stage >= 2) {
    initial.push({
      id: `proc-${proposal.id}`,
      author: proposal.reviewer || "DOST Focal Person",
      role: "DOST Focal Person",
      date: dateStr,
      note: "Requirements verified. Advanced to technical assessment, site validation, and TNA.",
    });
  }

  if (proposal.stage >= 3) {
    initial.push({
      id: `end-${proposal.id}`,
      author: proposal.reviewer || "DOST Focal Person",
      role: "DOST Focal Person",
      date: dateStr,
      decision: "endorse",
      note: "Technical evaluation and documentary requirements complete. Endorsed for Provincial Director approval.",
    });
  }

  if (proposal.stage === 4 || proposal.status === "Approved") {
    initial.push({
      id: `app-${proposal.id}`,
      author: "Provincial Director",
      role: "Provincial Director",
      date: dateStr,
      decision: "approve",
      note: proposal.remarks || "Application approved for project implementation and fund release.",
    });
  } else if (proposal.status === "Disapproved") {
    initial.push({
      id: `dis-${proposal.id}`,
      author: "Provincial Director",
      role: "Provincial Director",
      date: dateStr,
      decision: "disapprove",
      note: proposal.remarks || "Application formally disapproved.",
    });
  } else if (proposal.status === "Returned for Revision") {
    initial.push({
      id: `ret-${proposal.id}`,
      author: proposal.reviewer || "DOST Officer",
      role: "DOST Focal Person",
      date: dateStr,
      decision: "return_revision",
      note: proposal.remarks || "Returned to proponent for requirement revisions.",
    });
  }

  return initial;
}

function storeReviewLogs(proposalId: string | undefined, logs: ReviewComment[]) {
  if (typeof window === "undefined" || !proposalId) return;
  window.localStorage.setItem(getReviewStorageKey(proposalId), JSON.stringify(logs));
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
  const [comments, setComments] = useState<ReviewComment[]>(() =>
    getInitialTimeline(proposal),
  );
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

  useEffect(() => {
    setComments(getInitialTimeline(proposal));
  }, [proposal]);

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
    const formattedDate = now.toLocaleDateString("en-US", {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    });

    const comment: ReviewComment = {
      author: currentUser?.name || "Reviewing Officer",
      date: formattedDate,
      decision: selectedDecision,
      finding: selectedFinding || undefined,
      id: String(Date.now()),
      note: newNote.trim() || undefined,
      role: (currentUser?.role && ROLE_LABEL[currentUser.role]) || "Internal Review",
    };

    const next = [comment, ...comments];
    setComments(next);
    storeReviewLogs(proposal?.id, next);

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
          {comments.length > 0 ? (
            comments.map((comment) => {
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
                    {decisionMeta ? (
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

        {/* Review Decision & Remarks Form */}
        {visibleDecisionOptions.length > 0 ? (
        <div className="flex flex-col justify-between p-3.5 bg-slate-50/40">
          <div className="space-y-3">
            {/* Step 1: Decision Action */}
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

            {/* Step 2: Standard Finding Dropdown (Context-Sensitive) */}
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

            {/* Step 3: Remarks Textarea */}
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

