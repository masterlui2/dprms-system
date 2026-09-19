/**
 * System: DPRMS
 * Purpose: Render upload card for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Check, CheckCircle2, Eye, FileText, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import type { DocumentRequirement } from '../../data/proposal';
import { cn } from '../../utils/cn';

const g_intMaximumFileSize = 10 * 1024 * 1024;

/** Format file size. */
function _formatFileSize(intBytes: number): string
{
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

interface UploadCardProps
{
    strError?: string;
    objFile: File | null;
    onChange: (objFile: File | null) => void;
    objRequirement: DocumentRequirement;
}

/** Render upload card and its available actions. */
export function UploadCard({ strError, objFile, onChange, objRequirement }: UploadCardProps)
{
    const objInputRef = useRef<HTMLInputElement>(null);
    const [strFileError, setStrFileError] = useState<string | null>(null);
    const txtErrorMessage = strFileError ?? strError;
    const strInputId = `document-${objRequirement.key}`;

    /** Select file. */
    function _selectFile(objSelectedFile?: File)
    {
        if (!objSelectedFile)
        {
            return;
        }

        const strExtension = `.${objSelectedFile.name.split('.').pop()?.toLowerCase()}`;
        const arrAcceptedExtensions = objRequirement.accept
            .split(',')
            .map((strAccepted) => strAccepted.trim().toLowerCase());

        if (!arrAcceptedExtensions.includes(strExtension))
        {
            setStrFileError(
                'This file type is not supported. Choose a PDF, DOCX, XLSX, JPG, or PNG file.',
            );
            return;
        }

        if (objSelectedFile.size > g_intMaximumFileSize)
        {
            setStrFileError('This file exceeds the 10 MB maximum size.');
            return;
        }

        setStrFileError(null);
        onChange(objSelectedFile);
    } /* end _selectFile */

    /** Preview file. */
    function _previewFile()
    {
        if (!objFile)
        {
            return;
        }

        const strPreviewUrl = URL.createObjectURL(objFile);
        window.open(strPreviewUrl, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(strPreviewUrl), 60_000);
    }

    /** Remove file. */
    function _removeFile()
    {
        setStrFileError(null);
        onChange(null);

        if (objInputRef.current)
        {
            objInputRef.current.value = '';
        }
    }

    return (
        <div
            className={cn(
                'rounded-lg border bg-white p-4 transition',
                txtErrorMessage
                    ? 'border-red-300'
                    : objFile
                        ? 'border-emerald-300'
                        : 'border-slate-200',
            )}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div
                    className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-lg',
                        objFile ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#0f53b7]',
                    )}
                >
                    {objFile ? (
                        <CheckCircle2 className="size-5" />
                    ) : (
                        <FileText className="size-5" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                {objRequirement.label}
                                <span aria-label="required" className="ml-1 text-red-600">
                                    *
                                </span>
                            </p>
                            {!objRequirement.required ? (
                                <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
                                    Based on your selection
                                </p>
                            ) : null}
                        </div>
                        {objFile ? (
                            <span
                                aria-label="Upload status: Uploaded"
                                className="inline-flex w-fit rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700"
                            >
                                Uploaded
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {objRequirement.description}
                    </p>
                    <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:gap-5">
                        <span>
                            <span className="font-bold text-slate-700">Accepted:</span> PDF, DOCX,
                            XLSX, JPG, PNG
                        </span>
                        <span>
                            <span className="font-bold text-slate-700">Max size:</span> 10 MB
                        </span>
                    </div>
                    {objFile ? (
                        <div className="mt-3" aria-live="polite">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                                <Check className="size-3.5" />
                                File uploaded
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                                {objFile.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {_formatFileSize(objFile.size)}
                            </p>
                        </div>
                    ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {objFile ? (
                        <>
                            <button
                                aria-label={`Preview ${objRequirement.label}`}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-[#073b82] transition hover:border-[#0f53b7] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                                onClick={_previewFile}
                                type="button"
                            >
                                <Eye className="size-4" />
                                Preview
                            </button>
                            <label
                                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-[#073b82] transition hover:border-[#0f53b7] hover:bg-blue-50 focus-within:ring-4 focus-within:ring-blue-100"
                                htmlFor={strInputId}
                            >
                                <RefreshCw className="size-4" />
                                Replace
                            </label>
                            <button
                                aria-label={`Remove ${objRequirement.label}`}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
                                onClick={_removeFile}
                                type="button"
                            >
                                <Trash2 className="size-4" />
                                Remove
                            </button>
                        </>
                    ) : (
                        <label
                            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3.5 text-sm font-bold text-[#073b82] transition hover:border-[#0f53b7] hover:bg-blue-50 focus-within:ring-4 focus-within:ring-blue-100"
                            htmlFor={strInputId}
                        >
                            <Upload className="size-4" />
                            Choose file
                        </label>
                    )}
                    <input
                        accept={objRequirement.accept}
                        className="sr-only"
                        id={strInputId}
                        onChange={(objEvent) =>
                        {
                            _selectFile(objEvent.target.files?.[0]);
                            objEvent.currentTarget.value = '';
                        }}
                        ref={objInputRef}
                        type="file"
                    />
                </div>
            </div>

            {txtErrorMessage ? (
                <p className="mt-3 text-xs font-semibold text-red-600" role="alert">
                    {txtErrorMessage}
                </p>
            ) : null}
        </div>
    ); // end return
} /* end UploadCard */
