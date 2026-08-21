import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Download, Eye, FileCheck2, Loader2 } from "lucide-react";

import { cn } from "../../../utils/cn";
import {
  fetchProposalDocumentsForStaff,
  viewDocumentBlobForStaff,
  type DocumentApiRecord,
} from "../../../services/documentStore";

interface ProposalDocumentsSectionProps {
  proposalId: number;
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUpdated(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProposalDocumentsSection({
  proposalId,
}: ProposalDocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentApiRecord | null>(null);
  // Tracks in-flight view/download requests per document id, so a slow
  // network doesn't let someone fire the same fetch twice from double-clicks.
  const [pendingAction, setPendingAction] = useState<{ id: number; type: "view" | "download" } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProposalDocumentsForStaff(proposalId)
      .then((data) => {
        if (cancelled) return;
        setDocuments(data);
        setSelectedDocument((current) => current ?? data[0] ?? null);
      })
      .catch((err) => {
        console.error("Failed to load proposal documents:", err);
        if (!cancelled) setError("Could not load documents for this proposal.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  async function handleView(document: DocumentApiRecord) {
    setActionError(null);
    setPendingAction({ id: document.id, type: "view" });
    try {
      const blobUrl = await viewDocumentBlobForStaff(document.id);
      // Intentionally not revoking immediately — the new tab needs the
      // blob URL to stay valid. The browser reclaims it once that tab is
      // closed or navigated away from.
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error("Failed to open document:", err);
      setActionError("Could not open this document. It may have been removed from storage.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDownload(document: DocumentApiRecord) {
    setActionError(null);
    setPendingAction({ id: document.id, type: "download" });
    try {
      const blobUrl = await viewDocumentBlobForStaff(document.id);
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      // Safe to revoke here — the download has already been handed off to
      // the browser by the time click() returns.
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download document:", err);
      setActionError("Could not download this document. It may have been removed from storage.");
    } finally {
      setPendingAction(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          Loading documents…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <FileCheck2 className="size-6" />
        </span>
        <p className="mt-4 font-bold text-slate-800">No documents submitted yet</p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
          Documents uploaded by the proponent will appear here once submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.3fr)]">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="flex items-center gap-2 font-black text-[#073b82]">
            <FileCheck2 className="size-4" />
            Proponent document checklist
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Validate the completeness of files submitted by the proponent.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.map((document) => {
            const isValidated = document.status !== "pending";
            const isBusy = pendingAction?.id === document.id;

            return (
              <button
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-blue-50",
                  selectedDocument?.id === document.id && "bg-blue-50",
                )}
                key={document.id}
                onClick={() => setSelectedDocument(document)}
                type="button"
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg",
                    isValidated
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                  )}
                >
                  {isValidated ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Clock3 className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {document.file_name}
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-black capitalize",
                        isValidated
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {document.status}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {formatFileSize(document.file_size)} · Uploaded {formatUpdated(document.created_at)}
                  </span>
                </span>
                {isBusy ? (
                  <Loader2 className="mt-2 size-4 shrink-0 animate-spin text-slate-400" />
                ) : (
                  <Eye className="mt-2 size-4 shrink-0 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        {selectedDocument ? (
          <>
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">
                  {selectedDocument.file_name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatFileSize(selectedDocument.file_size)} · Uploaded{" "}
                  {formatUpdated(selectedDocument.created_at)}
                </p>
              </div>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-[#073b82] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pendingAction?.id === selectedDocument.id}
                onClick={() => handleDownload(selectedDocument)}
                type="button"
              >
                {pendingAction?.id === selectedDocument.id && pendingAction.type === "download" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Download
              </button>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0f53b7] px-3 text-xs font-bold text-white hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pendingAction?.id === selectedDocument.id}
                onClick={() => handleView(selectedDocument)}
                type="button"
              >
                {pendingAction?.id === selectedDocument.id && pendingAction.type === "view" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                Open in new tab
              </button>
            </div>

            {actionError ? (
              <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
                {actionError}
              </div>
            ) : null}

            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-100 p-6 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <FileCheck2 className="size-6" />
              </span>
              <p className="text-sm font-bold text-slate-700">
                {selectedDocument.mime_type}
              </p>
              <p className="max-w-sm text-xs leading-6 text-slate-500">
                This file type isn't previewed inline. Use "Open in new tab" to
                view it, or "Download" to save a copy.
              </p>
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
              The selected file's details will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}