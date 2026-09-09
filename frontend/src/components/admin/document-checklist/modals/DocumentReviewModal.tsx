import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  History,
  LoaderCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  User,
  X,
} from 'lucide-react';
import { ROLE_LABEL, type UserRole } from '../../../../config/permissions';
import type {
  ChecklistHistoryItem,
  DocumentChecklistItem,
  ProposalChecklistRecord,
} from '../../../../services/documentChecklistStore';
import { cn } from '../../../../utils/cn';
import type { DocumentReviewStatus } from '../types';
import { formatFileSize, formatRelativeDate, getItemComplianceState } from '../utils';

interface DocumentReviewModalProps {
  reviewModalItem: DocumentChecklistItem | null;
  isFullscreen: boolean;
  setIsFullscreen: (val: boolean) => void;
  blobMap: Record<string, string>;
  isLoadingPreviewBlob: boolean;
  handleOpenReviewModal: (item: DocumentChecklistItem) => void;
  handleCloseReviewModal: () => void;
  isSubmittingReview: boolean;
  setVersionModalDoc: (item: DocumentChecklistItem) => void;
  historyList: ChecklistHistoryItem[];
  activeProposal: ProposalChecklistRecord | null;
  reviewDecision: DocumentReviewStatus;
  setReviewDecision: (decision: DocumentReviewStatus) => void;
  reviewRemarks: string;
  setReviewRemarks: (remarks: string) => void;
  handleConfirmReview: () => void;
}

