import { useEffect, useRef, useState } from "react";
import { Check, FileText, RotateCcw, X, XCircle } from "lucide-react";

import {
  getProposalReviewStatus,
  type ProposalRecord,
} from "../../data/admin";
import { cn } from "../../utils/cn";
import { ProposalCommentsSection } from "./proposal-review/ProposalCommentsSection";
import { ProposalDocumentsSection } from "./proposal-review/ProposalDocumentsSection";
import { ProposalOverviewSection } from "./proposal-review/ProposalOverviewSection";
import { getProposalDocuments } from "./proposal-review/documents";
import type { ReviewSection, SampleDocument } from "./proposal-review/types";
import { StatusPill } from "./StatusPill";

export type { ReviewSection } from "./proposal-review/types";

interface ProposalReviewModalProps {
  initialSection?: ReviewSection;
  onClose: () => void;
  proposal: ProposalRecord;
}

const reviewTabs: Array<[ReviewSection, string]> = [
  ["overview", "Overview"],
  ["documents", "Document Checklist"],
  ["comments", "Comments"],
];

export function ProposalReviewModal({
  initialSection = "overview",
  onClose,
  proposal,
}: ProposalReviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [section, setSection] = useState<ReviewSection>(initialSection);
  const [selectedDocument, setSelectedDocument] =
    useState<SampleDocument | null>(null);
  const documents = getProposalDocuments(proposal.program);
  const reviewStatus = getProposalReviewStatus(proposal);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
    >
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0f53b7]">
                {proposal.id}
              </p>
              <StatusPill tone="info">{proposal.program}</StatusPill>
              <StatusPill
                tone={
                  reviewStatus === "Approved"
                    ? "success"
                    : reviewStatus === "Disapproved"
                      ? "danger"
                      : reviewStatus === "Document Validation"
                        ? "warning"
                        : "info"
                }
              >
                {reviewStatus}
              </StatusPill>
            </div>
            <h2
              className="mt-1 truncate text-xl font-black text-[#073b82]"
              id="proposal-review-title"
            >
              {proposal.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {proposal.organization} - Submitted {proposal.submitted}
            </p>
          </div>
          <button
            aria-label="Close proposal review"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X className="size-5" />
          </button>
        </header>

        <nav
          aria-label="Proposal review sections"
          className="flex overflow-x-auto border-b border-slate-200 px-5 sm:px-6"
        >
          {reviewTabs.map(([value, label]) => {
            const tabLabel =
              value === "documents" ? `${label} (${documents.length})` : label;

            return (
              <button
                aria-current={section === value ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition",
                  section === value
                    ? "border-[#0f53b7] text-[#073b82]"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                )}
                key={value}
                onClick={() => setSection(value)}
                type="button"
              >
                {tabLabel}
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-5 sm:p-6">
          {section === "overview" ? (
            <ProposalOverviewSection
              onReviewFiles={() => setSection("documents")}
              proposal={proposal}
            />
          ) : null}

          {section === "documents" ? (
            <ProposalDocumentsSection
              documents={documents}
              onSelectDocument={setSelectedDocument}
              selectedDocument={selectedDocument}
            />
          ) : null}

          {section === "comments" ? <ProposalCommentsSection /> : null}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Close review
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-red-600 hover:bg-red-50"
              type="button"
            >
              <XCircle className="size-4" />
              Disapprove
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-900 hover:bg-amber-100"
              type="button"
            >
              <RotateCcw className="size-4" />
              Return for revision
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
              type="button"
            >
              <Check className="size-4" />
              Approve and endorse
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
