import React from 'react';
import { FileText, LoaderCircle, UploadCloud, X } from 'lucide-react';
import type { DocumentChecklistItem } from '../../../../services/documentChecklistStore';
import { cn } from '../../../../utils/cn';

interface DocumentUploadModalProps {
  uploadModalItem: DocumentChecklistItem | null;
  isUploading: boolean;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedUploadFile: File | null;
  setSelectedUploadFile: (file: File | null) => void;
  handleCloseUploadModal: () => void;
  handleDropFile: (e: React.DragEvent<HTMLDivElement>) => void;
  validateAndSetFile: (file: File) => void;
  handleConfirmUpload: () => void;
}

export function DocumentUploadModal({
  uploadModalItem,
  isUploading,
  isDragging,
  setIsDragging,
  fileInputRef,
  selectedUploadFile,
  setSelectedUploadFile,
  handleCloseUploadModal,
  handleDropFile,
  validateAndSetFile,
  handleConfirmUpload,
}: DocumentUploadModalProps) {
  if (!uploadModalItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#B5BFCD]/60 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Upload your documents</h3>
          <button
            type="button"
            onClick={handleCloseUploadModal}
            disabled={isUploading}
            className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Target Requirement
            </span>
            <p className="text-sm font-bold text-slate-950">{uploadModalItem.name}</p>
            <p className="text-xs text-slate-400">{uploadModalItem.group}</p>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-blue-50/70 p-3 text-xs text-[#0f53b7] border border-blue-100/80">
            <FileText className="size-4 shrink-0 text-[#0f53b7]" />
            <span className="leading-relaxed">
              Allowed file format: <b>PDF only (.pdf)</b>. Maximum file size: <b>10 MB</b>.
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDropFile}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition',
              isDragging
                ? 'border-[#0f53b7] bg-blue-50/50'
                : 'border-slate-300 bg-slate-50/50 hover:bg-blue-50/30 hover:border-[#0f53b7]'
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  validateAndSetFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <span className="flex size-12 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-inner">
              <UploadCloud className="size-6" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-800">
              Drag here or click to select
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              PDF format only, up to 10 MB in file size
            </p>
          </div>

          {selectedUploadFile && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>1 files uploaded</span>
                <button
                  type="button"
                  onClick={() => setSelectedUploadFile(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px]">
                    PDF
                  </span>
                  <span className="truncate text-xs font-bold text-slate-800" title={selectedUploadFile.name}>
                    {selectedUploadFile.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600 shrink-0">Ready</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <button
            type="button"
            onClick={handleCloseUploadModal}
            disabled={isUploading}
            className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmUpload}
            disabled={!selectedUploadFile || isUploading}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-6 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Upload your files</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
