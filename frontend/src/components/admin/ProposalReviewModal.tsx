import { useEffect, useRef, useState } from "react";
import { FileCheck2, FileText, X } from "lucide-react";

import { ROLES } from "../../config/permissions";
import type { ProposalRecord } from "../../data/admin";
import { getMockUser } from "../../lib/mockAuth";
import { cn } from "../../utils/cn";
import { ProposalCommentsSection } from "./proposal-review/ProposalCommentsSection";
import { ProposalDocumentsSection } from "./proposal-review/ProposalDocumentsSection";
import { InternalDocumentsSection } from "./proposal-review/InternalDocumentsSection";
import { areSetupPostInspectionDocumentsComplete } from "./proposal-review/internalDocuments";
import { ProposalOverviewSection } from "./proposal-review/ProposalOverviewSection";
import type { ReviewSection } from "./proposal-review/types";
import { StatusPill } from "./StatusPill";

export type { ReviewSection } from "./proposal-review/types";

interface ProposalReviewModalProps {
  initialSection?: ReviewSection;
  onClose: () => void;
  proposal: ProposalRecord;
}

export function ProposalReviewModal({
  initialSection = "overview",
  onClose,
  proposal: initialProposal,
}: ProposalReviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const user = getMockUser();
  const isDirectorApproval = user?.role === ROLES.PROVINCIAL_DIRECTOR;
  const [proposal, setProposal] = useState<ProposalRecord>(initialProposal);
  const [section, setSection] = useState<ReviewSection>(initialSection);
  const [, setInternalDocumentsReady] = useState(() =>
    initialProposal.program === "SETUP"
      ? areSetupPostInspectionDocumentsComplete(initialProposal.id)
      : true,
  );
  const [workflowStage, setWorkflowStage] = useState<'initial_review' | 'in_process' | 'endorsed' | 'approved'>(() => {
    if (initialProposal.status === 'Approved' || initialProposal.stage === 4) return 'approved';
    if (initialProposal.stage === 3) return 'endorsed';
    if (initialProposal.stage === 2) return 'in_process';
    return 'initial_review';
  });

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
  const reviewStatus = workflowStage === 'approved'
    ? 'Approved'
    : workflowStage === 'endorsed'
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
              mode={isDirectorApproval ? "view" : "edit"}
              onRequiredStatusChange={setInternalDocumentsReady}
              proposalId={proposal.id}
            />
          ) : null}

          {section === "comments" ? (
            <ProposalCommentsSection
              onDecisionApplied={(newStatus) => {
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
                  status: newStatus as any,
                }));
                if (newStatus === "Approved") setWorkflowStage("approved");
                else if (newStatus === "Executive Approval") setWorkflowStage("endorsed");
                else if (newStatus === "In Process") setWorkflowStage("in_process");
              }}
              proposal={proposal}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}