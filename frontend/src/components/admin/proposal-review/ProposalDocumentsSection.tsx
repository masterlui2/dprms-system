import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  Loader2,
  XCircle,
} from "lucide-react";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Local verification status state per document
  const [verifiedMap, setVerifiedMap] = useState<Record<number, "approved" | "pending" | "returned_for_revision">>({});

  // Tracks in-flight view/download requests per document id
  const [pendingAction, setPendingAction] = useState<{ id: number; type: "view" | "download" } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProposalDocumentsForStaff(proposalId)
      .then((data) => {
        if (cancelled) return;
        // Filter out auto-generated proposal form since it is part of application data / Overview
        const filteredData = data.filter((doc) => {
          const name = (doc.document_type?.name || doc.file_name || "").toLowerCase();
          return !(
            name.includes("project proposal") ||
            name.includes("proposal form") ||
            name.includes("setup form 1") ||
            name.includes("gia form 1")
          );
        });
        setDocuments(filteredData);
        const initialMap: Record<number, "approved" | "pending" | "returned_for_revision"> = {};
        filteredData.forEach((doc) => {
          initialMap[doc.id] = doc.status;
        });
        setVerifiedMap(initialMap);
        setSelectedDocument((current) => current ?? filteredData[0] ?? null);
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

  // Load inline preview blob whenever the selected document changes
  useEffect(() => {
    if (!selectedDocument) {
      setPreviewUrl(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    viewDocumentBlobForStaff(selectedDocument.id)
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return blobUrl;
        });
      })
      .catch((err) => {
        console.error("Failed to load inline document preview:", err);
        if (!cancelled) {
          setPreviewError("Unable to render document preview inline.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDocument?.id]);

  async function handleView(document: DocumentApiRecord) {
    setActionError(null);
    setPendingAction({ id: document.id, type: "view" });
    try {
      const blobUrl = await viewDocumentBlobForStaff(document.id);
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
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download document:", err);
      setActionError("Could not download this document. It may have been removed from storage.");
    } finally {
      setPendingAction(null);
    }
  }

  function toggleVerification(docId: number, status: "approved" | "returned_for_revision" | "pending") {
    setVerifiedMap((prev) => ({
      ...prev,
      [docId]: prev[docId] === status ? "pending" : status,
    }));
  }

  const verifiedCount = useMemo(() => {
    return documents.filter((d) => verifiedMap[d.id] === "approved").length;
  }, [documents, verifiedMap]);

  const percentComplete = documents.length > 0
    ? Math.round((verifiedCount / documents.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-[340px] items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="size-4 animate-spin text-[#073b82]" />
          Loading checklist & documents…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[340px] items-center justify-center rounded-xl border border-slate-200 bg-white">
        <p className="text-xs font-semibold text-red-600">{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
          <FileCheck2 className="size-6" />
        </span>
        <p className="mt-3 text-sm font-bold text-slate-800">No documents submitted yet</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
          Documents uploaded by the proponent will appear here once submitted.
        </p>
      </div>
    );
  }

  const selectedDocStatus = selectedDocument ? (verifiedMap[selectedDocument.id] ?? "pending") : "pending";

  return (
    <div className="grid h-full min-h-[calc(92vh-160px)] gap-3 lg:grid-cols-[minmax(330px,365px)_minmax(0,1fr)]">
      {/* Document Checklist Column */}
      <section className="flex h-full min-h-[calc(92vh-160px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {/* Checklist Header with Progress Meter */}
        <div className="border-b border-slate-200 bg-slate-50/60 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#073b82]">
                <FileCheck2 className="size-4 text-[#0f53b7]" />
                Document Checklist
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {verifiedCount} of {documents.length} verified ({percentComplete}%)
              </p>
            </div>
            <span
              className={cn(
                "whitespace-nowrap shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                percentComplete === 100
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-50 text-[#0f53b7]",
              )}
            >
              {percentComplete === 100 ? "Complete" : "In Review"}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={cn(
                "h-full transition-all duration-300",
                percentComplete === 100 ? "bg-emerald-600" : "bg-[#0f53b7]",
              )}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Scrollable Checklist Items */}
        <div className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(92vh-240px)] flex-1">
          {documents.map((document, idx) => {
            const currentStatus = verifiedMap[document.id] ?? "pending";
            const isApproved = currentStatus === "approved";
            const isRevision = currentStatus === "returned_for_revision";
            const isSelected = selectedDocument?.id === document.id;
            const requirementTitle = document.document_type?.name || document.file_name;
            const groupName = document.document_type?.group;

            return (
              <div
                className={cn(
                  "group flex items-center justify-between gap-2 px-3 py-2.5 transition hover:bg-blue-50/60",
                  isSelected && "bg-blue-50/90 border-l-4 border-[#073b82]",
                )}
                key={document.id}
              >
                <button
                  className="flex min-w-0 flex-1 items-start gap-2.5 text-left focus-visible:outline-none"
                  onClick={() => setSelectedDocument(document)}
                  type="button"
                >
                  {/* Status Indicator Icon */}
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-[11px]",
                      isApproved
                        ? "bg-emerald-100 text-emerald-700 font-bold"
                        : isRevision
                          ? "bg-rose-100 text-rose-700 font-bold"
                          : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {isApproved ? (
                      <Check className="size-3.5" />
                    ) : isRevision ? (
                      <XCircle className="size-3.5" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">{idx + 1}</span>
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-xs font-bold text-slate-900 transition group-hover:text-[#073b82] leading-snug",
                        isSelected && "text-[#073b82]",
                      )}
                      title={requirementTitle}
                    >
                      {requirementTitle}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                      {groupName ? (
                        <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] font-medium text-slate-600">
                          {groupName}
                        </span>
                      ) : null}
                      <span>{formatFileSize(document.file_size)}</span>
                      <span>·</span>
                      <span
                        className={cn(
                          "font-semibold",
                          isApproved
                            ? "text-emerald-700"
                            : isRevision
                              ? "text-rose-700"
                              : "text-amber-600",
                        )}
                      >
                        {isApproved ? "Verified" : isRevision ? "Action Required" : "Pending"}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Document PDF Preview Viewport Column */}
      <section className="flex h-full min-h-[calc(92vh-160px)] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {selectedDocument ? (
          <>
            {/* Header bar with Document Info & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-bold text-slate-900" title={selectedDocument.file_name}>
                    {selectedDocument.document_type?.name || selectedDocument.file_name}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.2 text-[10px] font-bold",
                      selectedDocStatus === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedDocStatus === "returned_for_revision"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800",
                    )}
                  >
                    {selectedDocStatus === "approved"
                      ? "Verified"
                      : selectedDocStatus === "returned_for_revision"
                        ? "Needs Revision"
                        : "Unverified"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                  {selectedDocument.file_name} · {formatFileSize(selectedDocument.file_size)} · Uploaded {formatUpdated(selectedDocument.created_at)}
                </p>
              </div>

              {/* Action Buttons: Verification & Download */}
              <div className="flex items-center gap-1.5">
                <button
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs transition",
                    selectedDocStatus === "approved"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold"
                      : "border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800",
                  )}
                  onClick={() => toggleVerification(selectedDocument.id, "approved")}
                  type="button"
                >
                  <Check className="size-3.5 text-emerald-600" />
                  <span>{selectedDocStatus === "approved" ? "Verified" : "Mark Verified"}</span>
                </button>

                <button
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-2xs transition",
                    selectedDocStatus === "returned_for_revision"
                      ? "border-rose-500 bg-rose-50 text-rose-800 font-bold"
                      : "border-slate-300 bg-white text-slate-700 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800",
                  )}
                  onClick={() => toggleVerification(selectedDocument.id, "returned_for_revision")}
                  type="button"
                >
                  <XCircle className="size-3.5 text-rose-600" />
                  <span>{selectedDocStatus === "returned_for_revision" ? "Flagged" : "Flag"}</span>
                </button>

                <div className="h-4 w-px bg-slate-200 mx-0.5" />

                <button
                  className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50"
                  disabled={pendingAction?.id === selectedDocument.id}
                  onClick={() => handleDownload(selectedDocument)}
                  title="Download file"
                  type="button"
                >
                  {pendingAction?.id === selectedDocument.id && pendingAction.type === "download" ? (
                    <Loader2 className="size-3.5 animate-spin text-[#073b82]" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                </button>
                <button
                  className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50"
                  disabled={pendingAction?.id === selectedDocument.id}
                  onClick={() => handleView(selectedDocument)}
                  title="Open in new tab"
                  type="button"
                >
                  {pendingAction?.id === selectedDocument.id && pendingAction.type === "view" ? (
                    <Loader2 className="size-3.5 animate-spin text-[#073b82]" />
                  ) : (
                    <ExternalLink className="size-3.5" />
                  )}
                </button>
              </div>
            </div>

            {actionError ? (
              <div className="border-b border-red-100 bg-red-50 px-3.5 py-1.5 text-xs text-red-700 font-medium">
                {actionError}
              </div>
            ) : null}

            {/* Document Preview Viewport */}
            <div className="relative flex h-full min-h-[calc(92vh-220px)] flex-1 flex-col overflow-hidden bg-slate-100">
              {previewLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
                  <Loader2 className="size-6 animate-spin text-[#073b82]" />
                  <p className="text-xs font-medium">Rendering document preview…</p>
                </div>
              ) : previewError ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-8 text-center">
                  <span className="grid size-10 place-items-center rounded-lg bg-red-50 text-red-500">
                    <FileCheck2 className="size-5" />
                  </span>
                  <p className="text-xs font-bold text-slate-800">{previewError}</p>
                  <button
                    className="inline-flex items-center gap-1 rounded-md bg-[#0f53b7] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0b3f8b]"
                    onClick={() => handleView(selectedDocument)}
                    type="button"
                  >
                    <ExternalLink className="size-3" />
                    Open in new tab
                  </button>
                </div>
              ) : previewUrl ? (
                <iframe
                  className="h-full min-h-[calc(92vh-220px)] w-full flex-1 border-0 bg-white"
                  src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  title={selectedDocument.file_name}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
                  <Eye className="size-6" />
                  <p className="mt-1 text-xs">No preview available</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
              <Eye className="size-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-800">
              Select a submitted document
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              Click any requirement on the checklist to preview its contents and verify completeness.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}