import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { ROLES } from '../../../../config/permissions';
import { getMockUser } from '../../../../lib/mockAuth';
import { reviewProposalDocument, viewDocumentBlobForStaff } from '../../../../services/documentStore';
import {
  addChecklistHistoryLog,
  removeChecklistDocument,
  saveProposalChecklistReview,
  uploadChecklistDocument,
  type ChecklistHistoryAction,
  type ChecklistHistoryItem,
  type ChecklistItemStatus,
  type DocumentChecklistItem,
  type ProposalChecklistRecord,
} from '../../../../services/documentChecklistStore';
import type { DocumentReviewStatus } from '../types';
import { formatFileSize, getItemComplianceState } from '../utils';

interface UseChecklistModalsProps {
  activeProposal: ProposalChecklistRecord | null;
  isReadOnly: boolean;
  currentUser: ReturnType<typeof getMockUser>;
  editingItems: DocumentChecklistItem[];
  setEditingItems: React.Dispatch<React.SetStateAction<DocumentChecklistItem[]>>;
  setProposals: React.Dispatch<React.SetStateAction<ProposalChecklistRecord[]>>;
  editingOverallRemarks: string;
  viewMode: 'grid' | 'list';
  setHistoryList: React.Dispatch<React.SetStateAction<ChecklistHistoryItem[]>>;
}

