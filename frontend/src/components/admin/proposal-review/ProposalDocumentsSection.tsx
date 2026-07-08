import { CheckCircle2, Clock3, Download, Eye, FileCheck2 } from "lucide-react";

import { cn } from "../../../utils/cn";
import type { SampleDocument } from "./types";

interface ProposalDocumentsSectionProps {
  documents: SampleDocument[];
  onSelectDocument: (document: SampleDocument) => void;
  selectedDocument: SampleDocument | null;
}

export function ProposalDocumentsSection({
  documents,
  onSelectDocument,
  selectedDocument,
}: ProposalDocumentsSectionProps) {
  const checklist = documents.map((document, index) => ({
    document,
    note:
      index === documents.length - 1
        ? "For content review during technical assessment."
        : "File received and ready for validation.",
    status: index === documents.length - 1 ? "For review" : "Validated",
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.3fr)]">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="flex items-center gap-2 font-black text-[#073b82]">
            <FileCheck2 className="size-4" />
            Document checklist
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Validate completeness and select a file to inspect its preview.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {checklist.map(({ document, note, status }) => (
            <button
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-blue-50",
                selectedDocument?.name === document.name && "bg-blue-50",
              )}
              key={document.name}
              onClick={() => onSelectDocument(document)}
              type="button"
            >
              <span
                className={cn(
                  "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg",
                  status === "Validated"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700",
                )}
              >
                {status === "Validated" ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Clock3 className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="block truncate text-sm font-bold text-slate-900">
                    {document.title}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-black",
                      status === "Validated"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {status}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {document.name} - {document.size} - {document.pages} pages
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {note}
                </span>
              </span>
              <Eye className="mt-2 size-4 text-slate-400" />
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
                  {selectedDocument.pages} pages - {selectedDocument.size} -
                  Uploaded {selectedDocument.updated}
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
                  Sample document preview - Page 1 of {selectedDocument.pages}
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
              The selected file will appear here for review without leaving the
              proposal workspace.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
