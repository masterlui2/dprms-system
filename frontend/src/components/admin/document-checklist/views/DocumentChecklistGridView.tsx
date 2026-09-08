import {
  Check,
  Download,
  Eye,
  FileCheck2,
  FileText,
  History,
  Plus,
  Trash2,
  Upload,
  UploadCloud,
  User,
} from 'lucide-react';
import { PdfThumbnail } from '../../../common/PdfThumbnail';
import type {
  DocumentChecklistItem,
  ProposalChecklistRecord,
} from '../../../../services/documentChecklistStore';
import { viewDocumentBlobForStaff } from '../../../../services/documentStore';
import { cn } from '../../../../utils/cn';
import { getItemComplianceState } from '../utils';

interface DocumentChecklistGridViewProps {
  filteredItems: DocumentChecklistItem[];
  blobMap: Record<string, string>;
  canReview: boolean;
  canUpload: boolean;
  activeProposal: ProposalChecklistRecord;
  handleOpenReviewModal: (item: DocumentChecklistItem) => void;
  handlePreviewDocument: (item: DocumentChecklistItem) => void;
  handleOpenUploadModal: (item: DocumentChecklistItem) => void;
  setVersionModalDoc: (item: DocumentChecklistItem) => void;
  handleRemoveFile: (item: DocumentChecklistItem) => void;
  handleToggleItemVerify: (itemId: string) => void;
}

