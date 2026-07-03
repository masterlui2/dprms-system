import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  MessageSquare,
  RotateCcw,
  Send,
  X,
  XCircle,
} from "lucide-react";

import { formatCurrency, type ProposalRecord } from "../../data/admin";
import { cn } from "../../utils/cn";
import { StatusPill } from "./StatusPill";

export type ReviewSection = "overview" | "documents" | "comments";

interface SampleDocument {
  name: string;
  pages: number;
  size: string;
  title: string;
  updated: string;
}

const setupDocuments: SampleDocument[] = [
  {
    title: "SETUP Proposal",
    name: "SETUP_Proposal_Bright_Foods.pdf",
    size: "2.4 MB",
    pages: 18,
    updated: "Jun 24, 2026",
  },
  {
    title: "Line-Item Budget",
    name: "Line_Item_Budget.xlsx",
    size: "286 KB",
    pages: 4,
    updated: "Jun 24, 2026",
  },
  {
    title: "DTI / SEC / CDA Registration",
    name: "Business_Registration.pdf",
    size: "840 KB",
    pages: 3,
    updated: "Jun 23, 2026",
  },
  {
    title: "Business Profile",
    name: "Enterprise_Profile.pdf",
    size: "1.1 MB",
    pages: 7,
    updated: "Jun 23, 2026",
  },
  {
    title: "Equipment Quotations",
    name: "Supplier_Quotations.pdf",
    size: "3.2 MB",
    pages: 12,
    updated: "Jun 24, 2026",
  },
];

const giaDocuments: SampleDocument[] = [
  {
    title: "Project Proposal",
    name: "GIA_Project_Proposal.pdf",
    size: "3.1 MB",
    pages: 24,
    updated: "Jun 23, 2026",
  },
  {
    title: "Line-Item Budget",
    name: "GIA_Line_Item_Budget.xlsx",
    size: "310 KB",
    pages: 5,
    updated: "Jun 23, 2026",
  },
  {
    title: "DTI / SEC / CDA Registration",
    name: "Organization_Registration.pdf",
    size: "920 KB",
    pages: 4,
    updated: "Jun 22, 2026",
  },
  {
    title: "Business / Mayor's Permit",
    name: "Current_Mayors_Permit.pdf",
    size: "740 KB",
    pages: 2,
    updated: "Jun 22, 2026",
  },
  {
    title: "Supporting Documents",
    name: "Technical_Supporting_Documents.pdf",
    size: "4.6 MB",
    pages: 16,
    updated: "Jun 23, 2026",
  },
];

