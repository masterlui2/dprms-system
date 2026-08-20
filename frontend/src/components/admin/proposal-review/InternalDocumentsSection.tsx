import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileUp,
  History,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "../../../utils/cn";
import {
  type InternalDocument,
  type InternalDocumentStage,
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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const readOnly = mode === "view";
  const requiredComplete = setupPostInspectionComplete(documents);
  const uploaded = documents.filter((document) => document.status === "Uploaded");

  useEffect(() => {
    onRequiredStatusChange?.(requiredComplete);
  }, [onRequiredStatusChange, requiredComplete]);

  function saveFile(id: string, file?: File) {
    if (!file || readOnly) return;

    setDocuments((current) => {
      const next = current.map((document) =>
        document.id === id
          ? {
              ...document,
              fileName: file.name,
              fileSize: formatFileSize(file.size),
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
      return next;
    });
  }

  function renderGroup(
    title: string,
    description: string,
    stage: InternalDocumentStage,
  ) {
    const groupDocuments = documents.filter(
      (document) => document.stage === stage,
    );

    return (
      <section className="space-y-3" key={stage}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-black text-[#073b82]">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
          {stage === "post-inspection" ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-bold",
                requiredComplete ? "text-emerald-700" : "text-amber-700",
              )}
            >
              {requiredComplete ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <Clock3 className="size-4" />
              )}
              {requiredComplete ? "Complete" : "Required before endorsement"}
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {groupDocuments.map((document) => {
            const Card = readOnly ? "article" : "label";

            return (
              <Card
                className={cn(
                  "group flex min-h-40 flex-col rounded-xl bg-white p-4 transition",
                  readOnly
                    ? "border border-slate-200"
                    : "cursor-pointer border-2 border-dashed",
                  !readOnly && draggingId === document.id
                    ? "border-[#0f53b7] bg-blue-50"
                    : "",
                  !readOnly && document.status === "Uploaded"
                    ? "border-emerald-200 hover:border-emerald-300"
                    : "",
                  !readOnly && document.status === "Not uploaded"
                    ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
                    : "",
                )}
                key={document.id}
                onDragEnter={
                  readOnly ? undefined : () => setDraggingId(document.id)
                }
                onDragLeave={readOnly ? undefined : () => setDraggingId(null)}
                onDragOver={
                  readOnly ? undefined : (event) => event.preventDefault()
                }
                onDrop={
                  readOnly
                    ? undefined
                    : (event) => {
                        event.preventDefault();
                        setDraggingId(null);
                        saveFile(document.id, event.dataTransfer.files[0]);
                      }
                }
              >
                {!readOnly ? (
                  <input
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    className="sr-only"
                    onChange={(event) =>
                      saveFile(document.id, event.target.files?.[0])
                    }
                    type="file"
                  />
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-xl",
                      document.status === "Uploaded"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {document.status === "Uploaded" ? (
                      <FileCheck2 className="size-5" />
                    ) : (
                      <FileUp className="size-5" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-wide",
                      document.status === "Uploaded"
                        ? "text-emerald-700"
                        : "text-slate-500",
                    )}
                  >
                    {document.status}
                  </span>
                </div>

                <p className="mt-4 font-black leading-5 text-slate-900">
                  {document.label}
                </p>
                {document.fileName ? (
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                    {document.fileName}
                    {document.fileSize ? ` · ${document.fileSize}` : ""}
                  </p>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {readOnly
                      ? "No file uploaded by staff yet."
                      : "Drop a file here or select one from your device."}
                  </p>
                )}

                <span
                  className={cn(
                    "mt-auto inline-flex items-center gap-2 pt-4 text-xs font-bold",
                    readOnly ? "text-slate-500" : "text-[#0f53b7]",
                  )}
                >
                  {readOnly ? (
                    document.status === "Uploaded" ? (
                      <>
                        <FileCheck2 className="size-3.5" /> Available for review
                      </>
                    ) : (
                      <>
                        <Clock3 className="size-3.5" /> Awaiting staff upload
                      </>
                    )
                  ) : (
                    <>
                      <Upload className="size-3.5" />
                      {document.status === "Uploaded"
                        ? "Replace document"
                        : "Upload document"}
                    </>
                  )}
                </span>
              </Card>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6">
        <p className="font-black text-[#073b82]">
          SETUP internal document checklist
        </p>
        <p className="mt-1 text-slate-600">
          {readOnly
            ? "Staff-uploaded post-inspection records for director review."
            : "Upload the staff-only records prepared after the site inspection. Files are tracked separately from proponent submissions."}
        </p>
      </section>

      {renderGroup(
        "Post-inspection requirements",
        "Complete these four records before the SETUP application is endorsed.",
        "post-inspection",
      )}

      {renderGroup(
        "Later implementation requirements",
        "Upload these when the application reaches the corresponding implementation stage.",
        "later",
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
          <h3 className="flex items-center gap-2 font-black text-[#073b82]">
            <History className="size-4" />
            {readOnly ? "Staff upload history" : "Upload history"}
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {uploaded.length} of {documents.length} uploaded
          </span>
        </div>
        {uploaded.length ? (
          <div className="divide-y divide-slate-100">
            {uploaded.map((document) => (
              <div
                className="flex items-center justify-between gap-4 px-4 py-3"
                key={document.id}
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{document.label}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {document.fileName}
                    {document.fileSize ? ` · ${document.fileSize}` : ""}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs font-semibold text-slate-400">
                  {document.updated}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No internal documents have been uploaded for this application.
          </p>
        )}
      </section>
    </div>
  );
}
