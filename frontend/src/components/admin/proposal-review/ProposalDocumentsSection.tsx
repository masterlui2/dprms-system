/**
 * System: DPRMS
 * Purpose: Render proposal documents section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Check, Download, ExternalLink, Eye, FileCheck2, Loader2, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { reportError } from '../../../utils/error_reporting';

import { ROLES } from '../../../config/permissions';
import { getMockUser } from '../../../lib/mock_auth';
import
{
    fetchDocumentBlobForStaff,
    fetchProposalDocumentsForStaff,
    reviewProposalDocument,
    viewDocumentBlobForStaff,
    type DocumentApiRecord,
} from '../../../services/document_store';
import { downloadBlob, prepareDownloadDirectory } from '../../../services/download_manager';
import type { ApplicationProgram } from '../../../types/application';
import { cn } from '../../../utils/cn';

interface ProposalDocumentsSectionProps
{
    onVerificationCompleteChange?: (blnComplete: boolean) => void;
    strProgram: ApplicationProgram;
    intProposalId: number;
}

/** Format file size. */
function _formatFileSize(intBytes: number | null): string
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
        return `${(intBytes / 1024).toFixed(1)} KB`;
    }
    return `${(intBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format updated. */
function _formatUpdated(strIsoDate: string): string
{
    return new Date(strIsoDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/** Render proposal documents section and its available actions. */
export function ProposalDocumentsSection({
    onVerificationCompleteChange,
    strProgram,
    intProposalId,
}: ProposalDocumentsSectionProps)
{
    const objCurrentUser = getMockUser();
    const blnCanReview = objCurrentUser?.role === ROLES.FOCAL;
    const [arrDocuments, setArrDocuments] = useState<DocumentApiRecord[]>([]);
    const [blnLoading, setBlnLoading] = useState(true);
    const [strError, setStrError] = useState<string | null>(null);
    const [objSelectedDocument, setObjSelectedDocument] = useState<DocumentApiRecord | null>(null);
    const [strPreviewUrl, setStrPreviewUrl] = useState<string | null>(null);
    const [blnPreviewLoading, setBlnPreviewLoading] = useState(false);
    const [strPreviewError, setStrPreviewError] = useState<string | null>(null);
    const [blnIframeLoaded, setBlnIframeLoaded] = useState(false);

    useEffect(() =>
    {
        setBlnIframeLoaded(false);
    }, [strPreviewUrl]);

    // Local verification status state per document
    const [objVerifiedMap, setObjVerifiedMap] = useState<
        Record<number, 'approved' | 'pending' | 'returned_for_revision'>
    >({});

    // Tracks in-flight view/download requests per document id
    const [objPendingAction, setObjPendingAction] = useState<{
        id: number;
        type: 'view' | 'download';
    } | null>(null);
    const [strActionError, setStrActionError] = useState<string | null>(null);
    const [blnReviewing, setBlnReviewing] = useState(false);

    // Modal for Revision Remarks
    const [blnRevisionModalOpen, setBlnRevisionModalOpen] = useState(false);
    const [txtModalRemarks, setTxtModalRemarks] = useState('');

    useEffect(
        () =>
        {
            let blnCancelled = false;
            setBlnLoading(true);
            setStrError(null);
            fetchProposalDocumentsForStaff(intProposalId)
                .then((arrData) =>
                {
                    if (blnCancelled)
                    {
                        return;
                    }
                    // Hide only the system-generated application snapshot. Required files such
                    // as the GIA "Complete Project Proposal Form" must remain reviewable.
                    const arrFilteredData = arrData.filter((objDoc) =>
                    {
                        return !(
                            objDoc.document_type?.set_number === 'PROPOSAL' &&
                            objDoc.document_type.is_applicant_visible === false
                        );
                    });
                    setArrDocuments(arrFilteredData);
                    const objInitialMap: Record<
                        number,
                        'approved' | 'pending' | 'returned_for_revision'
                    > = {};
                    arrFilteredData.forEach((objDoc) =>
                    {
                        objInitialMap[objDoc.id] = objDoc.status;
                    });
                    setObjVerifiedMap(objInitialMap);
                    setObjSelectedDocument(
                        (objCurrent) => objCurrent ?? arrFilteredData[0] ?? null,
                    );
                })
                .catch((errError) =>
                {
                    reportError(errError, 'Failed to load proposal documents:');
                    if (!blnCancelled)
                    {
                        setStrError('Could not load documents for this proposal.');
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
        } /* end ProposalDocumentsSection */,
        [intProposalId],
    );

    // Load inline preview blob whenever the selected document changes
    useEffect(
        () =>
        {
            if (!objSelectedDocument)
            {
                setStrPreviewUrl(null);
                return;
            }

            let blnCancelled = false;
            setBlnPreviewLoading(true);
            setStrPreviewError(null);

            viewDocumentBlobForStaff(objSelectedDocument.id)
                .then((strBlobUrl) =>
                {
                    if (blnCancelled)
                    {
                        URL.revokeObjectURL(strBlobUrl);
                        return;
                    }
                    setStrPreviewUrl((strPrevious) =>
                    {
                        if (strPrevious)
                        {
                            URL.revokeObjectURL(strPrevious);
                        }
                        return strBlobUrl;
                    });
                })
                .catch((errError) =>
                {
                    reportError(errError, 'Failed to load inline document preview:');
                    if (!blnCancelled)
                    {
                        setStrPreviewError('Unable to render document preview inline.');
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
            };
        } /* end ProposalDocumentsSection */,
        [objSelectedDocument],
    );

    /** Handle view. */
    async function _handleView(objDocument: DocumentApiRecord)
    {
        setStrActionError(null);
        setObjPendingAction({ id: objDocument.id, type: 'view' });
        try
        {
            const strBlobUrl = await viewDocumentBlobForStaff(objDocument.id);
            window.open(strBlobUrl, '_blank');
        } catch (errError)
        {
            reportError(errError, 'ProposalDocumentsSection: handle view failed.');

            reportError(errError, 'Failed to open document:');
            setStrActionError(
                'Could not open this document. It may have been removed from storage.',
            );
        } finally
        {
            setObjPendingAction(null);
        }
    }

    /** Handle download. */
    async function _handleDownload(objDocument: DocumentApiRecord)
    {
        if (!objCurrentUser)
        {
            return;
        }
        setStrActionError(null);
        setObjPendingAction({ id: objDocument.id, type: 'download' });
        try
        {
            const objDirectory = await prepareDownloadDirectory(objCurrentUser);
            const objBlob = await fetchDocumentBlobForStaff(objDocument.id);
            await downloadBlob({
                blob: objBlob,
                directory: objDirectory,
                fileName: objDocument.file_name,
                program: strProgram,
                user: objCurrentUser,
            });
        } catch (errError)
        {
            reportError(errError, 'ProposalDocumentsSection: handle download failed.');

            reportError(errError, 'Failed to download document:');
            setStrActionError(
                'Could not download this document. It may have been removed from storage.',
            );
        } finally
        {
            setObjPendingAction(null);
        }
    }

    /** Save review. */
    async function _saveReview(
        strStatus: 'approved' | 'returned_for_revision',
        txtCustomRemarks?: string,
    )
    {
        if (!objSelectedDocument || !blnCanReview)
        {
            return;
        }
        const txtFinalRemarks =
            txtCustomRemarks !== undefined ? txtCustomRemarks : objSelectedDocument.remarks || '';
        if (strStatus === 'returned_for_revision' && !txtFinalRemarks.trim())
        {
            setStrActionError('Review remarks are required when returning this file for revision.');
            return;
        }

        setBlnReviewing(true);
        setStrActionError(null);
        try
        {
            const objUpdated = await reviewProposalDocument(
                objSelectedDocument.id,
                strStatus,
                txtFinalRemarks,
            );
            const arrNextDocs = arrDocuments.map((objDocument) =>
                objDocument.id === objUpdated.id ? objUpdated : objDocument,
            );
            setArrDocuments(arrNextDocs);
            setObjVerifiedMap((objCurrent) => ({
                ...objCurrent,
                [objUpdated.id]: objUpdated.status,
            }));

            // Automatically advance to the next unverified document or next in list
            const intCurrentIndex = arrNextDocs.findIndex((objDoc) => objDoc.id === objUpdated.id);
            const objNextDoc =
                arrNextDocs.find(
                    (objDoc, intIndex) =>
                        intIndex > intCurrentIndex && objDoc.status !== 'approved',
                ) ??
                arrNextDocs.find(
                    (objDoc) => objDoc.id !== objUpdated.id && objDoc.status !== 'approved',
                ) ??
                arrNextDocs[intCurrentIndex + 1] ??
                objUpdated;

            setObjSelectedDocument(objNextDoc);
            setBlnRevisionModalOpen(false);
            setTxtModalRemarks('');
        } catch (errError)
        {
            reportError(errError, 'ProposalDocumentsSection: save review failed.');

            reportError(errError, 'Failed to save document review:');
            setStrActionError('The document review could not be saved. Please try again.');
        } finally
        {
            setBlnReviewing(false);
        }
    } /* end _saveReview */

    const intVerifiedCount = useMemo(() =>
    {
        return arrDocuments.filter((objItem) => objVerifiedMap[objItem.id] === 'approved').length;
    }, [arrDocuments, objVerifiedMap]);

    const blnAllVerified = useMemo(() =>
    {
        return (
            arrDocuments.length > 0 &&
            arrDocuments.every(
                (objItem) => (objVerifiedMap[objItem.id] ?? objItem.status) === 'approved',
            )
        );
    }, [arrDocuments, objVerifiedMap]);

    useEffect(() =>
    {
        onVerificationCompleteChange?.(blnAllVerified);
    }, [blnAllVerified, onVerificationCompleteChange]);

    const dblPercentComplete =
        arrDocuments.length > 0 ? Math.round((intVerifiedCount / arrDocuments.length) * 100) : 0;

    if (blnLoading)
    {
        return (
            <div className="flex min-h-[340px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Loader2 className="size-4 animate-spin text-[#073b82]" />
                    Loading checklist & documents…
                </p>
            </div>
        );
    }

    if (strError)
    {
        return (
            <div className="flex min-h-[340px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <p className="text-xs font-semibold text-red-600">{strError}</p>
            </div>
        );
    }

    if (arrDocuments.length === 0)
    {
        return (
            <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center">
                <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
                    <FileCheck2 className="size-6" />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-800">No documents submitted yet</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Documents uploaded by the proponent will appear here once submitted.
                </p>
            </div>
        );
    }

    const strSelectedDocStatus = objSelectedDocument
        ? (objVerifiedMap[objSelectedDocument.id] ?? 'pending')
        : 'pending';

    return (
        <div className="grid h-full min-h-[calc(92vh-160px)] gap-3 lg:grid-cols-[minmax(330px,365px)_minmax(0,1fr)]">
            {/* Document Checklist Column */}
            <section className="flex h-full min-h-[calc(92vh-160px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                {/* Checklist Header with Progress Meter */}
                <div className="border-b border-slate-200 bg-slate-50/60 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#073b82]">
                                <FileCheck2 className="size-4 text-[#0f53b7]" />
                                Document Checklist
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

                    {/* Progress Bar */}
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                        <div
                            className={cn(
                                'h-full transition-all duration-300',
                                dblPercentComplete === 100 ? 'bg-emerald-600' : 'bg-[#0f53b7]',
                            )}
                            style={{ width: `${dblPercentComplete}%` }}
                        />
                    </div>
                </div>

                {/* Scrollable Checklist Items */}
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(92vh-240px)] flex-1">
                    {arrDocuments.map(
                        (objDocument, intIndex) =>
                        {
                            const strCurrentStatus = objVerifiedMap[objDocument.id] ?? 'pending';
                            const blnIsApproved = strCurrentStatus === 'approved';
                            const blnIsRevision = strCurrentStatus === 'returned_for_revision';
                            const blnIsSelected = objSelectedDocument?.id === objDocument.id;
                            const strRequirementTitle =
                                objDocument.document_type?.name || objDocument.file_name;
                            const strGroupName = objDocument.document_type?.group;

                            return (
                                <div
                                    className={cn(
                                        'group flex items-center justify-between gap-2 px-3 py-2.5 transition hover:bg-blue-50/60',
                                        blnIsSelected &&
                                        'bg-blue-50/90 border-l-4 border-[#073b82]',
                                    )}
                                    key={objDocument.id}
                                >
                                    <button
                                        className="flex min-w-0 flex-1 items-start gap-2.5 text-left focus-visible:outline-none"
                                        onClick={() => setObjSelectedDocument(objDocument)}
                                        type="button"
                                    >
                                        {/* Status Indicator Icon */}
                                        <span
                                            className={cn(
                                                'mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-[11px]',
                                                blnIsApproved
                                                    ? 'bg-emerald-100 text-emerald-700 font-bold'
                                                    : blnIsRevision
                                                        ? 'bg-rose-100 text-rose-700 font-bold'
                                                        : 'bg-slate-100 text-slate-500',
                                            )}
                                        >
                                            {blnIsApproved ? (
                                                <Check className="size-3.5" />
                                            ) : blnIsRevision ? (
                                                <XCircle className="size-3.5" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-500">
                                                    {intIndex + 1}
                                                </span>
                                            )}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={cn(
                                                    'text-xs font-bold text-slate-900 transition group-hover:text-[#073b82] leading-snug',
                                                    blnIsSelected && 'text-[#073b82]',
                                                )}
                                                title={strRequirementTitle}
                                            >
                                                {strRequirementTitle}
                                            </p>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                                                {strGroupName ? (
                                                    <span className="rounded bg-slate-100 px-1 py-0.2 text-[10px] font-medium text-slate-600">
                                                        {strGroupName}
                                                    </span>
                                                ) : null}
                                                <span>
                                                    {_formatFileSize(objDocument.file_size)}
                                                </span>
                                                <span>·</span>
                                                <span
                                                    className={cn(
                                                        'font-semibold',
                                                        blnIsApproved
                                                            ? 'text-emerald-700'
                                                            : blnIsRevision
                                                                ? 'text-rose-700'
                                                                : 'text-amber-600',
                                                    )}
                                                >
                                                    {blnIsApproved
                                                        ? 'Verified'
                                                        : blnIsRevision
                                                            ? 'Action Required'
                                                            : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            ); // end return
                        } /* end ProposalDocumentsSection */,
                    )}
                </div>
            </section>

            {/* Document PDF Preview Viewport Column */}
            <section className="flex h-full min-h-[calc(92vh-160px)] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                {objSelectedDocument ? (
                    <>
                        {/* Header bar with Document Info & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3.5 py-2.5">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="truncate text-xs font-bold text-slate-900"
                                        title={objSelectedDocument.file_name}
                                    >
                                        {objSelectedDocument.document_type?.name ||
                                            objSelectedDocument.file_name}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[10px] font-semibold',
                                            strSelectedDocStatus === 'approved'
                                                ? 'text-emerald-700'
                                                : strSelectedDocStatus === 'returned_for_revision'
                                                    ? 'text-rose-700'
                                                    : 'text-amber-700',
                                        )}
                                    >
                                        {strSelectedDocStatus === 'approved'
                                            ? 'Verified'
                                            : strSelectedDocStatus === 'returned_for_revision'
                                                ? 'Needs Revision'
                                                : 'Unverified'}
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                                    {objSelectedDocument.file_name} ·{' '}
                                    {_formatFileSize(objSelectedDocument.file_size)} · Uploaded{' '}
                                    {_formatUpdated(objSelectedDocument.created_at)}
                                </p>
                            </div>

                            {/* Action Buttons: Verification, Revision, Download, View */}
                            <div className="flex items-center gap-1.5">
                                {blnCanReview ? (
                                    <>
                                        <button
                                            className={cn(
                                                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold shadow-2xs transition disabled:opacity-50',
                                                strSelectedDocStatus === 'approved'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'border border-slate-300 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800',
                                            )}
                                            disabled={blnReviewing}
                                            onClick={() => void _saveReview('approved')}
                                            title="Mark as verified"
                                            type="button"
                                        >
                                            <Check className="size-3.5" />
                                            <span>
                                                {strSelectedDocStatus === 'approved'
                                                    ? 'Verified'
                                                    : 'Verify'}
                                            </span>
                                        </button>

                                        <button
                                            className={cn(
                                                'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold shadow-2xs transition disabled:opacity-50',
                                                strSelectedDocStatus === 'returned_for_revision'
                                                    ? 'bg-rose-600 text-white'
                                                    : 'border border-slate-300 bg-white text-slate-700 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800',
                                            )}
                                            disabled={blnReviewing}
                                            onClick={() =>
                                            {
                                                setTxtModalRemarks(
                                                    objSelectedDocument.remarks || '',
                                                );
                                                setBlnRevisionModalOpen(true);
                                            }}
                                            title="Flag for revision"
                                            type="button"
                                        >
                                            <X className="size-3.5" />
                                            <span>
                                                {strSelectedDocStatus === 'returned_for_revision'
                                                    ? 'Flagged'
                                                    : 'Needs Revision'}
                                            </span>
                                        </button>

                                        <div className="mx-0.5 h-4 w-px bg-slate-200" />
                                    </>
                                ) : null}

                                <button
                                    className="inline-flex size-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                                    disabled={objPendingAction?.id === objSelectedDocument.id}
                                    onClick={() => _handleDownload(objSelectedDocument)}
                                    title="Download PDF"
                                    type="button"
                                >
                                    {objPendingAction?.id === objSelectedDocument.id &&
                                        objPendingAction.type === 'download' ? (
                                        <Loader2 className="size-3.5 animate-spin text-[#073b82]" />
                                    ) : (
                                        <Download className="size-3.5" />
                                    )}
                                </button>
                                <button
                                    className="inline-flex size-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                                    disabled={objPendingAction?.id === objSelectedDocument.id}
                                    onClick={() => _handleView(objSelectedDocument)}
                                    title="Open PDF in new tab"
                                    type="button"
                                >
                                    {objPendingAction?.id === objSelectedDocument.id &&
                                        objPendingAction.type === 'view' ? (
                                        <Loader2 className="size-3.5 animate-spin text-[#073b82]" />
                                    ) : (
                                        <ExternalLink className="size-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {objSelectedDocument.remarks ? (
                            <div className="border-b border-amber-100 bg-amber-50/80 px-3.5 py-2 text-xs text-amber-900 flex items-center justify-between gap-2">
                                <p className="truncate">
                                    <span className="font-bold">Revision instructions:</span>{' '}
                                    {objSelectedDocument.remarks}
                                </p>
                                {blnCanReview ? (
                                    <button
                                        className="shrink-0 text-[11px] font-bold text-amber-800 hover:underline"
                                        onClick={() =>
                                        {
                                            setTxtModalRemarks(objSelectedDocument.remarks || '');
                                            setBlnRevisionModalOpen(true);
                                        }}
                                        type="button"
                                    >
                                        Edit
                                    </button>
                                ) : null}
                            </div>
                        ) : null}

                        {strActionError ? (
                            <div className="border-b border-red-100 bg-red-50 px-3.5 py-1.5 text-xs text-red-700 font-medium">
                                {strActionError}
                            </div>
                        ) : null}

                        {/* Document Preview Viewport */}
                        <div className="relative flex h-full min-h-[calc(92vh-220px)] flex-1 flex-col overflow-hidden bg-slate-100">
                            {blnPreviewLoading ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
                                    <Loader2 className="size-6 animate-spin text-[#073b82]" />
                                    <p className="text-xs font-medium">
                                        Rendering document preview…
                                    </p>
                                </div>
                            ) : strPreviewError ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-8 text-center">
                                    <span className="grid size-10 place-items-center rounded-lg bg-red-50 text-red-500">
                                        <FileCheck2 className="size-5" />
                                    </span>
                                    <p className="text-xs font-bold text-slate-800">
                                        {strPreviewError}
                                    </p>
                                    <button
                                        className="inline-flex items-center gap-1 rounded-md bg-[#0f53b7] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0b3f8b]"
                                        onClick={() => _handleView(objSelectedDocument)}
                                        type="button"
                                    >
                                        <ExternalLink className="size-3" />
                                        Open in new tab
                                    </button>
                                </div>
                            ) : strPreviewUrl ? (
                                <div className="relative h-full min-h-[calc(92vh-220px)] w-full flex-1 bg-white">
                                    {!blnIframeLoaded && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white text-xs font-semibold text-slate-500">
                                            <Loader2 className="size-5 animate-spin text-[#0f53b7]" />
                                            <span>Loading document preview...</span>
                                        </div>
                                    )}
                                    <iframe
                                        className={cn(
                                            'h-full min-h-[calc(92vh-220px)] w-full flex-1 border-0 bg-white transition-opacity duration-200',
                                            blnIframeLoaded
                                                ? 'opacity-100'
                                                : 'opacity-0 pointer-events-none',
                                        )}
                                        onLoad={() => setBlnIframeLoaded(true)}
                                        src={`${strPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                                        title={objSelectedDocument.file_name}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
                                    <Eye className="size-6" />
                                    <p className="mt-1 text-xs">No preview available</p>
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
                            Select a submitted document
                        </p>
                        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                            Click any requirement on the checklist to preview its contents and
                            verify completeness.
                        </p>
                    </div>
                )}
            </section>

            {/* Pop-up Modal for Revision Remarks & Confirmation */}
            {blnRevisionModalOpen && objSelectedDocument ? (
                <div
                    aria-labelledby="revision-modal-title"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
                    role="dialog"
                >
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h4
                                    className="text-sm font-bold text-slate-900"
                                    id="revision-modal-title"
                                >
                                    Return Requirement for Revision
                                </h4>
                                <p className="mt-0.5 text-xs text-slate-500 truncate max-w-xs">
                                    {objSelectedDocument.document_type?.name ||
                                        objSelectedDocument.file_name}
                                </p>
                            </div>
                            <button
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                onClick={() => setBlnRevisionModalOpen(false)}
                                type="button"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-4">
                            <label
                                className="block text-xs font-bold text-slate-700"
                                htmlFor="modal-revision-remarks"
                            >
                                Reason for Revision <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-5 text-slate-900 outline-none transition focus:border-[#0f53b7] focus:bg-white focus:ring-2 focus:ring-blue-100"
                                id="modal-revision-remarks"
                                onChange={(objEvent) => setTxtModalRemarks(objEvent.target.value)}
                                placeholder="Explain what the proponent needs to update, replace, or clarify..."
                                rows={3}
                                value={txtModalRemarks}
                            />
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                                onClick={() => setBlnRevisionModalOpen(false)}
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50"
                                disabled={!txtModalRemarks.trim() || blnReviewing}
                                onClick={() =>
                                    void _saveReview(
                                        'returned_for_revision',
                                        txtModalRemarks.trim(),
                                    )
                                }
                                type="button"
                            >
                                {blnReviewing ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <X className="size-3.5" />
                                )}
                                Confirm Return for Revision
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    ); // end return
} /* end ProposalDocumentsSection */