export function ProposalReviewModal({
  initialSection = "overview",
  onClose,
  proposal,
}: {
  initialSection?: ReviewSection;
  onClose: () => void;
  proposal: ProposalRecord;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [section, setSection] = useState<ReviewSection>(initialSection);
  const [selectedDocument, setSelectedDocument] =
    useState<SampleDocument | null>(null);
  const documents =
    proposal.program === "SETUP" ? setupDocuments : giaDocuments;

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
                  proposal.status === "Approved"
                    ? "success"
                    : proposal.status === "Rejected"
                      ? "danger"
                      : proposal.status === "Pending"
                        ? "warning"
                        : "info"
                }
              >
                {proposal.status}
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
          {[
            ["overview", "Overview"],
            ["documents", `Documents (${documents.length})`],
            ["comments", "Comments"],
          ].map(([value, label]) => (
            <button
              aria-current={section === value ? "page" : undefined}
              className={cn(
                "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition",
                section === value
                  ? "border-[#0f53b7] text-[#073b82]"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
              key={value}
              onClick={() => setSection(value as ReviewSection)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-5 sm:p-6">
          {section === "overview" ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.7fr)]">
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-black text-[#073b82]">Project summary</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  The proposal seeks DOST support to implement a practical
                  science and technology intervention that improves operational
                  capacity, product quality, and long-term enterprise
                  sustainability.
                </p>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    ["Program", proposal.program],
                    ["Requested Budget", formatCurrency(proposal.amount)],
                    ["Assigned Reviewer", proposal.reviewer],
                    ["Document Completeness", `${proposal.completeness}%`],
                    ["Project Location", "Davao Oriental"],
                    ["Implementation Period", "12 months"],
                  ].map(([label, value]) => (
                    <div className="rounded-lg bg-slate-50 p-3" key={label}>
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm font-bold text-slate-800">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5">
                  <h4 className="text-sm font-black text-slate-900">
                    Project objectives
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                    <li>
                      Improve production efficiency and product consistency.
                    </li>
                    <li>
                      Adopt suitable technology and strengthen staff capability.
                    </li>
                    <li>
                      Increase market readiness and sustainable enterprise
                      growth.
                    </li>
                  </ul>
                </div>
              </section>

              <aside className="space-y-4">
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="font-black text-[#073b82]">
                    Review readiness
                  </h3>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="size-5" />
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">
                        {proposal.completeness}% complete
                      </p>
                      <p className="text-xs text-slate-500">
                        Required fields and files checked
                      </p>
                    </div>
                  </div>
                  <button
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-sm font-bold text-[#073b82] hover:bg-blue-100"
                    onClick={() => setSection("documents")}
                    type="button"
                  >
                    <Eye className="size-4" />
                    Review submitted files
                  </button>
                </section>
              </aside>
            </div>
          ) : null}

          {section === "documents" ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.3fr)]">
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="font-black text-[#073b82]">
                    Submitted documents
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Select a file to inspect its sample preview.
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  {documents.map((document) => (
                    <button
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50",
                        selectedDocument?.name === document.name &&
                          "bg-blue-50",
                      )}
                      key={document.name}
                      onClick={() => setSelectedDocument(document)}
                      type="button"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <Check className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-900">
                          {document.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {document.name} - {document.size}
                        </span>
                      </span>
                      <Eye className="size-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                {selectedDocument ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">
                          {selectedDocument.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {selectedDocument.pages} pages -{" "}
                          {selectedDocument.size} - Uploaded{" "}
                          {selectedDocument.updated}
                        </p>
                      </div>
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-[#073b82] hover:bg-blue-50"
                        type="button"
                      >
                        <Download className="size-3.5" />
                        Download
                      </button>
                    </div>
                    <div className="flex flex-1 items-center justify-center bg-slate-100 p-6">
                      <div className="w-full max-w-md rounded-sm bg-white p-8 shadow-lg">
                        <div className="border-b-2 border-[#073b82] pb-4 text-center">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#073b82]">
                            Department of Science and Technology
                          </p>
                          <p className="mt-2 text-lg font-black text-slate-900">
                            {selectedDocument.title}
                          </p>
                        </div>
                        <div className="mt-6 space-y-3">
                          {[100, 92, 96, 74, 88, 65, 94].map((width, index) => (
                            <div
                              className="h-2 rounded-full bg-slate-200"
                              key={`${width}-${index}`}
                              style={{ width: `${width}%` }}
                            />
                          ))}
                        </div>
                        <div className="mt-8 rounded-lg border border-slate-200 p-4">
                          <div className="h-3 w-28 rounded bg-slate-300" />
                          <div className="mt-3 h-16 rounded bg-slate-100" />
                        </div>
                        <p className="mt-6 text-center text-xs text-slate-400">
                          Sample document preview - Page 1 of{" "}
                          {selectedDocument.pages}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                      <Eye className="size-6" />
                    </span>
                    <p className="mt-4 font-bold text-slate-800">
                      Select a submitted document
                    </p>
                    <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                      The selected file will appear here for review without
                      leaving the proposal workspace.
                    </p>
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {section === "comments" ? (
            <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="flex items-center gap-2 font-black text-[#073b82]">
                <MessageSquare className="size-4" />
                Reviewer comments
              </h3>
              <label className="mt-4 block">
                <span className="text-sm font-bold text-slate-800">
                  Add an internal review note
                </span>
                <textarea
                  className="mt-2 min-h-36 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                  placeholder="Document findings, clarification requests, or decision notes..."
                />
              </label>
              <button
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0f53b7] px-4 text-sm font-bold text-white hover:bg-[#0b3f8b]"
                type="button"
              >
                <Send className="size-4" />
                Save comment
              </button>
            </section>
          ) : null}
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
              Reject
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
