import { Archive, Eye, History, RotateCcw, X } from 'lucide-react';
import type { DocumentChecklistItem } from '../../../../services/documentChecklistStore';
import { formatFileSize, formatRelativeDate } from '../utils';

interface DocumentVersionHistoryModalProps {
  versionModalDoc: DocumentChecklistItem | null;
  setVersionModalDoc: (item: DocumentChecklistItem | null) => void;
  handlePreviewDocument: (item: DocumentChecklistItem) => void;
  handleOpenReviewModal: (item: DocumentChecklistItem) => void;
  handleRestoreArchivedVersion: (item: DocumentChecklistItem, archived: any) => void;
}

export function DocumentVersionHistoryModal({
  versionModalDoc,
  setVersionModalDoc,
  handlePreviewDocument,
  handleOpenReviewModal,
  handleRestoreArchivedVersion,
}: DocumentVersionHistoryModalProps) {
  if (!versionModalDoc || !versionModalDoc.uploadedDoc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#B5BFCD]/60 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-[#f7fbff]">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <History className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-950">Document Version History</h3>
              <p className="text-xs text-slate-500">Audit trail of current and superseded submissions</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setVersionModalDoc(null)}
            className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requirement</span>
            <p className="text-sm font-bold text-slate-950 leading-snug">{versionModalDoc.name}</p>
            <p className="text-[11px] text-slate-500">{versionModalDoc.group}</p>
          </div>

          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase shrink-0">
                  Current Version (V{(versionModalDoc.uploadedDoc.archived_versions?.length || 0) + 1})
                </span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  {versionModalDoc.uploadedDoc.file_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const doc = versionModalDoc;
                  setVersionModalDoc(null);
                  handlePreviewDocument(doc);
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shrink-0"
              >
                <Eye className="size-3" />
                <span>Preview</span>
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-emerald-100 font-mono">
              <span>Size: {formatFileSize(versionModalDoc.uploadedDoc.file_size)}</span>
              <span>Uploaded: {formatRelativeDate(versionModalDoc.uploadedDoc.created_at || versionModalDoc.uploadedDoc.updated_at)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                <Archive className="size-3.5" />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Archived Versions & Prior History
              </h4>
            </div>

            {versionModalDoc.uploadedDoc.archived_versions && versionModalDoc.uploadedDoc.archived_versions.length > 0 ? (
              versionModalDoc.uploadedDoc.archived_versions.map((archived, aIdx) => (
                <div
                  key={archived.id || aIdx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 hover:bg-white transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-700 shadow-2xs">
                        <Archive className="size-3.5" />
                      </span>
                      <span className="rounded-md bg-slate-200/80 text-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 font-mono">
                        v{archived.version || aIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate" title={archived.file_name}>
                        {archived.file_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const tempItem = {
                            ...versionModalDoc,
                            uploadedDoc: {
                              ...versionModalDoc.uploadedDoc!,
                              file_name: archived.file_name,
                              file_size: archived.file_size,
                              file_path: archived.file_path,
                            },
                          };
                          setVersionModalDoc(null);
                          handleOpenReviewModal(tempItem);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        title="Preview this archived version"
                      >
                        <Eye className="size-3 text-slate-500" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRestoreArchivedVersion(versionModalDoc, archived)}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#0f53b7] px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                        title="Restore this version as active document"
                      >
                        <RotateCcw className="size-3" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>

                  {archived.remarks && (
                    <div className="rounded-xl bg-white p-2.5 border border-slate-200 text-xs">
                      <p className="font-bold text-slate-700 text-[11px]">Previous Remarks:</p>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{archived.remarks}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/70 font-mono">
                    <span>Size: {formatFileSize(archived.file_size)}</span>
                    <span>Archived: {formatRelativeDate(archived.archived_at || archived.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No previous versions on record.</p>
            )}
          </div>
        </div>

        <div className="border-t border-[#B5BFCD]/40 bg-[#f7fbff] px-6 py-3 text-right">
          <button
            type="button"
            onClick={() => setVersionModalDoc(null)}
            className="rounded-xl border border-[#B5BFCD] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
