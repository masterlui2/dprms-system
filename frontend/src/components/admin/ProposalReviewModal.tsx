import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  FileCheck2,
  FileText,
  RotateCcw,
  Send,
  X,
  XCircle,
} from "lucide-react";

import { ROLES } from "../../config/permissions";
import type { ProposalRecord } from "../../data/admin";
import { getMockUser } from "../../lib/mockAuth";
import { updateApplicationStatus } from "../../services/applicationStore";
import { markProposalInProcess } from "../../services/proposalStore";
import type { ApplicationRecord } from "../../types/application";
import { cn } from "../../utils/cn";
import {
  ProposalCommentsSection,
  type DecisionType,
} from "./proposal-review/ProposalCommentsSection";
import { ProposalDocumentsSection } from "./proposal-review/ProposalDocumentsSection";
import { InternalDocumentsSection } from "./proposal-review/InternalDocumentsSection";
import { ProposalOverviewSection } from "./proposal-review/ProposalOverviewSection";
import type { ReviewSection } from "./proposal-review/types";
import { StatusPill } from "./StatusPill";

export type { ReviewSection } from "./proposal-review/types";

interface ProposalReviewModalProps {
  initialSection?: ReviewSection;
  onClose: () => void;
  onStatusChange?: (
    status: ApplicationRecord["status"],
    remarks?: string,
  ) => void;
  proposal: ProposalRecord;
}

