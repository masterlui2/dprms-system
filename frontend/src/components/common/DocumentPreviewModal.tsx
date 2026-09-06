import { useEffect, useState } from 'react'
import {
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react'
import { cn } from '../../utils/cn'

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  fileName?: string
  fileSize?: number | null
  uploadedAt?: string | null
  status?: string
  blobUrl?: string | null
  isLoading?: boolean
  error?: string | null
  onDownload?: () => void
  onOpenNewTab?: () => void
}

function formatFileSize(bytes?: number | null): string {
  if (bytes == null || bytes <= 0) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatUploadedDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recently'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  title,
  fileName,
  fileSize,
  uploadedAt,
  status,
  blobUrl,
  isLoading = false,
  error = null,
  onDownload,
  onOpenNewTab,
}: DocumentPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isPdf = fileName ? fileName.toLowerCase().endsWith('.pdf') : true
  const isImage = fileName
    ? /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName)
    : false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#B5BFCD]/60 transition-all duration-200',
          isFullscreen
            ? 'fixed inset-2 z-50 rounded-2xl h-[calc(100vh-16px)] max-h-none w-[calc(100vw-16px)] max-w-none'
            : 'h-[90vh] w-full max-w-5xl'
        )}
      >
        <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 bg-[#f7fbff] px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497] shadow-xs">
              <FileCheck2 className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-bold text-slate-950 sm:text-base" title={title}>
                  {title}
                </h3>
                {status && (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      status.toLowerCase() === 'complied' || status.toLowerCase() === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        : status.toLowerCase() === 'needs revision' || status.toLowerCase() === 'returned_for_revision'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                          : 'bg-blue-50 text-[#0f53b7] border border-blue-200/80'
                    )}
                  >
                    {status}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {fileName || 'Document File'} • {formatFileSize(fileSize)} • Uploaded {formatUploadedDate(uploadedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-2xs"
                title="Download file"
              >
                <Download className="size-4" />
              </button>
            )}

            {onOpenNewTab && (
              <button
                type="button"
                onClick={onOpenNewTab}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-2xs"
                title="Open in new tab"
              >
                <ExternalLink className="size-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:inline-flex size-9 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-2xs"
              title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Close modal"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-100">
          {isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
              <Loader2 className="size-8 animate-spin text-[#0f53b7]" />
              <p className="text-xs font-semibold">Loading document content...</p>
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                <FileText className="size-6" />
              </span>
              <p className="text-sm font-bold text-slate-900">{error}</p>
              <p className="max-w-md text-xs text-slate-500">
                The document preview could not be rendered directly. You can try opening it in a new window or downloading the file.
              </p>
              <div className="mt-2 flex items-center gap-2">
                {onOpenNewTab && (
                  <button
                    type="button"
                    onClick={onOpenNewTab}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0b3f8b] transition"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Open in new tab</span>
                  </button>
                )}
                {onDownload && (
                  <button
                    type="button"
                    onClick={onDownload}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Download className="size-3.5" />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          ) : blobUrl ? (
            isImage ? (
              <div className="flex flex-1 items-center justify-center overflow-auto p-4 bg-slate-900/5">
                <img
                  src={blobUrl}
                  alt={fileName || 'Document Preview'}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-md"
                />
              </div>
            ) : isPdf ? (
              <div className="flex flex-1 items-center justify-center p-2 sm:p-4 bg-slate-100 overflow-hidden">
                <div className="h-full w-full max-w-4xl bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
                  <iframe
                    src={`${blobUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                    className="h-full w-full flex-1 border-0 bg-white"
                    title={fileName || 'PDF Document'}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#E6EEF4] text-[#285497]">
                  <FileText className="size-6" />
                </span>
                <p className="text-sm font-bold text-slate-900">{fileName || 'Attached Document'}</p>
                <p className="text-xs text-slate-500">
                  Preview is available via download or external viewer.
                </p>
                {onDownload && (
                  <button
                    type="button"
                    onClick={onDownload}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0b3f8b] transition"
                  >
                    <Download className="size-3.5" />
                    <span>Download file</span>
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
              <Eye className="size-8" />
              <p className="text-xs font-semibold">No document content available to preview.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#B5BFCD]/50 bg-[#f7fbff] px-5 py-3 sm:px-6">
          <div className="text-xs text-slate-500">
            {fileName && (
              <span>
                File: <strong className="font-semibold text-slate-800">{fileName}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-200 px-5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
