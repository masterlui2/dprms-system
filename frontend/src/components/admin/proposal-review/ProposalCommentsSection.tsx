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

import { ROLE_LABEL } from "../../../config/permissions";
import type { ProposalRecord } from "../../../data/admin";
import { getMockUser } from "../../../lib/mockAuth";
import { updateApplicationStatus } from "../../../services/applicationStore";
import { cn } from "../../../utils/cn";

type DecisionType =
  | "endorse"
  | "return_revision"
  | "disapprove"
  | "note_only";

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

export function ProposalCommentsSection({
  onDecisionApplied,
  proposal,
}: {
  onDecisionApplied?: (newStatus: string) => void;
  proposal?: ProposalRecord;
}) {
  const currentUser = getMockUser();
  const [comments, setComments] = useState<ReviewComment[]>(() =>
    readReviewLogs(proposal?.id),
  );
  const [selectedDecision, setSelectedDecision] = useState<DecisionType>("note_only");
  const [selectedFinding, setSelectedFinding] = useState("");
  const [newNote, setNewNote] = useState("");
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);

  useEffect(() => {
    setComments(readReviewLogs(proposal?.id));
  }, [proposal?.id]);

  function handleAddComment() {
    if (!newNote.trim() && !selectedFinding && selectedDecision === "note_only") return;

    const chosen = decisionOptions.find((d) => d.id === selectedDecision);
    if (proposal && chosen?.newStatus) {
      updateApplicationStatus(proposal.id, chosen.newStatus as any);
      onDecisionApplied?.(chosen.newStatus);
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
    setSelectedDecision("note_only");
    
    if (chosen?.newStatus) {
      setSubmitNotice(`Decision recorded: Status updated to "${chosen.newStatus}"`);
      setTimeout(() => setSubmitNotice(null), 5000);
    }
  }

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
              Submit formal review decisions, return proposals for revision, or log internal notes.
            </p>
          </div>
          {submitNotice && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              {submitNotice}
            </span>
          )}
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

        {/* Review Decision & Remarks Form */}
        <div className="flex flex-col justify-between p-3.5 bg-slate-50/40">
          <div className="space-y-3">
            {/* Step 1: Decision Action */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                1. Review Action / Decision
              </label>
              <div className="space-y-1.5">
                {decisionOptions.map((option) => {
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

            {/* Step 2: Standard Finding Dropdown */}
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

            {/* Step 3: Remarks Textarea */}
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
            disabled={!newNote.trim() && !selectedFinding && selectedDecision === "note_only"}
            onClick={handleAddComment}
            type="button"
          >
            <Send className="size-3.5" />
            {selectedDecision === "endorse"
              ? "Endorse Application"
              : selectedDecision === "return_revision"
                ? "Return to Applicant for Revision"
                : selectedDecision === "disapprove"
                  ? "Confirm Disapproval"
                  : "Post Review Note"}
          </button>
        </div>
      </div>
    </section>
  );
}