type WorkflowStage =
  | "submitted"
  | "in_process"
  | "focal_review"
  | "director_review"
  | "approved"
  | "closed";

  function resolveWorkflowStage(status: ProposalRecord["status"]): WorkflowStage {
  if (status === "Disapproved" || status === "Returned for Revision") {
    return "closed";
  }
  if (status === "Approved") return "approved";
  if (status === "Executive Approval" || status === "Endorsed to Director") {
    return "director_review";
  }
  if (status === "Endorsed to Focal" || status === "Under Screening") {
    return "focal_review";
  }
  if (status === "In Process") return "in_process";
  return "submitted"; // Draft Submitted / Submitted
}
export function ProposalReviewModal({
  initialSection = "overview",
  onClose,
  onStatusChange,
  proposal: initialProposal,
}: ProposalReviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const user = getMockUser();
  const isProjectStaff = user?.role === ROLES.PROJECT_STAFF;
  const isFocal = user?.role === ROLES.FOCAL;
  const isDirector = user?.role === ROLES.PROVINCIAL_DIRECTOR;
  const [proposal, setProposal] = useState<ProposalRecord>(initialProposal);
  const [section, setSection] = useState<ReviewSection>(initialSection);
  const [internalDocumentsReady, setInternalDocumentsReady] = useState(
    initialProposal.program !== "SETUP",
  );
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>(() =>
    resolveWorkflowStage(initialProposal.status)
  );
  const [decisionRequest, setDecisionRequest] = useState<{
    id: number;
    type: DecisionType;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [footerError, setFooterError] = useState<string | null>(null);

  const reviewTabs: Array<[ReviewSection, string]> = [
    ["overview", "Overview"],
    ["documents", "Document Checklist"],
    ...(proposal.program === "SETUP"
      ? ([["internalDocuments", "Internal Documents"]] as Array<
          [ReviewSection, string]
        >)
      : []),
    ["comments", "Review Decision & Remarks"],
  ];
  const reviewStatus = workflowStage === 'closed'
    ? String(proposal.status)
    : workflowStage === 'approved'
    ? 'Approved'
    : workflowStage === 'director_review'
    ? 'Executive Approval'
    : workflowStage === 'in_process'
    ? 'In Process'
    : String(proposal.status || 'Document Validation');

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousActiveElement?.focus();
    };
  }, [onClose]);

  async function handleMarkInProcess() {
    setFooterError(null);
    setIsUpdating(true);

    try {
      if (proposal.proposalId) {
        await markProposalInProcess(proposal.proposalId);
      }

      updateApplicationStatus(proposal.id, 'In Process');
      setProposal((current) => ({ ...current, stage: 2, status: 'In Process' }));
      setWorkflowStage('in_process');
      onStatusChange?.('In Process');
    } catch (error) {
      console.error('Failed to mark proposal as in process:', error);
      setFooterError('The application could not be updated. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  function openDecision(type: DecisionType) {
    setDecisionRequest({ id: Date.now(), type });
    setSection('comments');
  }

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
                  {proposal.id}
                </span>
                <span className="text-slate-300">·</span>
                <StatusPill tone="info">{proposal.program}</StatusPill>
                {reviewStatus && reviewStatus !== "Document Validation" ? (
                  <StatusPill
                    tone={
                      reviewStatus === "Approved"
                        ? "success"
                        : reviewStatus === "Disapproved" || reviewStatus === "Returned for Revision" || reviewStatus === "Rejected"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {reviewStatus}
                  </StatusPill>
                ) : null}
              </div>
              <h2
                className="truncate text-sm sm:text-base font-bold text-[#073b82]"
                id="proposal-review-title"
                title={proposal.title}
              >
                {proposal.title}
              </h2>
              <p className="truncate text-[11px] text-slate-500">
                {proposal.organization} · Submitted {proposal.submitted}
              </p>
            </div>
          </div>
          <button
            aria-label="Close proposal review"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X className="size-4.5" />
          </button>
        </header>

        <nav
          aria-label="Proposal review sections"
          className="relative z-10 flex shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-4 sm:px-6"
        >
          {reviewTabs.map(([value, label]) => {
            return (
              <button
                aria-current={section === value ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition",
                  section === value
                    ? "border-[#0f53b7] text-[#073b82]"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
                key={value}
                onClick={() => setSection(value)}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-4">
          {section === "overview" ? (
            <ProposalOverviewSection
              onReviewFiles={() => setSection("documents")}
              proposal={proposal}
            />
          ) : null}

          {section === "documents" ? (
            proposal.proposalId ? (
              <ProposalDocumentsSection proposalId={proposal.proposalId} />
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
                <FileCheck2 className="size-8 text-slate-400" />
                <p className="mt-3 font-bold text-slate-800">
                  Documents unavailable
                </p>
                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                  This application isn't linked to a backend proposal record,
                  so its submitted documents can't be loaded.
                </p>
              </div>
            )
          ) : null}

          {section === "internalDocuments" && proposal.program === "SETUP" ? (
            <InternalDocumentsSection
              mode={isProjectStaff ? "edit" : "view"}
              onRequiredStatusChange={setInternalDocumentsReady}
              proposalId={proposal.proposalId}
            />
          ) : null}

          {section === "comments" ? (
            <ProposalCommentsSection
              requestedDecision={decisionRequest}
              onDecisionApplied={(newStatus, remarks) => {
                const status = newStatus as ProposalRecord["status"];
                setProposal((prev) => ({
                  ...prev,
                  stage:
                    newStatus === "Approved"
                      ? 4
                      : newStatus === "Executive Approval"
                        ? 3
                        : newStatus === "In Process"
                          ? 2
                          : prev.stage,
                  status,
                }));
                if (newStatus === "Approved") setWorkflowStage("approved");
                else if (newStatus === "Executive Approval") setWorkflowStage("director_review");
                else if (newStatus === "In Process") setWorkflowStage("in_process");
                else if (
                  newStatus === "Disapproved" ||
                  newStatus === "Returned for Revision"
                ) setWorkflowStage("closed");
                onStatusChange?.(
                  newStatus as ApplicationRecord["status"],
                  remarks,
                );
              }}
              proposal={proposal}
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
            {footerError ? (
              <span className="text-xs font-bold text-rose-700" role="alert">
                {footerError}
              </span>
            ) : null}

            {isProjectStaff && workflowStage === 'submitted' ? (
              <button
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0f53b7] px-4 text-xs font-bold text-white transition hover:bg-[#0b3f8b] disabled:cursor-wait disabled:opacity-60"
                disabled={isUpdating}
                onClick={handleMarkInProcess}
                type="button"
              >
                <Send className="size-3.5" />
                {isUpdating ? 'Updating...' : 'Mark as In Process'}
              </button>
            ) : null}

            {isProjectStaff && workflowStage === 'in_process' && proposal.program === 'SETUP' ? (
              <button
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0f53b7] px-4 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
                onClick={() => setSection('internalDocuments')}
                type="button"
              >
                <FileCheck2 className="size-3.5" />
                {internalDocumentsReady ? 'View Internal Documents' : 'Complete Internal Documents'}
              </button>
            ) : null}

            {isProjectStaff && workflowStage === 'in_process' && proposal.program === 'GIA' ? (
              <button
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0f53b7] px-4 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
                onClick={() => setSection('documents')}
                type="button"
              >
                <FileCheck2 className="size-3.5" />
                View Submitted Documents
              </button>
            ) : null}

            {isFocal && workflowStage === 'in_process' ? (
              <>
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-amber-700 transition hover:bg-amber-50"
                  onClick={() => openDecision('return_revision')}
                  type="button"
                >
                  <RotateCcw className="size-3.5" />
                  Return for Revision
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0f53b7] px-4 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
                  onClick={() => openDecision('endorse')}
                  type="button"
                >
                  <Send className="size-3.5" />
                  Recommend Approval
                </button>
              </>
            ) : null}

            {isDirector && workflowStage === 'director_review' ? (
              <>
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                  onClick={() => openDecision('disapprove')}
                  type="button"
                >
                  <XCircle className="size-3.5" />
                  Disapprove
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700"
                  onClick={() => openDecision('approve')}
                  type="button"
                >
                  <CheckCircle2 className="size-3.5" />
                  Approve Application
                </button>
              </>
            ) : null}

            {isFocal && workflowStage === 'submitted' ? (
              <span className="text-xs font-semibold text-slate-500">
                Waiting for Project Staff processing
              </span>
            ) : null}

            {isDirector && workflowStage !== 'director_review' && workflowStage !== 'approved' && workflowStage !== 'closed' ? (
              <span className="text-xs font-semibold text-slate-500">
                Waiting for Focal recommendation
              </span>
            ) : null}

            {workflowStage === 'director_review' && !isDirector ? (
              <span className="text-xs font-bold text-[#0f53b7]">
                Endorsed to the Provincial Director
              </span>
            ) : null}

            {workflowStage === 'approved' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Approved by the Provincial Director
              </span>
            ) : null}

            {workflowStage === 'closed' ? (
              <span className="text-xs font-bold text-slate-600">{proposal.status}</span>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