export function DocumentChecklistGridView({
  filteredItems,
  blobMap,
  canReview,
  canUpload,
  activeProposal,
  handleOpenReviewModal,
  handlePreviewDocument,
  handleOpenUploadModal,
  setVersionModalDoc,
  handleRemoveFile,
  handleToggleItemVerify,
}: DocumentChecklistGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
      {filteredItems.map((item, idx) => {
        const hasFile = Boolean(item.uploadedDoc);
        const blobUrl =
          blobMap[item.id] ||
          (item.uploadedDoc?.file_path?.startsWith('blob:') ? item.uploadedDoc.file_path : null);
        const state = getItemComplianceState(item);

        return (
          <div
            key={item.id}
            className={cn(
              'group flex flex-col justify-between rounded-2xl border p-2.5 bg-white transition duration-200 hover:shadow-md',
              state.type === 'RETURNED'
                ? 'border-rose-300/90 bg-rose-50/15 hover:border-rose-400'
                : state.type === 'UNDER_REVIEW'
                ? 'border-blue-200/90 bg-blue-50/10 hover:border-[#0f53b7]/60'
                : hasFile
                ? 'border-slate-200/90 hover:border-[#0f53b7]/60'
                : 'border-dashed border-slate-300 hover:border-[#0f53b7]/60 bg-slate-50/40'
            )}
          >
            <div>
              <div
                onClick={() =>
                  hasFile
                    ? canReview
                      ? handleOpenReviewModal(item)
                      : handlePreviewDocument(item)
                    : canUpload && handleOpenUploadModal(item)
                }
                className={cn(
                  'relative h-36 sm:h-40 w-full overflow-hidden rounded-xl border flex flex-col items-center justify-center cursor-pointer transition select-none',
                  hasFile
                    ? 'bg-slate-50 border-slate-200/80 group-hover:border-[#0f53b7]/40 shadow-2xs'
                    : 'bg-white border-dashed border-slate-300 hover:bg-blue-50/40 hover:border-[#0f53b7]'
                )}
              >
                {hasFile ? (
                  <div className="relative h-full w-full overflow-hidden bg-white p-1 flex items-center justify-center">
                    <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow-2xs border border-slate-200/60">
                      <PdfThumbnail
                        url={blobUrl}
                        documentId={item.uploadedDoc?.id}
                        title={item.uploadedDoc?.file_name || item.name}
                        alt={item.uploadedDoc?.file_name || item.name}
                      />
                    </div>
                    <div className="absolute inset-0 bg-transparent transition group-hover:bg-blue-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="rounded-xl bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white shadow-md flex items-center gap-1">
                        {canReview ? <FileCheck2 className="size-3" /> : <Eye className="size-3" />}
                        <span>{canReview ? 'Review' : 'Preview'}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#0f53b7] transition">
                      <UploadCloud className="size-4.5" />
                    </span>
                    <p className="text-xs font-bold text-slate-700 group-hover:text-[#0f53b7]">
                      Upload PDF
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Click or drag file
                    </p>
                  </div>
                )}

                {state.type !== 'PENDING' && (
                  <div
                    className={cn(
                      'absolute top-2 left-2 z-10 rounded-md px-2 py-0.5 text-[9px] font-bold shadow-xs',
                      state.badgeClass
                    )}
                  >
                    {state.label}
                  </div>
                )}

                {item.uploadedDoc?.archived_versions && item.uploadedDoc.archived_versions.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVersionModalDoc(item);
                    }}
                    className="absolute top-2 right-2 z-10 inline-flex items-center gap-0.5 rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[9px] font-medium font-mono text-slate-500 border border-slate-200/80 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer shadow-2xs"
                    title={`Version ${item.uploadedDoc.archived_versions.length + 1} (${item.uploadedDoc.archived_versions.length} prior versions - click to view history)`}
                  >
                    <History className="size-2.5 text-slate-400" />
                    <span>v{item.uploadedDoc.archived_versions.length + 1}</span>
                  </button>
                )}
              </div>

              <div className="mt-2.5 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <h4
                    className="truncate text-xs font-bold text-slate-950 flex-1"
                    title={`${idx + 1}. ${item.name}`}
                  >
                    {idx + 1}. {item.name}
                  </h4>
                </div>

                {hasFile ? (
                  <p
                    className="truncate text-[11px] text-slate-500 font-medium flex items-center gap-1"
                    title={item.uploadedDoc?.file_name}
                  >
                    <FileText className="size-3 shrink-0 text-slate-400" />
                    <span className="truncate">{item.uploadedDoc?.file_name}</span>
                  </p>
                ) : (
                  <p className="truncate text-[10px] text-slate-400 font-medium" title={item.group}>
                    {item.group}
                  </p>
                )}

                <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold">
                      <User className="size-2.5" />
                    </span>
                    <span className="truncate text-slate-700 font-medium text-[10px]">
                      {activeProposal.proponentName.split(' ')[0] || 'Proponent'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400 shrink-0 text-[10px]">
                      {state.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {hasFile && (
                      <button
                        type="button"
                        onClick={() =>
                          canReview ? handleOpenReviewModal(item) : handlePreviewDocument(item)
                        }
                        className={cn(
                          'inline-flex size-6 items-center justify-center rounded-lg border transition shadow-2xs cursor-pointer',
                          canReview && (state.type === 'UNDER_REVIEW' || state.type === 'RETURNED')
                            ? 'border-[#0f53b7] bg-[#0f53b7] text-white hover:bg-[#0b3f8b]'
                            : 'border-slate-200 text-slate-700 hover:bg-[#E6EEF4]/70 hover:text-[#0f53b7]'
                        )}
                        title={canReview ? 'Review Document' : 'Preview Document'}
                      >
                        {canReview ? <FileCheck2 className="size-3" /> : <Eye className="size-3" />}
                      </button>
                    )}

                    {hasFile ? (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!item.uploadedDoc) return;
                            if (item.uploadedDoc.file_path?.startsWith('blob:')) {
                              const link = document.createElement('a');
                              link.href = item.uploadedDoc.file_path;
                              link.download = item.uploadedDoc.file_name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              const blob = await viewDocumentBlobForStaff(item.uploadedDoc.id);
                              const link = document.createElement('a');
                              link.href = blob;
                              link.download = item.uploadedDoc.file_name;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                          className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          title="Download"
                        >
                          <Download className="size-3" />
                        </button>

                        {canUpload && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenUploadModal(item)}
                              className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition cursor-pointer"
                              title="Replace Document"
                            >
                              <Upload className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(item)}
                              className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                              title="Remove Document"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      canUpload && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleItemVerify(item.id)}
                            title={
                              item.isPresent
                                ? 'Checked (Click to uncheck)'
                                : 'Click to manually verify offline'
                            }
                            className={cn(
                              'flex size-6 items-center justify-center rounded-lg border transition cursor-pointer',
                              item.isPresent
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                : 'border-slate-300 bg-white text-transparent hover:border-slate-400 hover:bg-slate-50'
                            )}
                          >
                            <Check className="size-3.5 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenUploadModal(item)}
                            className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition cursor-pointer"
                            title="Upload PDF scan"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
