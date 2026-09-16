import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { downloadBlob } from '../../../../services/downloadManager';
import { ROLES } from '../../../../config/permissions';
import { getMockUser } from '../../../../lib/mockAuth';
import {
  addChecklistHistoryLog,
  calculateChecklistDocumentCounts,
  fetchChecklistProjectSummaries,
  fetchProposalChecklist,
  getChecklistHistory,
  saveProposalChecklistReview,
  GIA_STAGES,
  SETUP_SETS,
  type ChecklistHistoryItem,
  type ChecklistItemStatus,
  type DocumentChecklistItem,
  type ProposalChecklistRecord,
} from '../../../../services/documentChecklistStore';
import type { ChecklistCategoryItem } from '../types';
import { getItemComplianceState } from '../utils';

export function useDocumentChecklistData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = getMockUser();

  const isRpmo = currentUser?.role === ROLES.RPMO;
  const isDirector = currentUser?.role === ROLES.PROVINCIAL_DIRECTOR;
  const isFocal = currentUser?.role === ROLES.FOCAL;
  const isStaff = currentUser?.role === ROLES.PROJECT_STAFF;
  const isAdmin = currentUser?.role === ROLES.SYSTEM_ADMIN;

  const isReadOnly = isRpmo || isDirector;
  const canUpload = !isReadOnly && (isStaff || isFocal || isAdmin);
  const canReview = !isReadOnly && (isFocal || isAdmin);
  const canMarkComplete = !isReadOnly && (isFocal || isAdmin);
  const canViewHistory = isStaff || isFocal || isDirector || isAdmin;

  const userProgram = currentUser?.program as 'SETUP' | 'GIA' | undefined;

  const activeProgram: 'SETUP' | 'GIA' = useMemo(() => {
    if ((isFocal || isStaff) && userProgram) {
      return userProgram === 'GIA' ? 'GIA' : 'SETUP';
    }
    const param = searchParams.get('program')?.toUpperCase();
    if (param === 'GIA') return 'GIA';
    if (param === 'SETUP') return 'SETUP';
    return userProgram || 'SETUP';
  }, [searchParams, isFocal, isStaff, userProgram]);

  const [proposals, setProposals] = useState<ProposalChecklistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);

  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(() => {
    const fromUrl = searchParams.get('proposalId') || searchParams.get('proposal');
    return fromUrl ? parseInt(fromUrl, 10) || null : null;
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const fromUrl = searchParams.get('stage') || searchParams.get('set') || searchParams.get('category');
    if (fromUrl) return fromUrl;
    return activeProgram === 'GIA' ? '01' : 'SET1';
  });
  const [statusTab, setStatusTab] = useState<
    'ALL' | 'VERIFIED' | 'UNDER_REVIEW' | 'RETURNED' | 'PENDING' | 'UPLOADED'
  >('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [viewMode, setViewModeState] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('dprms_checklist_view_mode');
    if (saved === 'grid' || saved === 'list') return saved;
    const urlParam = searchParams.get('view');
    if (urlParam === 'grid' || urlParam === 'list') return urlParam;
    return 'list';
  });

  const setViewMode = (mode: 'grid' | 'list') => {
    setViewModeState(mode);
    localStorage.setItem('dprms_checklist_view_mode', mode);
    const next = new URLSearchParams(searchParams);
    next.set('view', mode);
    setSearchParams(next, { replace: true });
  };
  const [searchQuery, setSearchQuery] = useState('');

  const [editingItems, setEditingItems] = useState<DocumentChecklistItem[]>([]);
  const [editingOverallRemarks, setEditingOverallRemarks] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isCompletingReview, setIsCompletingReview] = useState(false);
  const lastSavedPayloadRef = useRef<string>('');
  const hydratedProposalIdRef = useRef<number | null>(null);
  const detailRequestIdRef = useRef(0);

  const [historyList, setHistoryList] = useState<ChecklistHistoryItem[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchChecklistProjectSummaries(activeProgram);
      setProposals((current) =>
        data.map((summary) => {
          const loaded = current.find(
            (proposal) =>
              proposal.proposalId === summary.proposalId && proposal.detailsLoaded,
          );
          return loaded
            ? {
                ...loaded,
                ...summary,
                items: loaded.items,
                overallRemarks: loaded.overallRemarks,
                detailsLoaded: true,
              }
            : summary;
        }),
      );
    } catch (err) {
      setLoadError((err as Error)?.message || 'Failed to load document checklists');
    } finally {
      setIsLoading(false);
    }
  }, [activeProgram]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const programProposals = useMemo(() => {
    return proposals.filter(
      (p) =>
        p.program === activeProgram &&
        (p.status?.toUpperCase() === 'APPROVED' || p.status === 'Approved'),
    );
  }, [proposals, activeProgram]);

  const selectedProposalSummary = useMemo(() => {
    if (!selectedProposalId) return null;
    return programProposals.find((p) => p.proposalId === selectedProposalId) || null;
  }, [programProposals, selectedProposalId]);

  const activeProposal = selectedProposalSummary?.detailsLoaded
    ? selectedProposalSummary
    : null;

  const loadProposalDetails = useCallback(
    async (proposalId: number, summary?: ProposalChecklistRecord | null) => {
      const requestId = ++detailRequestIdRef.current;
      setIsDetailLoading(true);
      setDetailLoadError(null);
      try {
        const loaded = await fetchProposalChecklist(proposalId, summary || undefined);
        if (requestId !== detailRequestIdRef.current) return;
        if (loaded.program !== activeProgram) {
          throw new Error('This project is not available in the selected program.');
        }
        setProposals((current) => {
          const exists = current.some((proposal) => proposal.proposalId === proposalId);
          if (!exists) return [...current, loaded];
          return current.map((proposal) =>
            proposal.proposalId === proposalId ? loaded : proposal,
          );
        });
      } catch (err) {
        if (requestId !== detailRequestIdRef.current) return;
        setDetailLoadError(
          (err as Error)?.message || 'Failed to load the selected project documents.',
        );
      } finally {
        if (requestId === detailRequestIdRef.current) {
          setIsDetailLoading(false);
        }
      }
    },
    [activeProgram],
  );

  useEffect(() => {
    if (!selectedProposalId || isLoading || selectedProposalSummary?.detailsLoaded) return;
    void loadProposalDetails(selectedProposalId, selectedProposalSummary);
  }, [
    isLoading,
    loadProposalDetails,
    selectedProposalId,
    selectedProposalSummary,
  ]);

  const reloadActiveProposal = useCallback(async () => {
    if (!selectedProposalId) {
      await loadData();
      return;
    }
    await loadProposalDetails(selectedProposalId, selectedProposalSummary);
  }, [loadData, loadProposalDetails, selectedProposalId, selectedProposalSummary]);

  useEffect(() => {
    const urlProposalId = searchParams.get('proposalId') || searchParams.get('proposal');
    if (urlProposalId) {
      const parsed = parseInt(urlProposalId, 10);
      if (parsed && parsed !== selectedProposalId) {
        setSelectedProposalId(parsed);
      }
    }
    const urlStage = searchParams.get('stage') || searchParams.get('set') || searchParams.get('category');
    if (urlStage && urlStage !== selectedCategory) {
      setSelectedCategory(urlStage);
    }
  }, [searchParams, selectedProposalId, selectedCategory]);

  useEffect(() => {
    if (isLoading || isDetailLoading) return;

    if (activeProposal) {
      if (hydratedProposalIdRef.current === activeProposal.proposalId) return;

      hydratedProposalIdRef.current = activeProposal.proposalId;
      setSelectedProposalId(activeProposal.proposalId);
      const itemsCopy = JSON.parse(JSON.stringify(activeProposal.items));
      const remarksCopy = activeProposal.overallRemarks || '';
      setEditingItems(itemsCopy);
      setEditingOverallRemarks(remarksCopy);
      lastSavedPayloadRef.current = JSON.stringify({
        proposalId: activeProposal.proposalId,
        items: itemsCopy,
        remarks: remarksCopy,
      });
      setAutoSaveStatus('idle');
      setHistoryList(getChecklistHistory(activeProposal.proposalId));
    } else if (!selectedProposalId) {
      hydratedProposalIdRef.current = null;
      setSelectedProposalId(null);
      setEditingItems([]);
      setEditingOverallRemarks('');
      setHistoryList([]);
      lastSavedPayloadRef.current = '';
      setAutoSaveStatus('idle');
    }
  }, [activeProposal, isDetailLoading, isLoading, selectedProposalId]);

  const activeProposalId = activeProposal?.proposalId ?? null;

  useEffect(() => {
    if (!activeProposalId || isReadOnly || editingItems.length === 0) return;

    const currentPayload = JSON.stringify({
      proposalId: activeProposalId,
      items: editingItems,
      remarks: editingOverallRemarks,
    });

    if (currentPayload === lastSavedPayloadRef.current) {
      return;
    }

    setAutoSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await saveProposalChecklistReview(
          activeProposalId,
          editingItems,
          editingOverallRemarks
        );

        const counts = calculateChecklistDocumentCounts(editingItems);
        const { totalRequired, uploadedCount, remainingCount, compliedCount } = counts;
        const compliancePercentage =
          totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0;

        setProposals((prev) =>
          prev.map((p) => {
            if (p.proposalId !== activeProposalId) return p;
            return {
              ...p,
              items: editingItems,
              overallRemarks: editingOverallRemarks,
              compliedCount,
              totalRequired,
              uploadedCount,
              remainingCount,
              compliancePercentage,
              lastUpdated: new Date().toISOString(),
            };
          })
        );
        lastSavedPayloadRef.current = currentPayload;
        setLastSavedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('idle');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [editingItems, editingOverallRemarks, activeProposalId, isReadOnly]);

  const categories: ChecklistCategoryItem[] = useMemo(() => {
    if (activeProgram === 'GIA') {
      return GIA_STAGES.map((s) => ({
        id: s.id,
        stageOrSetTag: `Stage ${s.number}`,
        name: `Stage ${s.number}: ${s.shortTitle}`,
        shortName: s.shortTitle,
        subtitle: s.subtitle,
      }));
    }
    return SETUP_SETS.map((s) => ({
      id: s.id,
      stageOrSetTag: s.number.replace('SET', 'SET '),
      name: `${s.number.replace('SET', 'SET ')} · ${s.shortTitle}`,
      shortName: s.shortTitle,
      subtitle: s.subtitle,
    }));
  }, [activeProgram]);

  const filteredItems = useMemo(() => {
    return editingItems.filter((item) => {
      if (selectedCategory !== 'ALL') {
        const itemCat = item.setId || item.stageId;
        if (itemCat !== selectedCategory) return false;
      }

      const state = getItemComplianceState(item);
      if (statusTab === 'VERIFIED' && state.type !== 'SATISFIED') return false;
      if (statusTab === 'UNDER_REVIEW' && state.type !== 'UNDER_REVIEW') return false;
      if (statusTab === 'RETURNED' && state.type !== 'RETURNED') return false;
      if (statusTab === 'PENDING' && state.type !== 'PENDING') return false;
      if (statusTab === 'UPLOADED' && !item.uploadedDoc && !item.isPresent) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchGroup = item.group.toLowerCase().includes(q);
        const matchFile = item.uploadedDoc?.file_name.toLowerCase().includes(q) || false;
        if (!matchName && !matchGroup && !matchFile) return false;
      }

      return true;
    });
  }, [editingItems, selectedCategory, statusTab, searchQuery]);

  const stats = useMemo(() => {
    const total = editingItems.length;
    const required = editingItems.filter((i) => i.isRequired).length || total;
    const verified = editingItems.filter((i) => getItemComplianceState(i).type === 'SATISFIED').length;
    const underReview = editingItems.filter((i) => getItemComplianceState(i).type === 'UNDER_REVIEW').length;
    const returned = editingItems.filter((i) => getItemComplianceState(i).type === 'RETURNED').length;
    const pending = editingItems.filter((i) => getItemComplianceState(i).type === 'PENDING').length;
    const uploaded = editingItems.filter((i) => Boolean(i.uploadedDoc)).length;
    const percent = required > 0 ? Math.round((verified / required) * 100) : 0;

    return {
      total,
      required,
      uploaded,
      verified,
      underReview,
      returned,
      pending,
      percent,
    };
  }, [editingItems]);

  const handleSelectProposal = (proposal: ProposalChecklistRecord) => {
    detailRequestIdRef.current += 1;
    hydratedProposalIdRef.current = null;
    setSelectedProposalId(proposal.proposalId);
    setEditingItems([]);
    setEditingOverallRemarks('');
    setDetailLoadError(null);
    lastSavedPayloadRef.current = '';
    setAutoSaveStatus('idle');

    const next = new URLSearchParams(searchParams);
    next.set('program', proposal.program);
    next.set('proposalId', String(proposal.proposalId));
    next.delete('proposal');
    next.delete('stage');
    next.delete('set');
    next.delete('category');
    setSearchParams(next);
  };

  const handleBackToProjects = () => {
    detailRequestIdRef.current += 1;
    hydratedProposalIdRef.current = null;
    setSelectedProposalId(null);
    setEditingItems([]);
    setEditingOverallRemarks('');
    setHistoryList([]);
    setDetailLoadError(null);
    setIsDetailLoading(false);
    setAutoSaveStatus('idle');
    lastSavedPayloadRef.current = '';

    const next = new URLSearchParams(searchParams);
    next.delete('proposalId');
    next.delete('proposal');
    next.delete('stage');
    next.delete('set');
    next.delete('category');
    setSearchParams(next);
  };

  const handleToggleItemVerify = async (itemId: string) => {
    if (isReadOnly) return;
    const targetItem = editingItems.find((i) => i.id === itemId);
    if (!targetItem) return;

    if (!targetItem.isPresent && !targetItem.uploadedDoc) {
      const result = await Swal.fire({
        title: 'Manual Compliance Verification',
        html: `
          <div class="text-left space-y-2.5 pt-1">
            <p class="text-xs text-slate-500 font-medium">Evaluating requirement:</p>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 leading-relaxed">
              ${targetItem.name}
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">
              No digital file is attached. Do you wish to manually verify and mark this requirement as <b>Complied</b>?
            </p>
            <p class="text-[11px] text-slate-400">
              Review records and compliance metrics will be updated and auto-saved automatically.
            </p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0f53b7',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Confirm Verification',
        cancelButtonText: 'Cancel',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
          cancelButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
        },
      });
      if (!result.isConfirmed) return;
    }

    const nextPresent = !targetItem.isPresent;
    const nextStatus: ChecklistItemStatus = nextPresent ? 'Complied' : 'Missing';

    if (activeProposal && targetItem) {
      const log = addChecklistHistoryLog({
        proposalId: activeProposal.proposalId,
        action: nextPresent ? 'VERIFY' : 'UNVERIFY',
        itemName: targetItem.name,
        userName: currentUser?.name || 'User',
        userRole: currentUser?.role || ROLES.FOCAL,
        details: nextPresent
          ? `Verified compliance for ${targetItem.name}.`
          : `Unmarked requirement for ${targetItem.name}.`,
      });
      setHistoryList((prev) => [log, ...prev]);
    }

    setEditingItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          isPresent: nextPresent,
          status: nextStatus,
          reviewedAt: nextPresent ? new Date().toISOString() : undefined,
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
            it.id === itemId
              ? {
                  ...it,
                  isPresent: nextPresent,
                  status: nextStatus,
                  reviewedAt: nextPresent ? new Date().toISOString() : undefined,
                }
              : it
          );
          const counts = calculateChecklistDocumentCounts(updatedItems);
          const { totalRequired, uploadedCount, remainingCount, compliedCount } = counts;
          const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0;
          return {
            ...p,
            items: updatedItems,
            totalRequired,
            uploadedCount,
            remainingCount,
            compliedCount,
            compliancePercentage,
          };
        })
      );
    }
  };

  const handleMarkReviewCompleted = async () => {
    if (!activeProposal || isReadOnly || isCompletingReview) return;

    const missingRequiredCount = editingItems.filter((i) => i.isRequired && !i.isPresent).length;

    if (missingRequiredCount > 0) {
      const result = await Swal.fire({
        title: 'Incomplete Requirements',
        html: `
          <div class="text-left space-y-2.5 pt-1">
            <p class="text-xs text-slate-600 leading-relaxed">
              There are still <b>${missingRequiredCount} required item(s)</b> unverified or pending attachment.
            </p>
            <p class="text-xs text-slate-500">
              Do you want to finalize and mark this document checklist evaluation as <b>Completed</b> anyway?
            </p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0f53b7',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Finalize Review',
        cancelButtonText: 'Continue Review',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
          cancelButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
        },
      });
      if (!result.isConfirmed) return;
    } else {
      const result = await Swal.fire({
        title: 'Mark Review as Completed?',
        html: `
          <div class="text-left space-y-2.5 pt-1">
            <p class="text-xs text-slate-600 leading-relaxed">
              You are completing the document evaluation for <b>${activeProposal.enterpriseName}</b> (${activeProposal.referenceNumber}).
            </p>
            <p class="text-xs text-slate-500">
              All checklist requirements and evaluation notes will be finalized.
            </p>
          </div>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Confirm Completion',
        cancelButtonText: 'Cancel',
        customClass: {
          popup: 'rounded-3xl p-6 font-sans',
          confirmButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
          cancelButton: 'rounded-xl px-4 py-2.5 font-bold text-xs',
        },
      });
      if (!result.isConfirmed) return;
    }

    setIsCompletingReview(true);
    try {
      await saveProposalChecklistReview(
        activeProposal.proposalId,
        editingItems,
        editingOverallRemarks
      );

      const counts = calculateChecklistDocumentCounts(editingItems);
      const { totalRequired, uploadedCount, remainingCount, compliedCount } = counts;
      const compliancePercentage =
        totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0;

      setProposals((prev) =>
        prev.map((p) => {
          if (p.proposalId !== activeProposal.proposalId) return p;
          return {
            ...p,
            items: editingItems,
            overallRemarks: editingOverallRemarks,
            compliedCount,
            totalRequired,
            uploadedCount,
            remainingCount,
            compliancePercentage,
            lastUpdated: new Date().toISOString(),
          };
        })
      );

      if (activeProposal) {
        const log = addChecklistHistoryLog({
          proposalId: activeProposal.proposalId,
          action: 'COMPLETE_REVIEW',
          userName: currentUser?.name || 'Focal Evaluator',
          userRole: currentUser?.role || ROLES.FOCAL,
          details: 'Finalized and marked document checklist evaluation review as Completed.',
        });
        setHistoryList((prev) => [log, ...prev]);
      }

      setLastSavedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setAutoSaveStatus('saved');

      Swal.fire({
        icon: 'success',
        title: 'Review Completed',
        text: `Document review for ${activeProposal.enterpriseName} has been successfully completed.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Completion Failed',
        text: 'Unable to finalize review. Please try again.',
        confirmButtonColor: '#0f53b7',
      });
    } finally {
      setIsCompletingReview(false);
    }
  };

  const exportSummaryCsv = async () => {
    if (programProposals.length === 0 || !currentUser) return;
    const headers = [
      'Reference Number',
      'Enterprise / Project Title',
      'Proponent Name',
      'Program',
      'Status',
      'Complied Requirements',
      'Total Required',
      'Compliance Rate',
      'Overall Remarks',
    ];
    const rows = programProposals.map((p) => [
      `"${p.referenceNumber}"`,
      `"${p.enterpriseName.replace(/"/g, '""')}"`,
      `"${p.proponentName.replace(/"/g, '""')}"`,
      `"${p.program}"`,
      `"${p.status}"`,
      p.compliedCount,
      p.totalRequired,
      `${p.compliancePercentage}%`,
      `"${(p.overallRemarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    try {
      await downloadBlob({
        blob: new Blob([csvContent], { type: 'text/csv;charset=utf-8' }),
        fileName: `${activeProgram.toLowerCase()}_document_checklist_${new Date().toISOString().split('T')[0]}.csv`,
        program: activeProgram,
        user: currentUser,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Failed to export document checklist:', error);
        void Swal.fire({
          icon: 'error',
          title: 'Export Failed',
          text: 'The checklist CSV could not be saved. Please try again.',
          confirmButtonColor: '#0f53b7',
        });
      }
    }
  };

  return {
    currentUser,
    isRpmo,
    isDirector,
    isFocal,
    isStaff,
    isAdmin,
    isReadOnly,
    canUpload,
    canReview,
    canMarkComplete,
    canViewHistory,
    activeProgram,
    proposals,
    programProposals,
    setProposals,
    isLoading,
    loadError,
    loadData,
    reloadActiveProposal,
    activeProposal,
    selectedProposalId,
    isDetailLoading,
    detailLoadError,
    handleSelectProposal,
    handleBackToProjects,
    selectedCategory,
    setSelectedCategory,
    statusTab,
    setStatusTab,
    isFilterDropdownOpen,
    setIsFilterDropdownOpen,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    categories,
    filteredItems,
    stats,
    editingItems,
    setEditingItems,
    editingOverallRemarks,
    setEditingOverallRemarks,
    autoSaveStatus,
    lastSavedTime,
    isCompletingReview,
    handleToggleItemVerify,
    handleMarkReviewCompleted,
    exportSummaryCsv,
    historyList,
    setHistoryList,
    isHistoryExpanded,
    setIsHistoryExpanded,
  };
}
