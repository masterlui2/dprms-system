/**
 * System: DPRMS
 * Purpose: Coordinate checklist modals state and interactions.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { ROLES } from '../../../../config/permissions';
import { getMockUser } from '../../../../lib/mock_auth';
import
{
    addChecklistHistoryLog,
    calculateChecklistDocumentCounts,
    removeChecklistDocument,
    saveProposalChecklistReview,
    uploadChecklistDocument,
    type ChecklistHistoryAction,
    type ChecklistHistoryItem,
    type ChecklistItemStatus,
    type DocumentChecklistItem,
    type ProposalChecklistRecord,
} from '../../../../services/document_checklist_store';
import
{
    fetchDocumentBlobForStaff,
    reviewProposalDocument,
    viewDocumentBlobForStaff,
} from '../../../../services/document_store';
import { downloadBlob, prepareDownloadDirectory } from '../../../../services/download_manager';
import { reportError } from '../../../../utils/error_reporting';
import type { DocumentReviewStatus } from '../types';
import { formatFileSize, getItemComplianceState } from '../utils';

interface UseChecklistModalsProps
{
    objActiveProposal: ProposalChecklistRecord | null;
    blnIsReadOnly: boolean;
    objCurrentUser: ReturnType<typeof getMockUser>;
    setEditingItems: React.Dispatch<React.SetStateAction<DocumentChecklistItem[]>>;
    setProposals: React.Dispatch<React.SetStateAction<ProposalChecklistRecord[]>>;
    txtEditingOverallRemarks: string;
    setHistoryList: React.Dispatch<React.SetStateAction<ChecklistHistoryItem[]>>;
}

/** Coordinate checklist modals state and effects. */
export function useChecklistModals({
    objActiveProposal,
    blnIsReadOnly,
    objCurrentUser,
    setEditingItems,
    setProposals,
    txtEditingOverallRemarks,
    setHistoryList,
}: UseChecklistModalsProps)
{
    const [objBlobMap, setObjBlobMap] = useState<Record<string, string>>({});

    const [objUploadModalItem, setObjUploadModalItem] = useState<DocumentChecklistItem | null>(
        null,
    );
    const [objSelectedUploadFile, setObjSelectedUploadFile] = useState<File | null>(null);
    const [blnIsUploading, setBlnIsUploading] = useState(false);
    const [blnIsDragging, setBlnIsDragging] = useState(false);
    const objFileInputRef = useRef<HTMLInputElement | null>(null);

    const [objReviewModalItem, setObjReviewModalItem] = useState<DocumentChecklistItem | null>(
        null,
    );
    const [strReviewDecision, setStrReviewDecision] = useState<DocumentReviewStatus>('APPROVED');
    const [txtReviewRemarks, setTxtReviewRemarks] = useState('');
    const [blnIsSubmittingReview, setBlnIsSubmittingReview] = useState(false);
    const [blnIsLoadingPreviewBlob, setBlnIsLoadingPreviewBlob] = useState(false);
    const [blnIsFullscreen, setBlnIsFullscreen] = useState(false);

    const [objVersionModalDoc, setObjVersionModalDoc] = useState<DocumentChecklistItem | null>(
        null,
    );

    const [objPreviewDoc, setObjPreviewDoc] = useState<{
        isOpen: boolean;
        title: string;
        fileName?: string;
        fileSize?: number | null;
        uploadedAt?: string | null;
        status?: string;
        blobUrl?: string | null;
        isLoading: boolean;
        error: string | null;
        docId?: number | null;
    }>({
        isOpen: false,
        title: '',
        isLoading: false,
        error: null,
    });

    useEffect(() =>
    {
        setObjBlobMap({});
        setObjReviewModalItem(null);
        setObjVersionModalDoc(null);
    }, [objActiveProposal?.proposalId]);

    /** Handle open upload modal. */
    const _handleOpenUploadModal = (objItem: DocumentChecklistItem) =>
    {
        setObjUploadModalItem(objItem);
        setObjSelectedUploadFile(null);
    };

    /** Handle close upload modal. */
    const _handleCloseUploadModal = () =>
    {
        if (blnIsUploading)
        {
            return;
        }
        setObjUploadModalItem(null);
        setObjSelectedUploadFile(null);
    };

    /** Validate and set file. */
    const _validateAndSetFile = (objFile: File) =>
    {
        const blnIsPdf =
            objFile.type === 'application/pdf' || objFile.name.toLowerCase().endsWith('.pdf');
        if (!blnIsPdf)
        {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid File Format',
                text: 'Only PDF documents (.pdf) can be uploaded. Images, Word documents, and spreadsheets are not supported.',
                confirmButtonColor: '#0f53b7',
            });
            setObjSelectedUploadFile(null);
            return;
        }

        if (objFile.size > 10 * 1024 * 1024)
        {
            const strSizeMb = (objFile.size / (1024 * 1024)).toFixed(1);
            Swal.fire({
                icon: 'warning',
                title: 'File Exceeds Limit',
                text: `The selected file is ${strSizeMb} MB. Maximum upload file size is 10 MB.`,
                confirmButtonColor: '#0f53b7',
            });
            setObjSelectedUploadFile(null);
            return;
        }

        setObjSelectedUploadFile(objFile);
    }; /* end _validateAndSetFile */

    /** Handle drop file. */
    const _handleDropFile = (objEvent: React.DragEvent) =>
    {
        objEvent.preventDefault();
        setBlnIsDragging(false);
        if (objEvent.dataTransfer.files && objEvent.dataTransfer.files[0])
        {
            _validateAndSetFile(objEvent.dataTransfer.files[0]);
        }
    };

    /** Handle confirm upload. */
    const _handleConfirmUpload = async () =>
    {
        if (!objUploadModalItem || !objSelectedUploadFile || !objActiveProposal || blnIsReadOnly)
        {
            return;
        }
        setBlnIsUploading(true);

        try
        {
            const { uploadedDoc: objUploadedDoc, blobUrl: strBlobUrl } =
                await uploadChecklistDocument(
                    objActiveProposal.proposalId,
                    objUploadModalItem,
                    objSelectedUploadFile,
                    objActiveProposal.referenceNumber,
                );

            setObjBlobMap((objPrevious) => ({
                ...objPrevious,
                [objUploadModalItem.id]: strBlobUrl,
            }));

            if (objActiveProposal)
            {
                const objLog = addChecklistHistoryLog({
                    proposalId: objActiveProposal.proposalId,
                    action: objUploadModalItem.isPresent ? 'REPLACE' : 'UPLOAD',
                    itemName: objUploadModalItem.name,
                    fileName: objSelectedUploadFile.name,
                    userName: objCurrentUser?.name || 'User',
                    userRole: objCurrentUser?.role || ROLES.PROJECT_STAFF,
                    details: `Uploaded ${objSelectedUploadFile.name} (${formatFileSize(objSelectedUploadFile.size)})`,
                });
                setHistoryList((arrPrevious) => [objLog, ...arrPrevious]);
            }

            setEditingItems((arrPrevious) =>
            {
                const arrNext = arrPrevious.map((objItem) =>
                {
                    if (objItem.id !== objUploadModalItem.id)
                    {
                        return objItem;
                    }
                    return {
                        ...objItem,
                        isPresent: true,
                        status: 'Complied' as ChecklistItemStatus,
                        uploadedDoc: objUploadedDoc,
                        reviewedAt: new Date().toISOString(),
                    };
                });
                if (objActiveProposal)
                {
                    saveProposalChecklistReview(
                        objActiveProposal.proposalId,
                        arrNext,
                        txtEditingOverallRemarks,
                    ).catch(() => { });
                }
                return arrNext;
            });

            if (objActiveProposal)
            {
                setProposals((arrPrevious) =>
                    arrPrevious.map(
                        (objItem) =>
                        {
                            if (objItem.proposalId !== objActiveProposal.proposalId)
                            {
                                return objItem;
                            }
                            const arrUpdatedItems = objItem.items.map((objIt) =>
                                objIt.id === objUploadModalItem.id
                                    ? {
                                        ...objIt,
                                        isPresent: true,
                                        status: 'Complied' as ChecklistItemStatus,
                                        uploadedDoc: objUploadedDoc,
                                        reviewedAt: new Date().toISOString(),
                                    }
                                    : objIt,
                            );
                            const objCounts = calculateChecklistDocumentCounts(arrUpdatedItems);
                            const {
                                totalRequired: intTotalRequired,
                                uploadedCount: intUploadedCount,
                                remainingCount: intRemainingCount,
                                compliedCount: intCompliedCount,
                            } = objCounts;
                            const dblCompliancePercentage =
                                intTotalRequired > 0
                                    ? Math.round((intCompliedCount / intTotalRequired) * 100)
                                    : 0;
                            return {
                                ...objItem,
                                items: arrUpdatedItems,
                                totalRequired: intTotalRequired,
                                uploadedCount: intUploadedCount,
                                remainingCount: intRemainingCount,
                                compliedCount: intCompliedCount,
                                compliancePercentage: dblCompliancePercentage,
                            };
                        } /* end _handleConfirmUpload */,
                    ),
                );
            } /* end if */

            Swal.fire({
                icon: 'success',
                title: 'Document Uploaded',
                text: `${objSelectedUploadFile.name} uploaded and verified successfully.`,
                timer: 1600,
                showConfirmButton: false,
            });

            _handleCloseUploadModal();
        } /* end try */ catch (errError: any)
        {
            reportError(errError, 'use_checklist_modals: handle confirm upload failed.');

            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text:
                    errError?.message ||
                    'Failed to upload document. Please ensure it is a valid PDF under 10 MB.',
                confirmButtonColor: '#0f53b7',
            });
        } finally
        {
            setBlnIsUploading(false);
        }
    }; /* end _handleConfirmUpload */

    /** Handle remove file. */
    const _handleRemoveFile = async (objItem: DocumentChecklistItem) =>
    {
        try
        {
            if (blnIsReadOnly)
            {
                return;
            }
            const objResult = await Swal.fire({
                title: 'Remove Attached Document?',
                text: `Are you sure you want to remove ${objItem.uploadedDoc?.file_name || 'this file'}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e11d48',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, remove',
                cancelButtonText: 'Cancel',
            });

            if (!objResult.isConfirmed)
            {
                return;
            }

            if (objItem.uploadedDoc?.id)
            {
                await removeChecklistDocument(objItem.uploadedDoc.id);
            }

            if (objActiveProposal)
            {
                const objLog = addChecklistHistoryLog({
                    proposalId: objActiveProposal.proposalId,
                    action: 'REMOVE',
                    itemName: objItem.name,
                    fileName: objItem.uploadedDoc?.file_name,
                    userName: objCurrentUser?.name || 'User',
                    userRole: objCurrentUser?.role || ROLES.PROJECT_STAFF,
                    details: `Removed attached file ${objItem.uploadedDoc?.file_name || ''}`,
                });
                setHistoryList((arrPrevious) => [objLog, ...arrPrevious]);
            }

            setObjBlobMap((objPrevious) =>
            {
                const objNext = { ...objPrevious };
                delete objNext[objItem.id];
                return objNext;
            });

            setEditingItems((arrPrevious) =>
            {
                const arrNext = arrPrevious.map((objIndex) =>
                {
                    if (objIndex.id !== objItem.id)
                    {
                        return objIndex;
                    }
                    return {
                        ...objIndex,
                        isPresent: false,
                        status: 'Missing' as ChecklistItemStatus,
                        uploadedDoc: null,
                    };
                });
                if (objActiveProposal)
                {
                    saveProposalChecklistReview(
                        objActiveProposal.proposalId,
                        arrNext,
                        txtEditingOverallRemarks,
                    ).catch(() => { });
                }
                return arrNext;
            });

            if (objActiveProposal)
            {
                setProposals((arrPrevious) =>
                    arrPrevious.map(
                        (objItemValue) =>
                        {
                            if (objItemValue.proposalId !== objActiveProposal.proposalId)
                            {
                                return objItemValue;
                            }
                            const arrUpdatedItems = objItemValue.items.map((objIt) =>
                                objIt.id === objItem.id
                                    ? {
                                        ...objIt,
                                        isPresent: false,
                                        status: 'Missing' as ChecklistItemStatus,
                                        uploadedDoc: null,
                                    }
                                    : objIt,
                            );
                            const objCounts = calculateChecklistDocumentCounts(arrUpdatedItems);
                            const {
                                totalRequired: intTotalRequired,
                                uploadedCount: intUploadedCount,
                                remainingCount: intRemainingCount,
                                compliedCount: intCompliedCount,
                            } = objCounts;
                            const dblCompliancePercentage =
                                intTotalRequired > 0
                                    ? Math.round((intCompliedCount / intTotalRequired) * 100)
                                    : 0;
                            return {
                                ...objItemValue,
                                items: arrUpdatedItems,
                                totalRequired: intTotalRequired,
                                uploadedCount: intUploadedCount,
                                remainingCount: intRemainingCount,
                                compliedCount: intCompliedCount,
                                compliancePercentage: dblCompliancePercentage,
                            };
                        } /* end _handleRemoveFile */,
                    ),
                );
            } /* end if */

            Swal.fire({
                icon: 'success',
                title: 'Document Removed',
                text: 'The attachment has been cleared.',
                timer: 1400,
                showConfirmButton: false,
            });
        } catch (errOperation)
        {
            /* end try */

            reportError(errOperation, 'use_checklist_modals: handle remove file failed.');
            throw errOperation;
        }
    }; /* end _handleRemoveFile */

    /** Handle open review modal. */
    const _handleOpenReviewModal = async (objItem: DocumentChecklistItem) =>
    {
        setObjReviewModalItem(objItem);
        const objState = getItemComplianceState(objItem);
        if (objState.type === 'SATISFIED')
        {
            setStrReviewDecision('APPROVED');
        } else
        {
            setStrReviewDecision('RETURNED');
        }
        setTxtReviewRemarks(objItem.remarks || objItem.uploadedDoc?.remarks || '');

        if (objItem.uploadedDoc?.id && !objBlobMap[objItem.id])
        {
            setBlnIsLoadingPreviewBlob(true);
            try
            {
                const strUrl = await viewDocumentBlobForStaff(objItem.uploadedDoc.id);
                setObjBlobMap((objPrevious) => ({ ...objPrevious, [objItem.id]: strUrl }));
            } catch (errCaught)
            {
                reportError(errCaught, 'use_checklist_modals: handle open review modal failed.');
            } finally
            {
                setBlnIsLoadingPreviewBlob(false);
            }
        }
    }; /* end _handleOpenReviewModal */

    /** Handle close review modal. */
    const _handleCloseReviewModal = () =>
    {
        if (blnIsSubmittingReview)
        {
            return;
        }
        setObjReviewModalItem(null);
        setTxtReviewRemarks('');
    };

    /** Handle confirm review. */
    const _handleConfirmReview = async () =>
    {
        if (!objReviewModalItem || blnIsReadOnly)
        {
            return;
        }
        const txtRemarksValue = txtReviewRemarks.trim();

        if (strReviewDecision === 'RETURNED' && !txtRemarksValue)
        {
            Swal.fire({
                icon: 'warning',
                title: 'Rejection Remarks Required',
                text: 'Please enter specific remarks explaining why this document is returned for revision before submitting.',
                confirmButtonColor: '#0f53b7',
                customClass: {
                    popup: 'rounded-3xl p-6 font-sans',
                    confirmButton: 'rounded-xl px-4 py-2 font-bold text-xs',
                },
            });
            return;
        }

        setBlnIsSubmittingReview(true);
        try
        {
            let strNewStatus: ChecklistItemStatus = 'Complied';
            let blnIsPresent = true;
            let strAction: ChecklistHistoryAction = 'REVIEW_APPROVED';
            let strDocStatus = 'approved';
            let strSuccessTitle = 'Document Verified';
            let strSuccessText = 'The requirement has been marked as Verified.';

            if (strReviewDecision === 'APPROVED')
            {
                strNewStatus = 'Complied';
                blnIsPresent = true;
                strAction = 'REVIEW_APPROVED';
                strDocStatus = 'approved';
                strSuccessTitle = 'Document Verified';
                strSuccessText = 'The requirement has been marked as Verified.';
            } else if (strReviewDecision === 'UNDER_REVIEW')
            {
                strNewStatus = 'Under Review';
                blnIsPresent = false;
                strAction = 'REVIEW_UNDER_REVIEW';
                strDocStatus = 'under_review';
                strSuccessTitle = 'Set to In Review';
                strSuccessText = 'The document status is set to In Review.';
            } else if (strReviewDecision === 'RETURNED')
            {
                strNewStatus = 'Needs Revision';
                blnIsPresent = false;
                strAction = 'REVIEW_RETURNED';
                strDocStatus = 'returned_for_revision';
                strSuccessTitle = 'Returned for Revision';
                strSuccessText = 'Rejection remarks saved and document returned for revision.';
            } else
            {
                strNewStatus = 'Missing';
                blnIsPresent = false;
                strAction = 'REVIEW_PENDING';
                strDocStatus = 'pending';
                strSuccessTitle = 'Marked as Pending';
                strSuccessText = 'The requirement has been set to Pending.';
            }

            setEditingItems((arrPrevious) =>
            {
                const arrNext = arrPrevious.map((objIt) =>
                {
                    if (objIt.id === objReviewModalItem.id)
                    {
                        return {
                            ...objIt,
                            isPresent: blnIsPresent,
                            status: strNewStatus,
                            remarks: txtRemarksValue,
                            reviewedAt: new Date().toISOString(),
                        };
                    }
                    return objIt;
                });
                if (objActiveProposal)
                {
                    saveProposalChecklistReview(
                        objActiveProposal.proposalId,
                        arrNext,
                        txtEditingOverallRemarks,
                    ).catch(() => { });
                }
                return arrNext;
            });

            if (objActiveProposal)
            {
                setProposals((arrPrevious) =>
                    arrPrevious.map(
                        (objItem) =>
                        {
                            if (objItem.proposalId !== objActiveProposal.proposalId)
                            {
                                return objItem;
                            }
                            const arrUpdatedItems = objItem.items.map((objIt) =>
                                objIt.id === objReviewModalItem.id
                                    ? {
                                        ...objIt,
                                        isPresent: blnIsPresent,
                                        status: strNewStatus,
                                        remarks: txtRemarksValue,
                                        reviewedAt: new Date().toISOString(),
                                    }
                                    : objIt,
                            );
                            const objCounts = calculateChecklistDocumentCounts(arrUpdatedItems);
                            const {
                                totalRequired: intTotalRequired,
                                uploadedCount: intUploadedCount,
                                remainingCount: intRemainingCount,
                                compliedCount: intCompliedCount,
                            } = objCounts;
                            const dblCompliancePercentage =
                                intTotalRequired > 0
                                    ? Math.round((intCompliedCount / intTotalRequired) * 100)
                                    : 0;
                            return {
                                ...objItem,
                                items: arrUpdatedItems,
                                totalRequired: intTotalRequired,
                                uploadedCount: intUploadedCount,
                                remainingCount: intRemainingCount,
                                compliedCount: intCompliedCount,
                                compliancePercentage: dblCompliancePercentage,
                            };
                        } /* end _handleConfirmReview */,
                    ),
                );
            } /* end if */

            if (objReviewModalItem.uploadedDoc?.id)
            {
                try
                {
                    await reviewProposalDocument(
                        objReviewModalItem.uploadedDoc.id,
                        strDocStatus as any,
                        txtRemarksValue,
                    );
                } catch (errCaught)
                {
                    reportError(errCaught, 'use_checklist_modals: handle confirm review failed.');
                }
            }

            if (objActiveProposal)
            {
                const objLog = addChecklistHistoryLog({
                    proposalId: objActiveProposal.proposalId,
                    action: strAction,
                    itemName: objReviewModalItem.name,
                    fileName: objReviewModalItem.uploadedDoc?.file_name,
                    userName: objCurrentUser?.name || 'Focal Evaluator',
                    userRole: objCurrentUser?.role || ROLES.FOCAL,
                    details: txtRemarksValue
                        ? `Remarks: ${txtRemarksValue}`
                        : `Status updated to ${strNewStatus}.`,
                });
                setHistoryList((arrPrevious) => [objLog, ...arrPrevious]);
            }

            _handleCloseReviewModal();
            Swal.fire({
                icon: 'success',
                title: strSuccessTitle,
                text: strSuccessText,
                timer: 1800,
                showConfirmButton: false,
                customClass: { popup: 'rounded-3xl p-6 font-sans' },
            });
        } /* end try */ finally
        {
            setBlnIsSubmittingReview(false);
        }
    }; /* end _handleConfirmReview */

    /** Handle restore archived version. */
    const _handleRestoreArchivedVersion = (objItem: DocumentChecklistItem, objArchived: any) =>
    {
        if (!objItem.uploadedDoc)
        {
            return;
        }

        const objCurrentDoc = objItem.uploadedDoc;
        const intCurrentVersionNumber = (objCurrentDoc.archived_versions?.length || 0) + 1;

        const objCurrentAsArchived = {
            id: objCurrentDoc.id,
            version: intCurrentVersionNumber,
            file_name: objCurrentDoc.file_name,
            file_size: objCurrentDoc.file_size,
            file_path: objCurrentDoc.file_path,
            status: objCurrentDoc.status,
            remarks: objCurrentDoc.remarks,
            created_at: objCurrentDoc.created_at,
            archived_at: new Date().toISOString(),
        };

        const arrUpdatedArchivedVersions = (objCurrentDoc.archived_versions || [])
            .filter(
                (objValue: any) =>
                    (objValue.id || objValue.file_name) !==
                    (objArchived.id || objArchived.file_name),
            )
            .concat(objCurrentAsArchived as any);

        const objRestoredUploadedDoc = {
            ...objCurrentDoc,
            file_name: objArchived.file_name,
            file_size: objArchived.file_size,
            file_path: objArchived.file_path,
            status: objArchived.status || 'under_review',
            remarks: objArchived.remarks || '',
            created_at: objArchived.created_at || new Date().toISOString(),
            archived_versions: arrUpdatedArchivedVersions,
        };

        setEditingItems((arrPrevious) =>
            arrPrevious.map((objIt) =>
                objIt.id === objItem.id
                    ? { ...objIt, uploadedDoc: objRestoredUploadedDoc, status: 'Under Review' }
                    : objIt,
            ),
        );

        if (objArchived.file_path)
        {
            setObjBlobMap((objPrevious) => ({
                ...objPrevious,
                [objItem.id]: objArchived.file_path,
            }));
        }

        setObjVersionModalDoc(null);

        Swal.fire({
            icon: 'success',
            title: 'Version Restored',
            text: `Restored "${objArchived.file_name}" as active document version.`,
            toast: true,
            position: 'bottom-end',
            timer: 3000,
            showConfirmButton: false,
        });
    }; /* end _handleRestoreArchivedVersion */

    /** Handle preview document. */
    const _handlePreviewDocument = async (objItem: DocumentChecklistItem) =>
    {
        if (!objItem.uploadedDoc)
        {
            return;
        }

        const intDocId = objItem.uploadedDoc.id;
        const strLiveBlob = objBlobMap[objItem.id];

        if (strLiveBlob)
        {
            setObjPreviewDoc({
                isOpen: true,
                title: objItem.name,
                fileName: objItem.uploadedDoc.file_name,
                fileSize: objItem.uploadedDoc.file_size,
                uploadedAt: objItem.uploadedDoc.created_at || objItem.uploadedDoc.updated_at,
                status: objItem.status,
                blobUrl: strLiveBlob,
                isLoading: false,
                error: null,
                docId: intDocId,
            });
            return;
        }

        setObjPreviewDoc({
            isOpen: true,
            title: objItem.name,
            fileName: objItem.uploadedDoc.file_name,
            fileSize: objItem.uploadedDoc.file_size,
            uploadedAt: objItem.uploadedDoc.created_at || objItem.uploadedDoc.updated_at,
            status: objItem.status,
            blobUrl: null,
            isLoading: true,
            error: null,
            docId: intDocId,
        });

        if (intDocId)
        {
            try
            {
                const strBlobUrl = await viewDocumentBlobForStaff(intDocId);
                setObjBlobMap((objPrevious) => ({ ...objPrevious, [objItem.id]: strBlobUrl }));
                setObjPreviewDoc((objPrevious) => ({
                    ...objPrevious,
                    blobUrl: strBlobUrl,
                    isLoading: false,
                }));
            } catch (errCaught)
            {
                reportError(errCaught, 'use_checklist_modals: handle preview document failed.');

                setObjPreviewDoc((objPrevious) => ({
                    ...objPrevious,
                    isLoading: false,
                    error: 'Could not load server PDF preview.',
                }));
            }
        } else if (objItem.uploadedDoc.file_path)
        {
            setObjPreviewDoc((objPrevious) => ({
                ...objPrevious,
                blobUrl: objItem.uploadedDoc!.file_path,
                isLoading: false,
            }));
        }
    }; /* end _handlePreviewDocument */

    /** Handle download preview file. */
    const _handleDownloadPreviewFile = async () =>
    {
        const strReviewBlobUrl = objReviewModalItem ? objBlobMap[objReviewModalItem.id] : undefined;
        const strSourceUrl = objPreviewDoc.blobUrl || strReviewBlobUrl;
        const strFileName = objPreviewDoc.blobUrl
            ? objPreviewDoc.fileName || `${objPreviewDoc.title}.pdf`
            : objReviewModalItem?.uploadedDoc?.file_name ||
            `${objReviewModalItem?.name || 'document'}.pdf`;
        if (!strSourceUrl || !objCurrentUser || !objActiveProposal)
        {
            return;
        }
        try
        {
            const objDirectory = await prepareDownloadDirectory(objCurrentUser);
            const objResponse = await fetch(strSourceUrl);
            await downloadBlob({
                directory: objDirectory,
                blob: await objResponse.blob(),
                fileName: strFileName,
                program: objActiveProposal.program,
                user: objCurrentUser,
            });
        } catch (errError)
        {
            reportError(errError, 'use_checklist_modals: handle download preview file failed.');

            reportError(errError, 'Failed to download checklist document:');
            void Swal.fire({
                icon: 'error',
                title: 'Download Failed',
                text: 'The document could not be saved. Please try again.',
                confirmButtonColor: '#0f53b7',
            });
        }
    }; /* end _handleDownloadPreviewFile */

    /** Handle download item. */
    const _handleDownloadItem = async (objItem: DocumentChecklistItem) =>
    {
        if (!objItem.uploadedDoc || !objCurrentUser || !objActiveProposal)
        {
            return;
        }
        try
        {
            const objDirectory = await prepareDownloadDirectory(objCurrentUser);
            const strLocalUrl =
                objBlobMap[objItem.id] ||
                (objItem.uploadedDoc.file_path?.startsWith('blob:')
                    ? objItem.uploadedDoc.file_path
                    : undefined);
            const objBlob = strLocalUrl
                ? await (await fetch(strLocalUrl)).blob()
                : await fetchDocumentBlobForStaff(objItem.uploadedDoc.id);
            await downloadBlob({
                directory: objDirectory,
                blob: objBlob,
                fileName: objItem.uploadedDoc.file_name,
                program: objActiveProposal.program,
                user: objCurrentUser,
            });
        } catch (errError)
        {
            reportError(errError, 'use_checklist_modals: handle download item failed.');

            reportError(errError, 'Failed to download checklist document:');
            void Swal.fire({
                icon: 'error',
                title: 'Download Failed',
                text: 'The document could not be saved. Please try again.',
                confirmButtonColor: '#0f53b7',
            });
        }
    }; /* end _handleDownloadItem */

    /** Handle open preview new tab. */
    const _handleOpenPreviewNewTab = () =>
    {
        if (!objPreviewDoc.blobUrl)
        {
            return;
        }
        window.open(objPreviewDoc.blobUrl, '_blank');
    };

    return {
        blobMap: objBlobMap,
        uploadModalItem: objUploadModalItem,
        selectedUploadFile: objSelectedUploadFile,
        setSelectedUploadFile: setObjSelectedUploadFile,
        isUploading: blnIsUploading,
        isDragging: blnIsDragging,
        setIsDragging: setBlnIsDragging,
        fileInputRef: objFileInputRef,
        handleOpenUploadModal: _handleOpenUploadModal,
        handleCloseUploadModal: _handleCloseUploadModal,
        validateAndSetFile: _validateAndSetFile,
        handleDropFile: _handleDropFile,
        handleConfirmUpload: _handleConfirmUpload,
        handleRemoveFile: _handleRemoveFile,
        reviewModalItem: objReviewModalItem,
        reviewDecision: strReviewDecision,
        setReviewDecision: setStrReviewDecision,
        reviewRemarks: txtReviewRemarks,
        setReviewRemarks: setTxtReviewRemarks,
        isSubmittingReview: blnIsSubmittingReview,
        isLoadingPreviewBlob: blnIsLoadingPreviewBlob,
        isFullscreen: blnIsFullscreen,
        setIsFullscreen: setBlnIsFullscreen,
        handleOpenReviewModal: _handleOpenReviewModal,
        handleCloseReviewModal: _handleCloseReviewModal,
        handleConfirmReview: _handleConfirmReview,
        versionModalDoc: objVersionModalDoc,
        setVersionModalDoc: setObjVersionModalDoc,
        handleRestoreArchivedVersion: _handleRestoreArchivedVersion,
        previewDoc: objPreviewDoc,
        setPreviewDoc: setObjPreviewDoc,
        handlePreviewDocument: _handlePreviewDocument,
        handleDownloadPreviewFile: _handleDownloadPreviewFile,
        handleDownloadItem: _handleDownloadItem,
        handleOpenPreviewNewTab: _handleOpenPreviewNewTab,
    };
} /* end useChecklistModals */
