/**
 * System: DPRMS
 * Purpose: Render document preview modal for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    Download,
    ExternalLink,
    Eye,
    FileCheck2,
    FileText,
    Loader2,
    Maximize2,
    Minimize2,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { reportError } from '../../utils/error_reporting';

interface DocumentPreviewModalProps
{
    blnIsOpen: boolean;
    onClose: () => void;
    title: string;
    strFileName?: string;
    intFileSize?: number | null;
    strUploadedAt?: string | null;
    strStatus?: string;
    strBlobUrl?: string | null;
    blnIsLoading?: boolean;
    strError?: string | null;
    onDownload?: () => void;
    onOpenNewTab?: () => void;
}

/** Format file size. */
function _formatFileSize(intBytes?: number | null): string
{
    if (intBytes == null || intBytes <= 0)
    {
        return 'Unknown size';
    }
    if (intBytes < 1024)
    {
        return `${intBytes} B`;
    }
    if (intBytes < 1024 * 1024)
    {
        return `${(intBytes / 1024).toFixed(1)} KB`;
    }
    return `${(intBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format uploaded date. */
function _formatUploadedDate(strDateStr?: string | null): string
{
    if (!strDateStr)
    {
        return 'Recently';
    }
    try
    {
        return new Date(strDateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch (errCaught)
    {
        reportError(errCaught, 'DocumentPreviewModal: format uploaded date failed.');

        return strDateStr;
    }
}

/** Render document preview modal and its available actions. */
export function DocumentPreviewModal({
    blnIsOpen,
    onClose,
    title: strTitle,
    strFileName,
    intFileSize,
    strUploadedAt,
    strStatus,
    strBlobUrl,
    blnIsLoading = false,
    strError = null,
    onDownload,
    onOpenNewTab,
}: DocumentPreviewModalProps)
{
    const [blnIsFullscreen, setBlnIsFullscreen] = useState(false);
    const [blnIframeLoaded, setBlnIframeLoaded] = useState(false);

    useEffect(() =>
    {
        setBlnIframeLoaded(false);
    }, [strBlobUrl, blnIsOpen]);

    useEffect(() =>
    {
        /** Handle key down. */
        const _handleKeyDown = (objEvent: KeyboardEvent) =>
        {
            if (objEvent.key === 'Escape' && blnIsOpen)
            {
                onClose();
            }
        };
        window.addEventListener('keydown', _handleKeyDown);
        return () => window.removeEventListener('keydown', _handleKeyDown);
    }, [blnIsOpen, onClose]);

    if (!blnIsOpen)
    {
        return null;
    }

    const blnIsPdf = strFileName ? strFileName.toLowerCase().endsWith('.pdf') : true;
    const blnIsImage = strFileName ? /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(strFileName) : false;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 md:p-6 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
            <div
                className={cn(
                    'flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#B5BFCD]/60 transition-all duration-200',
                    blnIsFullscreen
                        ? 'fixed inset-2 z-50 rounded-2xl h-[calc(100vh-16px)] max-h-none w-[calc(100vw-16px)] max-w-none'
                        : 'h-[90vh] w-full max-w-5xl',
                )}
            >
                <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 bg-[#f7fbff] px-5 py-3.5 sm:px-6">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497] shadow-xs">
                            <FileCheck2 className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3
                                    className="truncate text-sm font-bold text-slate-950 sm:text-base"
                                    title={strTitle}
                                >
                                    {strTitle}
                                </h3>
                                {strStatus && (
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                                            strStatus.toLowerCase() === 'complied' ||
                                                strStatus.toLowerCase() === 'approved'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                                : strStatus.toLowerCase() === 'needs revision' ||
                                                    strStatus.toLowerCase() ===
                                                    'returned_for_revision'
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                                    : 'bg-blue-50 text-[#0f53b7] border border-blue-200/80',
                                        )}
                                    >
                                        {strStatus}
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                {strFileName || 'Document File'} • {_formatFileSize(intFileSize)} •
                                Uploaded {_formatUploadedDate(strUploadedAt)}
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
                            onClick={() => setBlnIsFullscreen(!blnIsFullscreen)}
                            className="hidden sm:inline-flex size-9 items-center justify-center rounded-xl border border-[#B5BFCD] bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition shadow-2xs"
                            title={blnIsFullscreen ? 'Exit full screen' : 'Full screen'}
                        >
                            {blnIsFullscreen ? (
                                <Minimize2 className="size-4" />
                            ) : (
                                <Maximize2 className="size-4" />
                            )}
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
                    {blnIsLoading ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
                            <Loader2 className="size-8 animate-spin text-[#0f53b7]" />
                            <p className="text-xs font-semibold">Loading document content...</p>
                        </div>
                    ) : strError ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                            <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                                <FileText className="size-6" />
                            </span>
                            <p className="text-sm font-bold text-slate-900">{strError}</p>
                            <p className="max-w-md text-xs text-slate-500">
                                The document preview could not be rendered directly. You can try
                                opening it in a new window or downloading the file.
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
                    ) : strBlobUrl ? (
                        blnIsImage ? (
                            <div className="flex flex-1 items-center justify-center overflow-auto p-4 bg-slate-900/5">
                                <img
                                    src={strBlobUrl}
                                    alt={strFileName || 'Document Preview'}
                                    className="max-h-full max-w-full rounded-xl object-contain shadow-md"
                                />
                            </div>
                        ) : blnIsPdf ? (
                            <div className="relative flex flex-1 items-center justify-center p-2 sm:p-4 bg-slate-100 overflow-hidden">
                                <div className="relative h-full w-full max-w-4xl bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
                                    {!blnIframeLoaded && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white p-6 text-center">
                                            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#E6EEF4] text-[#0f53b7] shadow-xs animate-pulse">
                                                <FileCheck2 className="size-7" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="size-4 animate-spin text-[#0f53b7]" />
                                                <p className="text-xs font-bold text-slate-700">
                                                    Loading document preview...
                                                </p>
                                            </div>
                                            <p className="text-[11px] text-slate-400">
                                                Rendering document
                                            </p>
                                        </div>
                                    )}
                                    <iframe
                                        src={`${strBlobUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                        onLoad={() => setBlnIframeLoaded(true)}
                                        className={cn(
                                            'h-full w-full flex-1 border-0 bg-white transition-opacity duration-200',
                                            blnIframeLoaded
                                                ? 'opacity-100'
                                                : 'opacity-0 pointer-events-none',
                                        )}
                                        title={strFileName || 'PDF Document'}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                                <span className="grid size-12 place-items-center rounded-2xl bg-[#E6EEF4] text-[#285497]">
                                    <FileText className="size-6" />
                                </span>
                                <p className="text-sm font-bold text-slate-900">
                                    {strFileName || 'Attached Document'}
                                </p>
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
                            <p className="text-xs font-semibold">
                                No document content available to preview.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-[#B5BFCD]/50 bg-[#f7fbff] px-5 py-3 sm:px-6">
                    <div className="text-xs text-slate-500">
                        {strFileName && (
                            <span>
                                File:{' '}
                                <strong className="font-semibold text-slate-800">
                                    {strFileName}
                                </strong>
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
    ); // end return
} /* end DocumentPreviewModal */
