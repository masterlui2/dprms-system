import {
  AlertCircle,
  Archive,
  Check,
  Eye,
  FileCheck2,
  FileText,
  History,
  Minus,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import type { DocumentChecklistItem } from '../../../../services/documentChecklistStore';
import { cn } from '../../../../utils/cn';
import { formatFileSize, getItemComplianceState } from '../utils';

interface DocumentChecklistListViewProps {
  filteredItems: DocumentChecklistItem[];
  isReadOnly: boolean;
  canReview: boolean;
  canUpload: boolean;
  isAdmin: boolean;
  isFocal: boolean;
  isTemplateEditMode: boolean;
  rowMenuOpenId: string | number | null;
  setRowMenuOpenId: (id: string | number | null) => void;
  handleToggleItemVerify: (itemId: string) => void;
  setVersionModalDoc: (item: DocumentChecklistItem) => void;
  handlePreviewDocument: (item: DocumentChecklistItem) => void;
  handleOpenReviewModal: (item: DocumentChecklistItem) => void;
  handleOpenUploadModal: (item: DocumentChecklistItem) => void;
  handleRemoveFile: (item: DocumentChecklistItem) => void;
  handleOpenEditTemplateModal: (item: DocumentChecklistItem) => void;
  handleDeactivateTemplateItem: (item: DocumentChecklistItem) => void;
  handleDeleteTemplateItem: (item: DocumentChecklistItem) => void;
}

export function DocumentChecklistListView({
  filteredItems,
  isReadOnly,
  canReview,
  canUpload,
  isAdmin,
  isFocal,
  isTemplateEditMode,
  rowMenuOpenId,
  setRowMenuOpenId,
  handleToggleItemVerify,
  setVersionModalDoc,
  handlePreviewDocument,
  handleOpenReviewModal,
  handleOpenUploadModal,
  handleRemoveFile,
  handleOpenEditTemplateModal,
  handleDeactivateTemplateItem,
  handleDeleteTemplateItem,
}: DocumentChecklistListViewProps) {
  return (
    <div className="divide-y divide-[#B5BFCD]/40 overflow-hidden rounded-3xl border border-[#B5BFCD]/70 bg-white shadow-sm">
      {filteredItems.map((item, idx) => {
        const hasFile = Boolean(item.uploadedDoc);
        const state = getItemComplianceState(item);

        return (
          <div
            key={item.id}
            className={cn(
              'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 transition hover:bg-[#f7fbff]',
              state.type === 'RETURNED'
                ? 'bg-rose-50/20'
                : state.type === 'UNDER_REVIEW'
                ? 'bg-blue-50/10'
                : ''
            )}
          >
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="flex items-center gap-3.5 shrink-0">
                <div className="mt-0.5">
                  {state.type === 'RETURNED' ? (
                    <span
                      className="flex size-7 items-center justify-center rounded-xl bg-rose-500 text-white shadow-2xs select-none"
                      title="Returned for revision - Needs re-upload"
                    >
                      <RotateCcw className="size-3.5 stroke-[2.5]" />
                    </span>
                  ) : state.type === 'SATISFIED' ? (
                    <span
                      className="flex size-7 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-2xs select-none"
                      title={hasFile ? 'Complied and Satisfied' : 'Verified Offline'}
                    >
                      <Check className="size-4 stroke-[3.5]" />
                    </span>
                  ) : state.type === 'UNDER_REVIEW' ? (
                    <span
                      className="flex size-7 items-center justify-center rounded-xl bg-[#0f53b7] text-white shadow-2xs select-none"
                      title="Uploaded - Pending Focal review"
                    >
                      <FileText className="size-3.5" />
                    </span>
                  ) : isReadOnly ? (
                    <span
                      className="flex size-7 items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-300 select-none cursor-default"
                      title="Pending compliance"
                    >
                      <Minus className="size-3.5 text-slate-300 stroke-[3]" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleItemVerify(item.id)}
                      title="Click to manually verify requirement offline"
                      className="flex size-7 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:bg-emerald-50/50 transition cursor-pointer"
                    >
                      <Check className="size-4 stroke-[3.5]" />
                    </button>
                  )}
                </div>
                <span className="h-6 w-px bg-slate-200" />
              </div>

              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <span className="mt-0.5 shrink-0 text-xs font-bold text-slate-400 font-mono select-none min-w-[22px]">
                  {String(idx + 1).padStart(2, '0')}.
                </span>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-slate-950 sm:text-sm">{item.name}</p>
                    {state.label && (
                      <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold', state.badgeClass)}>
                        {state.label}
                      </span>
                    )}
                    {item.uploadedDoc?.archived_versions && item.uploadedDoc.archived_versions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setVersionModalDoc(item)}
                        className="inline-flex items-center gap-0.5 rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[9px] font-medium font-mono text-slate-500 border border-slate-200/80 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                        title={`Version ${item.uploadedDoc.archived_versions.length + 1} (${item.uploadedDoc.archived_versions.length} prior versions - click to view history)`}
                      >
                        <History className="size-2.5 text-slate-400" />
                        <span>v{item.uploadedDoc.archived_versions.length + 1}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>{item.group}</span>
                    {hasFile && (
                      <>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handlePreviewDocument(item)}
                          className="font-semibold text-[#0f53b7] hover:underline cursor-pointer text-left truncate max-w-xs inline-flex items-center gap-1"
                          title="Click to preview file"
                        >
                          <FileText className="size-3 shrink-0" />
                          <span className="truncate">{item.uploadedDoc?.file_name}</span>
                          <span className="text-slate-400 font-normal">({formatFileSize(item.uploadedDoc?.file_size)})</span>
                        </button>
                      </>
                    )}
                  </div>

                  {state.type === 'RETURNED' && (
                    <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-200/90 bg-rose-50/80 p-2.5 text-xs text-rose-900">
                      <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-rose-800">Return for Revision Feedback:</p>
                        <p className="mt-0.5 text-slate-700 leading-relaxed">
                          {item.remarks || item.uploadedDoc?.remarks || 'Please revise and re-upload this document.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(isAdmin || isFocal) && isTemplateEditMode ? (
              <div className="relative flex items-center pl-11 sm:pl-0 shrink-0 mt-2 sm:mt-0 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => setRowMenuOpenId(rowMenuOpenId === item.id ? null : item.id)}
                  className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer select-none"
                  title="More options"
                >
                  <MoreVertical className="size-4.5" />
                </button>

                {rowMenuOpenId === item.id && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setRowMenuOpenId(null)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-100 font-sans text-xs font-semibold text-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setRowMenuOpenId(null);
                          handleOpenEditTemplateModal(item);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer select-none"
                      >
                        <Pencil className="size-4 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRowMenuOpenId(null);
                          handleDeactivateTemplateItem(item);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer select-none"
                      >
                        <Archive className="size-4 text-slate-500" />
                        <span>Archive</span>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setRowMenuOpenId(null);
                          handleDeleteTemplateItem(item);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-rose-50 text-rose-600 transition cursor-pointer select-none"
                      >
                        <Trash2 className="size-4 text-rose-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-11 sm:pl-0 shrink-0 mt-2 sm:mt-0">
                {hasFile && (
                  <button
                    type="button"
                    onClick={() => canReview ? handleOpenReviewModal(item) : handlePreviewDocument(item)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer',
                      canReview && (state.type === 'UNDER_REVIEW' || state.type === 'RETURNED')
                        ? 'border-[#0f53b7] bg-[#0f53b7] text-white hover:bg-[#0b3f8b]'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-[#E6EEF4]/60 hover:text-[#0f53b7]'
                    )}
                    title={canReview ? 'Review Document' : 'Preview Document'}
                  >
                    {canReview ? <FileCheck2 className="size-3.5" /> : <Eye className="size-3.5" />}
                    <span>{canReview ? 'Review' : 'Preview'}</span>
                  </button>
                )}

                {canUpload && (
                  hasFile ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenUploadModal(item)}
                        className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition cursor-pointer"
                        title="Replace Document"
                      >
                        <Upload className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(item)}
                        className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenUploadModal(item)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-[#E6EEF4]/60 hover:text-[#0f53b7] transition shadow-2xs cursor-pointer"
                    >
                      <Upload className="size-3.5" />
                      <span>Upload File</span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