export function useChecklistModals({
  activeProposal,
  isReadOnly,
  currentUser,
  editingItems,
  setEditingItems,
  setProposals,
  editingOverallRemarks,
  viewMode,
  setHistoryList,
}: UseChecklistModalsProps) {
  const [blobMap, setBlobMap] = useState<Record<string, string>>({});

  const [uploadModalItem, setUploadModalItem] = useState<DocumentChecklistItem | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [reviewModalItem, setReviewModalItem] = useState<DocumentChecklistItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<DocumentReviewStatus>('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoadingPreviewBlob, setIsLoadingPreviewBlob] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [versionModalDoc, setVersionModalDoc] = useState<DocumentChecklistItem | null>(null);

  const [previewDoc, setPreviewDoc] = useState<{
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

  useEffect(() => {
    if (viewMode !== 'grid') return;

    const unmappedItems = editingItems.filter(
      (item) => item.uploadedDoc?.id && !blobMap[item.id]
    );

    if (unmappedItems.length === 0) return;

    unmappedItems.forEach(async (item) => {
      if (!item.uploadedDoc?.id) return;
      try {
        const url = await viewDocumentBlobForStaff(item.uploadedDoc.id);
        setBlobMap((prev) => ({ ...prev, [item.id]: url }));
      } catch {
      }
    });
  }, [viewMode, editingItems, blobMap]);

  const handleOpenUploadModal = (item: DocumentChecklistItem) => {
    setUploadModalItem(item);
    setSelectedUploadFile(null);
  };

  const handleCloseUploadModal = () => {
    if (isUploading) return;
    setUploadModalItem(null);
    setSelectedUploadFile(null);
  };

  const validateAndSetFile = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File Format',
        text: 'Only PDF documents (.pdf) can be uploaded. Images, Word documents, and spreadsheets are not supported.',
        confirmButtonColor: '#0f53b7',
      });
      setSelectedUploadFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      Swal.fire({
        icon: 'warning',
        title: 'File Exceeds Limit',
        text: `The selected file is ${sizeMb} MB. Maximum upload file size is 10 MB.`,
        confirmButtonColor: '#0f53b7',
      });
      setSelectedUploadFile(null);
      return;
    }

    setSelectedUploadFile(file);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmUpload = async () => {
    if (!uploadModalItem || !selectedUploadFile || !activeProposal || isReadOnly) return;
    setIsUploading(true);

    try {
      const { uploadedDoc, blobUrl } = await uploadChecklistDocument(
        activeProposal.proposalId,
        uploadModalItem,
        selectedUploadFile,
        activeProposal.referenceNumber
      );

      setBlobMap((prev) => ({ ...prev, [uploadModalItem.id]: blobUrl }));

      if (activeProposal) {
        const log = addChecklistHistoryLog({
          proposalId: activeProposal.proposalId,
          action: uploadModalItem.isPresent ? 'REPLACE' : 'UPLOAD',
          itemName: uploadModalItem.name,
          fileName: selectedUploadFile.name,
          userName: currentUser?.name || 'User',
          userRole: currentUser?.role || ROLES.PROJECT_STAFF,
          details: `Uploaded ${selectedUploadFile.name} (${formatFileSize(selectedUploadFile.size)})`,
        });
        setHistoryList((prev) => [log, ...prev]);
      }

      setEditingItems((prev) => {
        const next = prev.map((item) => {
          if (item.id !== uploadModalItem.id) return item;
          return {
            ...item,
            isPresent: true,
            status: 'Complied' as ChecklistItemStatus,
            uploadedDoc,
            reviewedAt: new Date().toISOString(),
          };
        });
        if (activeProposal) {
          saveProposalChecklistReview(activeProposal.proposalId, next, editingOverallRemarks).catch(() => {});
        }
        return next;
      });

      if (activeProposal) {
        setProposals((prev) =>
          prev.map((p) => {
            if (p.proposalId !== activeProposal.proposalId) return p;
            const updatedItems = p.items.map((it) =>
              it.id === uploadModalItem.id
                ? {
                    ...it,
                    isPresent: true,
                    status: 'Complied' as ChecklistItemStatus,
                    uploadedDoc,
                    reviewedAt: new Date().toISOString(),
                  }
                : it
            );
            const totalRequired = updatedItems.filter((i) => i.isRequired).length || updatedItems.length;
            const compliedCount = updatedItems.filter((i) => (i.isRequired ? i.isPresent : false)).length;
            const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0;
            return {
              ...p,
              items: updatedItems,
              totalRequired,
              compliedCount,
              compliancePercentage,
            };
          })
        );
      }

      Swal.fire({
        icon: 'success',
        title: 'Document Uploaded',
        text: `${selectedUploadFile.name} uploaded and verified successfully.`,
        timer: 1600,
        showConfirmButton: false,
      });

      handleCloseUploadModal();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: err?.message || 'Failed to upload document. Please ensure it is a valid PDF under 10 MB.',
        confirmButtonColor: '#0f53b7',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (item: DocumentChecklistItem) => {
    if (isReadOnly) return;
    const result = await Swal.fire({
      title: 'Remove Attached Document?',
      text: `Are you sure you want to remove ${item.uploadedDoc?.file_name || 'this file'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    if (item.uploadedDoc?.id) {
      await removeChecklistDocument(item.uploadedDoc.id);
    }

    if (activeProposal) {
      const log = addChecklistHistoryLog({
        proposalId: activeProposal.proposalId,
        action: 'REMOVE',
        itemName: item.name,
        fileName: item.uploadedDoc?.file_name,
        userName: currentUser?.name || 'User',
        userRole: currentUser?.role || ROLES.PROJECT_STAFF,
        details: `Removed attached file ${item.uploadedDoc?.file_name || ''}`,
      });
      setHistoryList((prev) => [log, ...prev]);
    }

    setBlobMap((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    setEditingItems((prev) => {
      const next = prev.map((i) => {
        if (i.id !== item.id) return i;
        return {
          ...i,
          isPresent: false,
          status: 'Missing' as ChecklistItemStatus,
          uploadedDoc: null,
        };
      });
      if (activeProposal) {
        saveProposalChecklistReview(activeProposal.proposalId, next, editingOverallRemarks).catch(() => {});
      }
      return next;
    });

    if (activeProposal) {
      setProposals((prev) =>
        prev.map((p) => {
          if (p.proposalId !== activeProposal.proposalId) return p;
          const updatedItems = p.items.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  isPresent: false,
                  status: 'Missing' as ChecklistItemStatus,
                  uploadedDoc: null,
                }
              : it
          );
          const totalRequired = updatedItems.filter((i) => i.isRequired).length || updatedItems.length;
          const compliedCount = updatedItems.filter((i) => (i.isRequired ? i.isPresent : false)).length;
          const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0;
          return {
            ...p,
            items: updatedItems,
            totalRequired,
            compliedCount,
            compliancePercentage,
          };
        })
      );
    }

    Swal.fire({
      icon: 'success',
      title: 'Document Removed',
      text: 'The attachment has been cleared.',
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const handleOpenReviewModal = async (item: DocumentChecklistItem) => {
    setReviewModalItem(item);
    const state = getItemComplianceState(item);
    if (state.type === 'SATISFIED') setReviewDecision('APPROVED');
    else setReviewDecision('RETURNED');
    setReviewRemarks(item.remarks || item.uploadedDoc?.remarks || '');

    if (item.uploadedDoc?.id && !blobMap[item.id]) {
      setIsLoadingPreviewBlob(true);
      try {
        const url = await viewDocumentBlobForStaff(item.uploadedDoc.id);
        setBlobMap((prev) => ({ ...prev, [item.id]: url }));
      } catch {
      } finally {
        setIsLoadingPreviewBlob(false);
      }
    }
  };

  const handleCloseReviewModal = () => {
    if (isSubmittingReview) return;
    setReviewModalItem(null);
    setReviewRemarks('');
  };

  const handleConfirmReview = async () => {
    if (!reviewModalItem || isReadOnly) return;
    const remarksValue = reviewRemarks.trim();

    if (reviewDecision === 'RETURNED' && !remarksValue) {
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

    setIsSubmittingReview(true);
    try {
      let newStatus: ChecklistItemStatus = 'Complied';
      let isPresent = true;
      let action: ChecklistHistoryAction = 'REVIEW_APPROVED';
      let docStatus = 'approved';
      let successTitle = 'Document Verified';
      let successText = 'The requirement has been marked as Verified.';

      if (reviewDecision === 'APPROVED') {
        newStatus = 'Complied';
        isPresent = true;
        action = 'REVIEW_APPROVED';
        docStatus = 'approved';
        successTitle = 'Document Verified';
        successText = 'The requirement has been marked as Verified.';
      } else if (reviewDecision === 'UNDER_REVIEW') {
        newStatus = 'Under Review';
        isPresent = false;
        action = 'REVIEW_UNDER_REVIEW';
        docStatus = 'under_review';
        successTitle = 'Set to In Review';
        successText = 'The document status is set to In Review.';
      } else if (reviewDecision === 'RETURNED') {
        newStatus = 'Needs Revision';
        isPresent = false;
        action = 'REVIEW_RETURNED';
        docStatus = 'returned_for_revision';
        successTitle = 'Returned for Revision';
        successText = 'Rejection remarks saved and document returned for revision.';
      } else {
        newStatus = 'Missing';
        isPresent = false;
        action = 'REVIEW_PENDING';
        docStatus = 'pending';
        successTitle = 'Marked as Pending';
        successText = 'The requirement has been set to Pending.';
      }

      setEditingItems((prev) => {
        const next = prev.map((it) => {
          if (it.id === reviewModalItem.id) {
            return {
              ...it,
              isPresent,
              status: newStatus,
              remarks: remarksValue,
              reviewedAt: new Date().toISOString(),
            };
          }
          return it;
        });
        if (activeProposal) {
          saveProposalChecklistReview(activeProposal.proposalId, next, editingOverallRemarks).catch(() => {});
        }
        return next;
      });

      if (activeProposal) {
        setProposals((prev) =>
          prev.map((p) => {
            if (p.proposalId !== activeProposal.proposalId) return p;
            const updatedItems = p.items.map((it) =>
              it.id === reviewModalItem.id
                ? {
                    ...it,
                    isPresent,
                    status: newStatus,
                    remarks: remarksValue,
                    reviewedAt: new Date().toISOString(),
                  }
                : it
            );
            const totalRequired = updatedItems.filter((i) => i.isRequired).length || updatedItems.length;
            const compliedCount = updatedItems.filter((i) => (i.isRequired ? i.isPresent : false)).length;
            const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0;
            return {
              ...p,
              items: updatedItems,
              totalRequired,
              compliedCount,
              compliancePercentage,
            };
          })
        );
      }

      if (reviewModalItem.uploadedDoc?.id) {
        try {
          await reviewProposalDocument(
            reviewModalItem.uploadedDoc.id,
            docStatus as any,
            remarksValue
          );
        } catch {
        }
      }

      if (activeProposal) {
        const log = addChecklistHistoryLog({
          proposalId: activeProposal.proposalId,
          action,
          itemName: reviewModalItem.name,
          fileName: reviewModalItem.uploadedDoc?.file_name,
          userName: currentUser?.name || 'Focal Evaluator',
          userRole: currentUser?.role || ROLES.FOCAL,
          details: remarksValue ? `Remarks: ${remarksValue}` : `Status updated to ${newStatus}.`,
        });
        setHistoryList((prev) => [log, ...prev]);
      }

      handleCloseReviewModal();
      Swal.fire({
        icon: 'success',
        title: successTitle,
        text: successText,
        timer: 1800,
        showConfirmButton: false,
        customClass: { popup: 'rounded-3xl p-6 font-sans' },
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRestoreArchivedVersion = (item: DocumentChecklistItem, archived: any) => {
    if (!item.uploadedDoc) return;

    const currentDoc = item.uploadedDoc;
    const currentVersionNumber = (currentDoc.archived_versions?.length || 0) + 1;

    const currentAsArchived = {
      id: currentDoc.id,
      version: currentVersionNumber,
      file_name: currentDoc.file_name,
      file_size: currentDoc.file_size,
      file_path: currentDoc.file_path,
      status: currentDoc.status,
      remarks: currentDoc.remarks,
      created_at: currentDoc.created_at,
      archived_at: new Date().toISOString(),
    };

    const updatedArchivedVersions = (currentDoc.archived_versions || [])
      .filter((v: any) => (v.id || v.file_name) !== (archived.id || archived.file_name))
      .concat(currentAsArchived as any);

    const restoredUploadedDoc = {
      ...currentDoc,
      file_name: archived.file_name,
      file_size: archived.file_size,
      file_path: archived.file_path,
      status: archived.status || 'under_review',
      remarks: archived.remarks || '',
      created_at: archived.created_at || new Date().toISOString(),
      archived_versions: updatedArchivedVersions,
    };

    setEditingItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, uploadedDoc: restoredUploadedDoc, status: 'Under Review' } : it))
    );

    if (archived.file_path) {
      setBlobMap((prev) => ({ ...prev, [item.id]: archived.file_path }));
    }

    setVersionModalDoc(null);

    Swal.fire({
      icon: 'success',
      title: 'Version Restored',
      text: `Restored "${archived.file_name}" as active document version.`,
      toast: true,
      position: 'bottom-end',
      timer: 3000,
      showConfirmButton: false,
    });
  };

  const handlePreviewDocument = async (item: DocumentChecklistItem) => {
    if (!item.uploadedDoc) return;

    const docId = item.uploadedDoc.id;
    const liveBlob = blobMap[item.id];

    if (liveBlob) {
      setPreviewDoc({
        isOpen: true,
        title: item.name,
        fileName: item.uploadedDoc.file_name,
        fileSize: item.uploadedDoc.file_size,
        uploadedAt: item.uploadedDoc.created_at || item.uploadedDoc.updated_at,
        status: item.status,
        blobUrl: liveBlob,
        isLoading: false,
        error: null,
        docId,
      });
      return;
    }

    setPreviewDoc({
      isOpen: true,
      title: item.name,
      fileName: item.uploadedDoc.file_name,
      fileSize: item.uploadedDoc.file_size,
      uploadedAt: item.uploadedDoc.created_at || item.uploadedDoc.updated_at,
      status: item.status,
      blobUrl: null,
      isLoading: true,
      error: null,
      docId,
    });

    if (docId) {
      try {
        const blobUrl = await viewDocumentBlobForStaff(docId);
        setBlobMap((prev) => ({ ...prev, [item.id]: blobUrl }));
        setPreviewDoc((prev) => ({
          ...prev,
          blobUrl,
          isLoading: false,
        }));
      } catch {
        setPreviewDoc((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Could not load server PDF preview.',
        }));
      }
    } else if (item.uploadedDoc.file_path) {
      setPreviewDoc((prev) => ({
        ...prev,
        blobUrl: item.uploadedDoc!.file_path,
        isLoading: false,
      }));
    }
  };

  const handleDownloadPreviewFile = () => {
    if (!previewDoc.blobUrl) return;
    const link = document.createElement('a');
    link.href = previewDoc.blobUrl;
    link.download = previewDoc.fileName || `${previewDoc.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenPreviewNewTab = () => {
    if (!previewDoc.blobUrl) return;
    window.open(previewDoc.blobUrl, '_blank');
  };

  return {
    blobMap,
    uploadModalItem,
    selectedUploadFile,
    setSelectedUploadFile,
    isUploading,
    isDragging,
    setIsDragging,
    fileInputRef,
    handleOpenUploadModal,
    handleCloseUploadModal,
    validateAndSetFile,
    handleDropFile,
    handleConfirmUpload,
    handleRemoveFile,
    reviewModalItem,
    reviewDecision,
    setReviewDecision,
    reviewRemarks,
    setReviewRemarks,
    isSubmittingReview,
    isLoadingPreviewBlob,
    isFullscreen,
    setIsFullscreen,
    handleOpenReviewModal,
    handleCloseReviewModal,
    handleConfirmReview,
    versionModalDoc,
    setVersionModalDoc,
    handleRestoreArchivedVersion,
    previewDoc,
    setPreviewDoc,
    handlePreviewDocument,
    handleDownloadPreviewFile,
    handleOpenPreviewNewTab,
  };
}
