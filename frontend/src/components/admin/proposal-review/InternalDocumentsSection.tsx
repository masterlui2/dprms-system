/**
 * System: DPRMS
 * Purpose: Render internal documents section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    AlertTriangle,
    Check,
    Download,
    ExternalLink,
    Eye,
    FileCheck2,
    Loader2,
    ShieldCheck,
    Upload,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { reportError } from '../../../utils/error_reporting';

import { getMockUser } from '../../../lib/mock_auth';
import
{
    fetchDocumentBlobForStaff,
    fetchInternalDocumentTypes,
    fetchProposalDocumentsForStaff,
    reviewProposalDocument,
    uploadInternalDocument,
    viewDocumentBlobForStaff,
} from '../../../services/document_store';
import { downloadBlob, prepareDownloadDirectory } from '../../../services/download_manager';
import type { ApplicationProgram } from '../../../types/application';
import { cn } from '../../../utils/cn';
import
{
    getInitialInternalDocuments,
    type InternalDocument,
    type InternalDocumentStatus,
    isRequiredInternalDocumentsComplete,
    mergeInternalDocuments,
} from './internal_documents';

type InternalDocumentsMode = 'edit' | 'review' | 'view';

const STATUS_DETAILS: Record<InternalDocumentStatus, { label: string; textClass: string; }> = {
    approved: { label: 'Verified', textClass: 'text-emerald-700' },
    not_uploaded: { label: 'Pending upload', textClass: 'text-slate-500' },
    pending: { label: 'Pending review', textClass: 'text-[#0f53b7]' },
    returned_for_revision: {
        label: 'Needs revision',
        textClass: 'text-amber-700',
    },
};

/** Format file size. */
function _formatFileSize(intBytes?: number)
{
    if (intBytes == null)
    {
        return 'Unknown size';
    }
    if (intBytes < 1024)
    {
        return `${intBytes} B`;
    }
    if (intBytes < 1024 * 1024)
    {
        return `${Math.max(1, Math.round(intBytes / 1024))} KB`;
    }
    return `${(intBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format updated. */
function _formatUpdated(strValue?: string)
{
    if (!strValue)
    {
        return 'Recently';
    }
    return new Date(strValue).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** Stage label. */
function _stageLabel(objDocument: InternalDocument, strProgram: ApplicationProgram)
{
    if (strProgram === 'GIA')
    {
        return 'SET3 · Internal workflow';
    }
    return objDocument.stage === 'post-inspection'
        ? `${objDocument.setNumber} · Post-inspection`
        : `${objDocument.setNumber} · Implementation`;
}

/** Render internal documents section and its available actions. */
export function InternalDocumentsSection({
    strMode = 'edit',
    onRequiredStatusChange,
    strProgram,
    intProposalId,
}: {
    strMode?: InternalDocumentsMode;
    onRequiredStatusChange?: (blnComplete: boolean) => void;
    strProgram: ApplicationProgram;
    intProposalId?: number;
})
{
    const [arrDocuments, setArrDocuments] = useState<InternalDocument[]>(() =>
        getInitialInternalDocuments(strProgram),
    );
    const [strSelectedDocumentId, setStrSelectedDocumentId] = useState<string | null>(null);
    const [blnLoading, setBlnLoading] = useState(true);
    const [strLoadError, setStrLoadError] = useState<string | null>(null);
    const [strActionError, setStrActionError] = useState<string | null>(null);
    const [strActionNotice, setStrActionNotice] = useState<string | null>(null);
    const [strUploadingId, setStrUploadingId] = useState<string | null>(null);
    const [strReviewingStatus, setStrReviewingStatus] = useState<
        'approved' | 'returned_for_revision' | null
    >(null);
    const [strPreviewUrl, setStrPreviewUrl] = useState<string | null>(null);
    const [blnPreviewLoading, setBlnPreviewLoading] = useState(false);
    const [strPreviewError, setStrPreviewError] = useState<string | null>(null);
    const [intPreviewVersion, setIntPreviewVersion] = useState(0);
    const [blnDownloading, setBlnDownloading] = useState(false);
    const [intReloadVersion, setIntReloadVersion] = useState(0);
    const [blnIframeLoaded, setBlnIframeLoaded] = useState(false);

    useEffect(() =>
    {
        setBlnIframeLoaded(false);
    }, [strPreviewUrl]);

    const blnCanUpload = strMode === 'edit';
    const blnCanReview = strMode === 'review';
    const objSelectedDocument =
        arrDocuments.find((objDocument) => objDocument.id === strSelectedDocumentId) ?? null;
    const blnRequiredComplete = isRequiredInternalDocumentsComplete(arrDocuments);

    const intVerifiedCount = useMemo(
        () => arrDocuments.filter((objDocument) => objDocument.status === 'approved').length,
        [arrDocuments],
    );
    const dblPercentComplete =
        arrDocuments.length > 0 ? Math.round((intVerifiedCount / arrDocuments.length) * 100) : 0;

    useEffect(
        () =>
        {
            let blnCancelled = false;
            setBlnLoading(true);
            setStrLoadError(null);
            setStrActionError(null);
            setStrActionNotice(null);

            if (!intProposalId)
            {
                setArrDocuments(getInitialInternalDocuments(strProgram));
                setStrLoadError('This application is not linked to a server proposal record.');
                setBlnLoading(false);
                return () =>
                {
                    blnCancelled = true;
                };
            }

            Promise.all([
                fetchInternalDocumentTypes(strProgram),
                fetchProposalDocumentsForStaff(intProposalId),
            ])
                .then(([arrDocumentTypes, arrUploadedDocuments]) =>
                {
                    if (blnCancelled)
                    {
                        return;
                    }
                    const arrNext = mergeInternalDocuments(
                        strProgram,
                        arrDocumentTypes,
                        arrUploadedDocuments,
                    );
                    setArrDocuments(arrNext);
                    setStrSelectedDocumentId((strCurrent) =>
                    {
                        if (
                            strCurrent &&
                            arrNext.some((objDocument) => objDocument.id === strCurrent)
                        )
                        {
                            return strCurrent;
                        }
                        return (
                            arrNext.find((objDocument) => objDocument.status !== 'not_uploaded')
                                ?.id ??
                            arrNext[0]?.id ??
                            null
                        );
                    });
                })
                .catch((errError) =>
                {
                    reportError(errError, 'Failed to load internal documents:');
                    if (!blnCancelled)
                    {
                        setStrLoadError('Internal documents could not be loaded from the server.');
                    }
                })
                .finally(() =>
                {
                    if (!blnCancelled)
                    {
                        setBlnLoading(false);
                    }
                });

            return () =>
            {
                blnCancelled = true;
            };
        } /* end InternalDocumentsSection */,
        [strProgram, intProposalId, intReloadVersion],
    );

    useEffect(() =>
    {
        onRequiredStatusChange?.(blnRequiredComplete);
    }, [onRequiredStatusChange, blnRequiredComplete]);

    useEffect(() =>
    {
        setStrActionError(null);
        setStrActionNotice(null);
    }, [objSelectedDocument?.id]);

    useEffect(
        () =>
        {
            let blnCancelled = false;
            let strObjectUrl: string | null = null;

            setStrPreviewUrl(null);
            setStrPreviewError(null);

            if (!objSelectedDocument?.backendId)
            {
                setBlnPreviewLoading(false);
                return () =>
                {
                    blnCancelled = true;
                };
            }

            setBlnPreviewLoading(true);
            viewDocumentBlobForStaff(objSelectedDocument.backendId)
                .then((strUrl) =>
                {
                    strObjectUrl = strUrl;
                    if (blnCancelled)
                    {
                        URL.revokeObjectURL(strUrl);
                        return;
                    }
                    setStrPreviewUrl(strUrl);
                })
                .catch((errError) =>
                {
                    reportError(errError, 'Failed to load internal document preview:');
                    if (!blnCancelled)
                    {
                        setStrPreviewError('The PDF preview could not be loaded from the server.');
                    }
                })
                .finally(() =>
                {
                    if (!blnCancelled)
                    {
                        setBlnPreviewLoading(false);
                    }
                });

            return () =>
            {
                blnCancelled = true;
                if (strObjectUrl)
                {
                    URL.revokeObjectURL(strObjectUrl);
                }
            };
        } /* end InternalDocumentsSection */,
        [intPreviewVersion, objSelectedDocument?.backendId],
    );

    /** Save file. */
    async function _saveFile(strId: string, objFile?: File)
    {
        if (!objFile || !blnCanUpload || !intProposalId)
        {
            return;
        }

        const objDocument = arrDocuments.find((objItem) => objItem.id === strId);
        if (!objDocument?.documentTypeId)
        {
            setStrActionError(
                'The server document type is unavailable. Run the document type seeder and try again.',
            );
            return;
        }

        if (objFile.type !== 'application/pdf' && !objFile.name.toLowerCase().endsWith('.pdf'))
        {
            setStrActionError('Internal documents must be uploaded as PDF files.');
            return;
        }

        setStrUploadingId(strId);
        setStrActionError(null);
        setStrActionNotice(null);

        try
        {
            const objUploaded = await uploadInternalDocument(
                intProposalId,
                objDocument.documentTypeId,
                objFile,
            );
            setArrDocuments((arrCurrent) =>
                arrCurrent.map((objItem) =>
                    objItem.id === strId
                        ? {
                            ...objItem,
                            backendId: objUploaded.id,
                            fileName: objUploaded.file_name,
                            fileSize: objUploaded.file_size ?? undefined,
                            remarks: objUploaded.remarks ?? undefined,
                            reviewedAt: objUploaded.reviewed_at ?? undefined,
                            status: objUploaded.status,
                            updated: objUploaded.updated_at,
                        }
                        : objItem,
                ),
            );
            setStrSelectedDocumentId(strId);
            setIntPreviewVersion((intVersion) => intVersion + 1);
            setStrActionNotice(`${objDocument.label} was uploaded successfully.`);
        } /* end try */ catch (errError)
        {
            reportError(errError, 'InternalDocumentsSection: save file failed.');

            reportError(errError, 'Failed to upload internal document:');
            setStrActionError('The internal PDF could not be uploaded. Please try again.');
        } finally
        {
            setStrUploadingId(null);
        }
    } /* end _saveFile */

    /** Save review. */
    async function _saveReview(strStatus: 'approved' | 'returned_for_revision')
    {
        if (!objSelectedDocument?.backendId || !blnCanReview)
        {
            return;
        }

        setStrReviewingStatus(strStatus);
        setStrActionError(null);
        setStrActionNotice(null);

        try
        {
            const objUpdated = await reviewProposalDocument(
                objSelectedDocument.backendId,
                strStatus,
            );
            const arrNextDocs = arrDocuments.map((objDocument) =>
                objDocument.id === objSelectedDocument.id
                    ? {
                        ...objDocument,
                        remarks: objUpdated.remarks ?? undefined,
                        reviewedAt: objUpdated.reviewed_at ?? undefined,
                        status: objUpdated.status,
                        updated: objUpdated.updated_at,
                    }
                    : objDocument,
            );
            setArrDocuments(arrNextDocs);
            setStrActionNotice(
                strStatus === 'approved'
                    ? 'Internal document marked as verified.'
                    : 'Revision instructions saved for Project Staff.',
            );

            // Auto advance to next unverified document or next in list
            const intCurrentIndex = arrNextDocs.findIndex(
                (objItem) => objItem.id === objSelectedDocument.id,
            );
            const objNextDoc =
                arrNextDocs.find(
                    (objItem, intIndex) =>
                        intIndex > intCurrentIndex &&
                        objItem.status !== 'approved' &&
                        objItem.status !== 'not_uploaded',
                ) ??
                arrNextDocs.find(
                    (objItem) =>
                        objItem.id !== objSelectedDocument.id &&
                        objItem.status !== 'approved' &&
                        objItem.status !== 'not_uploaded',
                ) ??
                arrNextDocs[intCurrentIndex + 1] ??
                objSelectedDocument;

            setStrSelectedDocumentId(objNextDoc.id);
        } /* end try */ catch (errError)
        {
            reportError(errError, 'InternalDocumentsSection: save review failed.');

            reportError(errError, 'Failed to review internal document:');
            setStrActionError('The document review could not be saved. Please try again.');
        } finally
        {
            setStrReviewingStatus(null);
        }
    } /* end _saveReview */

    /** Handle download. */
    async function _handleDownload(objDocument: InternalDocument)
    {
        if (!objDocument.backendId)
        {
            return;
        }
        const objCurrentUser = getMockUser();
        if (!objCurrentUser)
        {
            return;
        }
        setBlnDownloading(true);
        setStrPreviewError(null);

        try
        {
            const objDirectory = await prepareDownloadDirectory(objCurrentUser);
            const objBlob = await fetchDocumentBlobForStaff(objDocument.backendId);
            await downloadBlob({
                directory: objDirectory,
                blob: objBlob,
                fileName: objDocument.fileName || `${objDocument.label}.pdf`,
                program: strProgram,
                user: objCurrentUser,
            });
        } catch (errError)
        {
            reportError(errError, 'InternalDocumentsSection: handle download failed.');

            reportError(errError, 'Failed to download internal document:');
            setStrPreviewError('The PDF could not be downloaded from the server.');
        } finally
        {
            setBlnDownloading(false);
        }
    } /* end _handleDownload */

    /** Handle file change. */
    function _handleFileChange(strId: string, objEvent: React.ChangeEvent<HTMLInputElement>)
    {
        const objFile = objEvent.target.files?.[0];
        objEvent.target.value = '';
        void _saveFile(strId, objFile);
    }

    const objSelectedStatus = objSelectedDocument
        ? STATUS_DETAILS[objSelectedDocument.status]
        : null;

    return (
        <div className="grid h-full min-h-[calc(92vh-160px)] gap-3 lg:grid-cols-[minmax(330px,365px)_minmax(0,1fr)]">
            <section className="flex h-full min-h-[calc(92vh-160px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="border-b border-slate-200 bg-slate-50/60 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#073b82]">
                                <ShieldCheck className="size-4 text-[#0f53b7]" />
                                Internal Documents
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                                {intVerifiedCount} of {arrDocuments.length} verified (
                                {dblPercentComplete}%)
                            </p>
                        </div>
                        <span
                            className={cn(
                                'shrink-0 whitespace-nowrap text-[10px] font-semibold',
                                dblPercentComplete === 100 ? 'text-emerald-700' : 'text-[#0f53b7]',
                            )}
                        >
                            {dblPercentComplete === 100 ? 'Complete' : 'In Review'}
                        </span>
                    </div>

                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                        <div
                            className={cn(
                                'h-full transition-all duration-300',
                                dblPercentComplete === 100 ? 'bg-emerald-600' : 'bg-[#0f53b7]',
                            )}
                            style={{ width: `${dblPercentComplete}%` }}
                        />
                    </div>

                    {strActionError ? (
                        <p className="mt-2 text-[11px] font-semibold text-rose-700" role="alert">
                            {strActionError}
                        </p>
                    ) : null}
                    {strActionNotice ? (
                        <p
                            className="mt-2 text-[11px] font-semibold text-emerald-700"
                            role="status"
                        >
                            {strActionNotice}
                        </p>
                    ) : null}
                </div>

                <div className="max-h-[calc(92vh-240px)] flex-1 divide-y divide-slate-100 overflow-y-auto">
                    {blnLoading ? (
                        <div className="flex items-center justify-center gap-2 p-8 text-xs font-semibold text-slate-500">
                            <Loader2 className="size-4 animate-spin" />
                            Loading internal documents...
                        </div>
                    ) : strLoadError ? (
                        <div className="p-6 text-center">
                            <p className="text-xs font-semibold leading-5 text-rose-700">
                                {strLoadError}
                            </p>
                            {intProposalId ? (
                                <button
                                    className="mt-3 text-xs font-bold text-[#0f53b7] hover:underline"
                                    onClick={() =>
                                        setIntReloadVersion((intVersion) => intVersion + 1)
                                    }
                                    type="button"
                                >
                                    Try again
                                </button>
                            ) : null}
                        </div>
                    ) : arrDocuments.length === 0 ? (
                        <div className="p-8 text-center">
                            <FileCheck2 className="mx-auto size-7 text-slate-300" />
                            <p className="mt-3 text-xs font-bold text-slate-700">
                                No internal requirements configured
                            </p>
                            <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                Run the document type seeder to add {strProgram} internal records.
                            </p>
                        </div>
                    ) : (
                        arrDocuments.map(
                            (objDocument, intIndex) =>
                            {
                                const blnIsAttached = objDocument.status !== 'not_uploaded';
                                const blnIsSelected = objSelectedDocument?.id === objDocument.id;
                                const blnIsUploading = strUploadingId === objDocument.id;
                                const objStatus = STATUS_DETAILS[objDocument.status];

                                return (
                                    <div
                                        className={cn(
                                            'group flex items-center justify-between gap-2 px-3 py-2.5 transition hover:bg-blue-50/60',
                                            blnIsSelected &&
                                            'border-l-4 border-[#073b82] bg-blue-50/90',
                                        )}
                                        key={objDocument.id}
                                    >
                                        <button
                                            className="flex min-w-0 flex-1 items-start gap-2.5 text-left focus-visible:outline-none"
                                            onClick={() => setStrSelectedDocumentId(objDocument.id)}
                                            type="button"
                                        >
                                            <span
                                                className={cn(
                                                    'mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-[11px]',
                                                    objDocument.status === 'approved'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : objDocument.status ===
                                                            'returned_for_revision'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : blnIsAttached
                                                                ? 'bg-blue-100 text-[#0f53b7]'
                                                                : 'bg-slate-100 text-slate-500',
                                                )}
                                            >
                                                {blnIsUploading ? (
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                ) : objDocument.status === 'approved' ? (
                                                    <Check className="size-3.5" />
                                                ) : objDocument.status ===
                                                    'returned_for_revision' ? (
                                                    <AlertTriangle className="size-3.5" />
                                                ) : (
                                                    <span className="text-[10px] font-bold">
                                                        {intIndex + 1}
                                                    </span>
                                                )}
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        'text-xs font-bold leading-snug text-slate-900 transition group-hover:text-[#073b82]',
                                                        blnIsSelected && 'text-[#073b82]',
                                                    )}
                                                    title={objDocument.label}
                                                >
                                                    {objDocument.label}
                                                </p>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                                                    <span>
                                                        {_stageLabel(objDocument, strProgram)}
                                                    </span>
                                                    {objDocument.fileName ? (
                                                        <>
                                                            <span>·</span>
                                                            <span>
                                                                {_formatFileSize(
                                                                    objDocument.fileSize,
                                                                )}
                                                            </span>
                                                        </>
                                                    ) : null}
                                                    <span>·</span>
                                                    <span
                                                        className={cn(
                                                            'font-bold',
                                                            objStatus.textClass,
                                                        )}
                                                    >
                                                        {blnIsUploading
                                                            ? 'Uploading'
                                                            : objStatus.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>

                                        {blnCanUpload ? (
                                            <div className="flex shrink-0 items-center">
                                                <input
                                                    accept="application/pdf,.pdf"
                                                    className="sr-only"
                                                    disabled={Boolean(strUploadingId)}
                                                    id={`internal-upload-${objDocument.id}`}
                                                    onChange={(objEvent) =>
                                                        _handleFileChange(objDocument.id, objEvent)
                                                    }
                                                    type="file"
                                                />
                                                <label
                                                    aria-label={
                                                        blnIsAttached
                                                            ? `Replace ${objDocument.label}`
                                                            : `Upload ${objDocument.label}`
                                                    }
                                                    className={cn(
                                                        'inline-flex size-7 items-center justify-center rounded-md transition',
                                                        strUploadingId
                                                            ? 'cursor-wait text-slate-300'
                                                            : blnIsAttached
                                                                ? 'cursor-pointer text-slate-400 hover:bg-slate-200 hover:text-slate-800'
                                                                : 'cursor-pointer bg-[#0f53b7] text-white hover:bg-[#0b3f8b]',
                                                    )}
                                                    htmlFor={`internal-upload-${objDocument.id}`}
                                                    onClick={(objEvent) =>
                                                        objEvent.stopPropagation()
                                                    }
                                                    title={
                                                        blnIsAttached ? 'Replace PDF' : 'Upload PDF'
                                                    }
                                                >
                                                    {blnIsUploading ? (
                                                        <Loader2 className="size-3 animate-spin" />
                                                    ) : (
                                                        <Upload className="size-3" />
                                                    )}
                                                </label>
                                            </div>
                                        ) : null}
                                    </div>
                                ); // end return
                            } /* end InternalDocumentsSection */,
                        )
                    )}
                </div>
            </section>

            <section className="flex h-full min-h-[calc(92vh-160px)] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                {objSelectedDocument?.backendId ? (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3.5 py-2.5">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="truncate text-xs font-bold text-slate-900"
                                        title={objSelectedDocument.label}
                                    >
                                        {objSelectedDocument.label}
                                    </span>
                                    {objSelectedStatus ? (
                                        <span
                                            className={cn(
                                                'text-[10px] font-bold',
                                                objSelectedStatus.textClass,
                                            )}
                                        >
                                            {objSelectedStatus.label}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                                    {objSelectedDocument.fileName} ·{' '}
                                    {_formatFileSize(objSelectedDocument.fileSize)} · Updated{' '}
                                    {_formatUpdated(objSelectedDocument.updated)}
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {blnCanReview && objSelectedDocument.backendId ? (
                                    <>
                                        <button
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold shadow-2xs transition disabled:opacity-50',
                                                objSelectedDocument.status === 'approved'
                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                    : 'border border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800',
                                            )}
                                            disabled={strReviewingStatus !== null}
                                            onClick={() => void _saveReview('approved')}
                                            title={
                                                objSelectedDocument.status === 'approved'
                                                    ? 'Verified'
                                                    : 'Mark as Verified'
                                            }
                                            type="button"
                                        >
                                            {strReviewingStatus === 'approved' ? (
                                                <Loader2 className="size-3.5 animate-spin" />
                                            ) : (
                                                <Check className="size-3.5" />
                                            )}
                                            <span>
                                                {objSelectedDocument.status === 'approved'
                                                    ? 'Verified'
                                                    : 'Mark Verified'}
                                            </span>
                                        </button>
                                        <div className="mx-0.5 h-4 w-px bg-slate-200" />
                                    </>
                                ) : null}

                                <button
                                    className="inline-flex size-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                                    disabled={blnDownloading}
                                    onClick={() => void _handleDownload(objSelectedDocument)}
                                    title="Download PDF"
                                    type="button"
                                >
                                    {blnDownloading ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Download className="size-3.5" />
                                    )}
                                </button>
                                <button
                                    className="inline-flex size-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                                    disabled={!strPreviewUrl}
                                    onClick={() =>
                                        strPreviewUrl &&
                                        window.open(`${strPreviewUrl}#view=FitH`, '_blank')
                                    }
                                    title="Open PDF in new tab"
                                    type="button"
                                >
                                    <ExternalLink className="size-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="relative flex min-h-[360px] flex-1 flex-col overflow-hidden bg-slate-100">
                            {blnPreviewLoading ? (
                                <div className="flex flex-1 items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                                    <Loader2 className="size-4 animate-spin" />
                                    Loading PDF from server...
                                </div>
                            ) : strPreviewUrl ? (
                                <div className="relative h-full min-h-[360px] w-full flex-1 bg-white">
                                    {!blnIframeLoaded && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white text-xs font-semibold text-slate-500">
                                            <Loader2 className="size-4 animate-spin text-[#0f53b7]" />
                                            <span>Loading document preview...</span>
                                        </div>
                                    )}
                                    <iframe
                                        className={cn(
                                            'h-full min-h-[360px] w-full flex-1 border-0 bg-white transition-opacity duration-200',
                                            blnIframeLoaded
                                                ? 'opacity-100'
                                                : 'opacity-0 pointer-events-none',
                                        )}
                                        onLoad={() => setBlnIframeLoaded(true)}
                                        src={`${strPreviewUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=1`}
                                        title={objSelectedDocument.label}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
                                    <FileCheck2 className="size-8 text-emerald-600" />
                                    <p className="text-xs font-bold text-slate-800">
                                        {objSelectedDocument.fileName}
                                    </p>
                                    <p className="text-[11px] text-rose-600">
                                        {strPreviewError ||
                                            'The server PDF preview is unavailable.'}
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
                            {objSelectedDocument?.label || 'Select an internal requirement'}
                        </p>
                        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                            {strLoadError
                                ? 'Connect this application to its server proposal before managing internal records.'
                                : blnCanUpload
                                    ? 'Upload the staff-prepared PDF to make it available for Focal review.'
                                    : 'Waiting for Project Staff to upload this internal document.'}
                        </p>
                        {blnCanUpload && objSelectedDocument && !strLoadError ? (
                            <div className="mt-4">
                                <input
                                    accept="application/pdf,.pdf"
                                    className="sr-only"
                                    disabled={Boolean(strUploadingId)}
                                    id={`empty-upload-${objSelectedDocument.id}`}
                                    onChange={(objEvent) =>
                                        _handleFileChange(objSelectedDocument.id, objEvent)
                                    }
                                    type="file"
                                />
                                <label
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0f53b7] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b]"
                                    htmlFor={`empty-upload-${objSelectedDocument.id}`}
                                >
                                    {strUploadingId === objSelectedDocument.id ? (
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
    ); // end return
} /* end InternalDocumentsSection */