export function DocumentReviewModal({
  reviewModalItem,
  isFullscreen,
  setIsFullscreen,
  blobMap,
  isLoadingPreviewBlob,
  handleOpenReviewModal,
  handleCloseReviewModal,
  isSubmittingReview,
  setVersionModalDoc,
  historyList,
  activeProposal,
  reviewDecision,
  setReviewDecision,
  reviewRemarks,
  setReviewRemarks,
  handleConfirmReview,
}: DocumentReviewModalProps) {
  if (!reviewModalItem) return null;

  const itemState = getItemComplianceState(reviewModalItem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#B5BFCD]/60 transition-all duration-200',
          isFullscreen
            ? 'fixed inset-2 z-50 rounded-2xl h-[calc(100vh-16px)] max-h-none w-[calc(100vw-16px)] max-w-none'
            : 'h-[90vh] w-full max-w-6xl'
        )}
      >
        <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 bg-[#f7fbff] px-5 py-3.5 sm:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497] shadow-xs">
              <FileCheck2 className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-bold text-slate-950 sm:text-base" title={reviewModalItem.name}>
                  {reviewModalItem.name}
                </h3>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    itemState.badgeClass
                  )}
                >
                  {itemState.label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {reviewModalItem.uploadedDoc?.file_name || 'Document File'}
                {reviewModalItem.uploadedDoc?.file_size ? ` • ${formatFileSize(reviewModalItem.uploadedDoc.file_size)}` : ''}
                {reviewModalItem.uploadedDoc?.created_at ? ` • Uploaded ${formatRelativeDate(reviewModalItem.uploadedDoc.created_at)}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {reviewModalItem.uploadedDoc && blobMap[reviewModalItem.id] && (
              <a
                href={blobMap[reviewModalItem.id]}
                download={reviewModalItem.uploadedDoc.file_name}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-2xs"
                title="Download file"
              >
                <Download className="size-4" />
              </a>
            )}

            {reviewModalItem.uploadedDoc && blobMap[reviewModalItem.id] && (
              <a
                href={blobMap[reviewModalItem.id]}
                target="_blank"
                rel="noreferrer"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-2xs"
                title="Open in new tab"
              >
                <ExternalLink className="size-4" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:inline-flex size-9 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-2xs cursor-pointer"
              title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>

            <button
              type="button"
              onClick={handleCloseReviewModal}
              disabled={isSubmittingReview}
              className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              title="Close modal"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col lg:flex-row overflow-hidden bg-slate-100 min-h-0">
          <div className="relative flex flex-1 items-center justify-center p-2 sm:p-4 bg-slate-100 overflow-hidden min-h-0">
            {reviewModalItem.uploadedDoc ? (
              isLoadingPreviewBlob ? (
                <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                  <LoaderCircle className="size-8 animate-spin text-[#0f53b7]" />
                  <p className="text-xs font-semibold">Loading document preview...</p>
                </div>
              ) : blobMap[reviewModalItem.id] ? (
                <div className="relative h-full w-full max-w-4xl bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
                  <iframe
                    src={`${blobMap[reviewModalItem.id]}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                    title={reviewModalItem.uploadedDoc.file_name}
                    className="h-full w-full flex-1 border-0 bg-white"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <FileText className="size-12 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">{reviewModalItem.uploadedDoc.file_name}</p>
                  <p className="text-xs text-slate-400 font-mono">({formatFileSize(reviewModalItem.uploadedDoc.file_size)})</p>
                  <button
                    type="button"
                    onClick={() => handleOpenReviewModal(reviewModalItem)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer"
                  >
                    <Eye className="size-3.5" />
                    <span>Load Preview</span>
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <FileText className="size-12 text-slate-400" />
                <p className="text-sm font-bold text-slate-700">No document file attached</p>
                <p className="text-xs text-slate-500">Proponent has not uploaded a file for this requirement.</p>
              </div>
            )}
          </div>

          <div className="w-full lg:w-80 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-[#B5BFCD]/50 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                  {reviewModalItem.group}
                </span>

                {reviewModalItem.uploadedDoc?.archived_versions && reviewModalItem.uploadedDoc.archived_versions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setVersionModalDoc(reviewModalItem)}
                    className="inline-flex items-center gap-0.5 rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[9px] font-medium font-mono text-slate-500 border border-slate-200/80 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                    title={`Version ${reviewModalItem.uploadedDoc.archived_versions.length + 1} (${reviewModalItem.uploadedDoc.archived_versions.length} prior versions - click to view history)`}
                  >
                    <History className="size-2.5 text-slate-400" />
                    <span>v{reviewModalItem.uploadedDoc.archived_versions.length + 1}</span>
                  </button>
                )}
              </div>

              {reviewModalItem.uploadedDoc && (() => {
                const uploadLog = historyList.find(
                  (h) => (h.action === 'UPLOAD' || h.action === 'REPLACE') && h.itemName === reviewModalItem.name
                );
                const uploaderName =
                  uploadLog?.userName ||
                  activeProposal?.proponentName ||
                  'Proponent / Staff';
                const uploaderRole = uploadLog?.userRole
                  ? ROLE_LABEL[uploadLog.userRole as UserRole] || uploadLog.userRole
                  : 'Proponent';
                const uploadDate = uploadLog?.timestamp || reviewModalItem.uploadedDoc.created_at;

                return (
                  <div className="rounded-2xl border border-blue-100 bg-[#f7fbff] p-3 space-y-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 items-center justify-center rounded-xl bg-blue-100 text-[#0f53b7] shrink-0">
                        <User className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {uploaderName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{uploaderRole}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-blue-50 text-[10px] text-slate-500 font-mono">
                      <span className="truncate text-slate-600 font-medium">
                        {formatFileSize(reviewModalItem.uploadedDoc.file_size)}
                      </span>
                      <span className="shrink-0 text-slate-400">
                        {uploadDate ? formatRelativeDate(uploadDate) : 'Recently'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  Compliance Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('APPROVED')}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-bold transition cursor-pointer text-center',
                      reviewDecision === 'APPROVED'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <CheckCircle2 className={cn('size-4', reviewDecision === 'APPROVED' ? 'text-emerald-600' : 'text-slate-400')} />
                    <span>Verified</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision('RETURNED')}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-xs font-bold transition cursor-pointer text-center',
                      reviewDecision === 'RETURNED'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <RotateCcw className={cn('size-4', reviewDecision === 'RETURNED' ? 'text-rose-600' : 'text-slate-400')} />
                    <span>Revision</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Remarks & Findings
                    {reviewDecision === 'RETURNED' ? (
                      <span className="ml-1 text-rose-600 font-bold">*</span>
                    ) : (
                      <span className="ml-1 text-slate-400 font-normal text-[11px]">(Optional)</span>
                    )}
                  </label>
                  <span className="text-[11px] text-slate-400">{reviewRemarks.length}/500</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder={
                    reviewDecision === 'RETURNED'
                      ? 'Specify required revisions or corrections...'
                      : 'Enter compliance notes...'
                  }
                  className={cn(
                    'w-full rounded-2xl border p-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-3',
                    reviewDecision === 'RETURNED' && !reviewRemarks.trim()
                      ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-100'
                      : 'border-[#B5BFCD] bg-slate-50/50 focus:border-[#0f53b7] focus:bg-white focus:ring-blue-100'
                  )}
                />
                {reviewDecision === 'RETURNED' && !reviewRemarks.trim() && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>Rejection remarks required.</span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={isSubmittingReview || (reviewDecision === 'RETURNED' && !reviewRemarks.trim())}
                className={cn(
                  'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50 cursor-pointer',
                  reviewDecision === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : reviewDecision === 'UNDER_REVIEW'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : reviewDecision === 'RETURNED'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-700 hover:bg-slate-800'
                )}
              >
                {isSubmittingReview ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Decision</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleCloseReviewModal}
                disabled={isSubmittingReview}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#B5BFCD]/50 bg-[#f7fbff] px-5 py-3 sm:px-6 shrink-0">
          <div className="text-xs text-slate-500 truncate min-w-0 mr-4">
            {reviewModalItem.uploadedDoc?.file_name && (
              <span className="truncate">
                File: <strong className="font-semibold text-slate-800">{reviewModalItem.uploadedDoc.file_name}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCloseReviewModal}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-200 px-5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition shrink-0 cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
