import {
  Check,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "../../../utils/cn";
import {
  type InternalDocument,
  readSetupInternalDocuments,
  setupPostInspectionComplete,
  storeSetupInternalDocuments,
} from "./internalDocuments";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function InternalDocumentsSection({
  mode = "edit",
  onRequiredStatusChange,
  proposalId,
}: {
  mode?: "edit" | "view";
  onRequiredStatusChange?: (complete: boolean) => void;
  proposalId: string;
}) {
  const [documents, setDocuments] = useState<InternalDocument[]>(() =>
    readSetupInternalDocuments(proposalId),
  );
  const [selectedDocument, setSelectedDocument] = useState<InternalDocument | null>(() => {
    const initialDocs = readSetupInternalDocuments(proposalId);
    return initialDocs.find((d) => d.status === "Uploaded") ?? initialDocs[0] ?? null;
  });
  const readOnly = mode === "view";
  const requiredComplete = setupPostInspectionComplete(documents);

  const uploadedCount = useMemo(() => {
    return documents.filter((d) => d.status === "Uploaded").length;
  }, [documents]);

  const percentComplete = documents.length > 0
    ? Math.round((uploadedCount / documents.length) * 100)
    : 0;

  useEffect(() => {
    onRequiredStatusChange?.(requiredComplete);
  }, [onRequiredStatusChange, requiredComplete]);

  function saveFile(id: string, file?: File) {
    if (!file || readOnly) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setDocuments((current) => {
        const next = current.map((document) =>
          document.id === id
            ? {
                ...document,
                dataUrl,
                fileName: file.name,
                fileSize: formatFileSize(file.size),
                fileType: file.type || "application/pdf",
                status: "Uploaded" as const,
                updated: new Date().toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              }
            : document,
        );
        storeSetupInternalDocuments(proposalId, next);
        const updated = next.find((d) => d.id === id);
        if (updated) setSelectedDocument(updated);
        return next;
      });
    };
    reader.readAsDataURL(file);
  }

  function handleDownload(document: InternalDocument) {
    if (!document.dataUrl) return;
    const link = window.document.createElement("a");
    link.href = document.dataUrl;
    link.download = document.fileName || `${document.label}.pdf`;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleOpenNewTab(document: InternalDocument) {
    if (!document.dataUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${document.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  }

  return (
    <div className="grid h-full min-h-[calc(92vh-160px)] gap-3 lg:grid-cols-[minmax(330px,365px)_minmax(0,1fr)]">
      {/* Internal Document Checklist Column */}
      <section className="flex h-full min-h-[calc(92vh-160px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {/* Checklist Header with Progress Meter */}
        <div className="border-b border-slate-200 bg-slate-50/60 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#073b82]">
                <ShieldCheck className="size-4 text-[#0f53b7]" />
                Internal Document Checklist
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {uploadedCount} of {documents.length} attached ({percentComplete}%)
              </p>
            </div>
            <span
              className={cn(
                "whitespace-nowrap shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                requiredComplete
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-50 text-[#0f53b7]",
              )}
            >
              {requiredComplete ? "Endorsement Ready" : "In Progress"}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={cn(
                "h-full transition-all duration-300",
                requiredComplete ? "bg-emerald-600" : "bg-[#0f53b7]",
              )}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Scrollable Checklist Items */}
        <div className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(92vh-240px)] flex-1">
          {documents.map((document, idx) => {
            const isUploaded = document.status === "Uploaded";
            const isSelected = selectedDocument?.id === document.id;
            const isPostInspection = document.stage === "post-inspection";

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
                      isUploaded
                        ? "bg-emerald-100 text-emerald-700 font-bold"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {isUploaded ? (
                      <Check className="size-3.5" />
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
                      title={document.label}
                    >
                      {document.label}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                      <span
                        className={cn(
                          "rounded px-1 py-0.2 text-[10px] font-medium",
                          isPostInspection
                            ? "bg-blue-50 text-[#073b82]"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {isPostInspection ? "Post-Inspection" : "Implementation"}
                      </span>
                      {document.fileName ? (
                        <span>{document.fileSize}</span>
                      ) : null}
                      <span>·</span>
                      <span
                        className={cn(
                          "font-semibold",
                          isUploaded ? "text-emerald-700" : "text-amber-600",
                        )}
                      >
                        {isUploaded ? "Uploaded" : "Pending Upload"}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Upload/Replace icon only on the side checklist */}
                {!readOnly && (
                  <div className="flex shrink-0 items-center">
                    <input
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      className="sr-only"
                      id={`internal-upload-${document.id}`}
                      onChange={(event) =>
                        saveFile(document.id, event.target.files?.[0])
                      }
                      type="file"
                    />
                    <label
                      aria-label={isUploaded ? `Replace ${document.label}` : `Upload ${document.label}`}
                      className={cn(
                        "inline-flex size-6.5 cursor-pointer items-center justify-center rounded transition",
                        isUploaded
                          ? "text-slate-400 hover:bg-slate-200 hover:text-slate-800"
                          : "bg-[#0f53b7] text-white hover:bg-[#0b3f8b]",
                      )}
                      htmlFor={`internal-upload-${document.id}`}
                      onClick={(e) => e.stopPropagation()}
                      title={isUploaded ? "Replace document" : "Upload document"}
                    >
                      <Upload className="size-3" />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Internal Document PDF Preview Viewport */}
      <section className="flex h-full min-h-[calc(92vh-160px)] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {selectedDocument && selectedDocument.status === "Uploaded" ? (
          <>
            {/* Header bar with Document Info & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-bold text-slate-900" title={selectedDocument.label}>
                    {selectedDocument.label}
                  </span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                    Attached
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                  {selectedDocument.fileName} · {selectedDocument.fileSize} · Uploaded {selectedDocument.updated}
                </p>
              </div>

              {/* Action Icons on Top of PDF */}
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-px bg-slate-200 mx-0.5" />
                {selectedDocument.dataUrl && (
                  <>
                    <button
                      className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                      onClick={() => handleDownload(selectedDocument)}
                      title="Download file"
                      type="button"
                    >
                      <Download className="size-3.5" />
                    </button>
                    <button
                      className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                      onClick={() => handleOpenNewTab(selectedDocument)}
                      title="Open in new tab"
                      type="button"
                    >
                      <ExternalLink className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Document Preview Viewport */}
            <div className="relative flex h-full min-h-[calc(92vh-220px)] flex-1 flex-col overflow-hidden bg-slate-100">
              {selectedDocument.dataUrl ? (
                <iframe
                  className="h-full min-h-[calc(92vh-220px)] w-full flex-1 border-0 bg-white"
                  src={`${selectedDocument.dataUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  title={selectedDocument.label}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
                  <FileCheck2 className="size-8 text-emerald-600" />
                  <p className="text-xs font-bold text-slate-800">{selectedDocument.fileName}</p>
                  <p className="text-[11px] text-slate-400">
                    File attached. Re-upload or select another file to inspect live PDF viewer.
                  </p>
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
              {selectedDocument ? selectedDocument.label : "Select an internal requirement"}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              {selectedDocument?.status === "Not uploaded"
                ? "This internal requirement has not been uploaded yet. Click the upload button on the left to attach the file."
                : "Select an attached document from the checklist to preview its contents."}
            </p>
            {!readOnly && selectedDocument && selectedDocument.status === "Not uploaded" && (
              <div className="mt-4">
                <input
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  className="sr-only"
                  id={`empty-upload-${selectedDocument.id}`}
                  onChange={(event) =>
                    saveFile(selectedDocument.id, event.target.files?.[0])
                  }
                  type="file"
                />
                <label
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f53b7] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0b3f8b] cursor-pointer transition"
                  htmlFor={`empty-upload-${selectedDocument.id}`}
                >
                  <Upload className="size-3.5" />
                  Upload {selectedDocument.label}
                </label>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}


