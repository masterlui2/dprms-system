import {
  Check,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchProposalDocumentsForStaff,
  fetchSetupInternalDocumentTypes,
  uploadInternalDocument,
  viewDocumentBlobForStaff,
} from "../../../services/documentStore";
import { cn } from "../../../utils/cn";
import {
  getSetupInternalDocumentTemplate,
  type InternalDocument,
  mergeSetupInternalDocuments,
  setupPostInspectionComplete,
} from "./internalDocuments";

function formatFileSize(bytes?: number) {
  if (bytes == null) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUpdated(value?: string) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InternalDocumentsSection({
  mode = "edit",
  onRequiredStatusChange,
  proposalId,
}: {
  mode?: "edit" | "view";
  onRequiredStatusChange?: (complete: boolean) => void;
  proposalId?: number;
}) {
  const [documents, setDocuments] = useState<InternalDocument[]>(
    getSetupInternalDocumentTemplate,
  );
  const [selectedDocumentId, setSelectedDocumentId] = useState(
    documents[0]?.id ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);

  const readOnly = mode === "view";
  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ?? null;
  const requiredComplete = setupPostInspectionComplete(documents);

  const uploadedCount = useMemo(
    () => documents.filter((document) => document.status === "Uploaded").length,
    [documents],
  );
  const percentComplete = documents.length
    ? Math.round((uploadedCount / documents.length) * 100)
    : 0;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    if (!proposalId) {
      setLoadError("This application is not linked to a server proposal record.");
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    Promise.all([
      fetchSetupInternalDocumentTypes(),
      fetchProposalDocumentsForStaff(proposalId),
    ])
      .then(([documentTypes, uploadedDocuments]) => {
        if (cancelled) return;
        const next = mergeSetupInternalDocuments(documentTypes, uploadedDocuments);
        setDocuments(next);
        setSelectedDocumentId((current) => {
          if (current && next.some((document) => document.id === current)) {
            return current;
          }
          return (
            next.find((document) => document.status === "Uploaded")?.id ??
            next[0]?.id ??
            null
          );
        });
      })
      .catch((error) => {
        console.error("Failed to load internal documents:", error);
        if (!cancelled) {
          setLoadError("Internal documents could not be loaded from the server.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [proposalId, reloadVersion]);

  useEffect(() => {
    onRequiredStatusChange?.(requiredComplete);
  }, [onRequiredStatusChange, requiredComplete]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setPreviewUrl(null);
    setPreviewError(null);

    if (!selectedDocument?.backendId) {
      setPreviewLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setPreviewLoading(true);
    viewDocumentBlobForStaff(selectedDocument.backendId)
      .then((url) => {
        objectUrl = url;
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setPreviewUrl(url);
      })
      .catch((error) => {
        console.error("Failed to load internal document preview:", error);
        if (!cancelled) {
          setPreviewError("The PDF preview could not be loaded from the server.");
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewVersion, selectedDocument?.backendId]);

  async function saveFile(id: string, file?: File) {
    if (!file || readOnly || !proposalId) return;

    const document = documents.find((item) => item.id === id);
    if (!document?.documentTypeId) {
      setUploadError(
        "The server document type is unavailable. Run the document type seeder and try again.",
      );
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Internal documents must be uploaded as PDF files.");
      return;
    }

    setUploadingId(id);
    setUploadError(null);

    try {
      const uploaded = await uploadInternalDocument(
        proposalId,
        document.documentTypeId,
        file,
      );
      setDocuments((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                backendId: uploaded.id,
                fileName: uploaded.file_name,
                fileSize: uploaded.file_size ?? undefined,
                fileType: uploaded.mime_type ?? "application/pdf",
                status: "Uploaded",
                updated: uploaded.updated_at,
              }
            : item,
        ),
      );
      setSelectedDocumentId(id);
      setPreviewVersion((version) => version + 1);
    } catch (error) {
      console.error("Failed to upload internal document:", error);
      setUploadError("The PDF could not be uploaded. Please try again.");
    } finally {
      setUploadingId(null);
    }
  }

  async function handleDownload(document: InternalDocument) {
    if (!document.backendId) return;
    setDownloading(true);
    setPreviewError(null);

    try {
      const url = await viewDocumentBlobForStaff(document.backendId);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.fileName || `${document.label}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      console.error("Failed to download internal document:", error);
      setPreviewError("The PDF could not be downloaded from the server.");
    } finally {
      setDownloading(false);
    }
  }

  function handleFileChange(
    id: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void saveFile(id, file);
  }

  return (
    <div className="grid h-full min-h-[calc(92vh-160px)] gap-3 lg:grid-cols-[minmax(330px,365px)_minmax(0,1fr)]">
      <section className="flex h-full min-h-[calc(92vh-160px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
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
                "shrink-0 whitespace-nowrap text-[10px] font-bold",
                requiredComplete ? "text-emerald-700" : "text-[#0f53b7]",
              )}
            >
              {requiredComplete ? "Endorsement Ready" : "In Progress"}
            </span>
          </div>

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={cn(
                "h-full transition-all duration-300",
                requiredComplete ? "bg-emerald-600" : "bg-[#0f53b7]",
              )}
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          {uploadError ? (
            <p className="mt-2 text-[11px] font-semibold text-rose-700" role="alert">
              {uploadError}
            </p>
          ) : null}
        </div>

        <div className="max-h-[calc(92vh-240px)] flex-1 divide-y divide-slate-100 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-xs font-semibold text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Loading server documents...
            </div>
          ) : loadError ? (
            <div className="p-6 text-center">
              <p className="text-xs font-semibold leading-5 text-rose-700">{loadError}</p>
              {proposalId ? (
                <button
                  className="mt-3 text-xs font-bold text-[#0f53b7] hover:underline"
                  onClick={() => setReloadVersion((version) => version + 1)}
                  type="button"
                >
                  Try again
                </button>
              ) : null}
            </div>
          ) : (
            documents.map((document, index) => {
              const isUploaded = document.status === "Uploaded";
              const isSelected = selectedDocument?.id === document.id;
              const isUploading = uploadingId === document.id;
              const isPostInspection = document.stage === "post-inspection";

              return (
                <div
                  className={cn(
                    "group flex items-center justify-between gap-2 px-3 py-2.5 transition hover:bg-blue-50/60",
                    isSelected && "border-l-4 border-[#073b82] bg-blue-50/90",
                  )}
                  key={document.id}
                >
                  <button
                    className="flex min-w-0 flex-1 items-start gap-2.5 text-left focus-visible:outline-none"
                    onClick={() => setSelectedDocumentId(document.id)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-[11px]",
                        isUploaded
                          ? "bg-emerald-100 font-bold text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {isUploading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : isUploaded ? (
                        <Check className="size-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500">
                          {index + 1}
                        </span>
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-bold leading-snug text-slate-900 transition group-hover:text-[#073b82]",
                          isSelected && "text-[#073b82]",
                        )}
                        title={document.label}
                      >
                        {document.label}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                        <span>{isPostInspection ? "Post-Inspection" : "Implementation"}</span>
                        {document.fileName ? (
                          <>
                            <span>·</span>
                            <span>{formatFileSize(document.fileSize)}</span>
                          </>
                        ) : null}
                        <span>·</span>
                        <span
                          className={cn(
                            "font-semibold",
                            isUploaded ? "text-emerald-700" : "text-amber-600",
                          )}
                        >
                          {isUploading
                            ? "Uploading"
                            : isUploaded
                              ? "Uploaded"
                              : "Pending Upload"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {!readOnly ? (
                    <div className="flex shrink-0 items-center">
                      <input
                        accept="application/pdf,.pdf"
                        className="sr-only"
                        disabled={Boolean(uploadingId)}
                        id={`internal-upload-${document.id}`}
                        onChange={(event) => handleFileChange(document.id, event)}
                        type="file"
                      />
                      <label
                        aria-label={
                          isUploaded
                            ? `Replace ${document.label}`
                            : `Upload ${document.label}`
                        }
                        className={cn(
                          "inline-flex size-6.5 items-center justify-center rounded transition",
                          uploadingId
                            ? "cursor-wait text-slate-300"
                            : isUploaded
                              ? "cursor-pointer text-slate-400 hover:bg-slate-200 hover:text-slate-800"
                              : "cursor-pointer bg-[#0f53b7] text-white hover:bg-[#0b3f8b]",
                        )}
                        htmlFor={`internal-upload-${document.id}`}
                        onClick={(event) => event.stopPropagation()}
                        title={isUploaded ? "Replace PDF" : "Upload PDF"}
                      >
                        {isUploading ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Upload className="size-3" />
                        )}
                      </label>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="flex h-full min-h-[calc(92vh-160px)] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {selectedDocument?.status === "Uploaded" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3.5 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="truncate text-xs font-bold text-slate-900"
                    title={selectedDocument.label}
                  >
                    {selectedDocument.label}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">Attached</span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                  {selectedDocument.fileName} · {formatFileSize(selectedDocument.fileSize)} · Uploaded {formatUpdated(selectedDocument.updated)}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  className="inline-flex size-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                  disabled={downloading || !selectedDocument.backendId}
                  onClick={() => void handleDownload(selectedDocument)}
                  title="Download PDF"
                  type="button"
                >
                  {downloading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                </button>
                <button
                  className="inline-flex size-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                  disabled={!previewUrl}
                  onClick={() => previewUrl && window.open(`${previewUrl}#view=FitH`, "_blank")}
                  title="Open PDF in new tab"
                  type="button"
                >
                  <ExternalLink className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="relative flex h-full min-h-[calc(92vh-220px)] flex-1 flex-col overflow-hidden bg-slate-100">
              {previewLoading ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Loading PDF from server...
                </div>
              ) : previewUrl ? (
                <iframe
                  className="h-full min-h-[calc(92vh-220px)] w-full flex-1 border-0 bg-white"
                  src={`${previewUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=1`}
                  title={selectedDocument.label}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
                  <FileCheck2 className="size-8 text-emerald-600" />
                  <p className="text-xs font-bold text-slate-800">
                    {selectedDocument.fileName}
                  </p>
                  <p className="text-[11px] text-rose-600">
                    {previewError || "The server PDF preview is unavailable."}
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
              {selectedDocument?.label || "Select an internal requirement"}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              {loadError
                ? "Connect this application to its server proposal before uploading internal records."
                : "This internal requirement has not been uploaded yet."}
            </p>
            {!readOnly && selectedDocument && !loadError ? (
              <div className="mt-4">
                <input
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  disabled={Boolean(uploadingId)}
                  id={`empty-upload-${selectedDocument.id}`}
                  onChange={(event) => handleFileChange(selectedDocument.id, event)}
                  type="file"
                />
                <label
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0f53b7] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b]"
                  htmlFor={`empty-upload-${selectedDocument.id}`}
                >
                  {uploadingId === selectedDocument.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  Upload PDF
                </label>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
