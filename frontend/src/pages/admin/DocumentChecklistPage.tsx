import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  Archive,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  Grid2X2,
  GripVertical,
  History,
  Inbox,
  List,
  LoaderCircle,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  MoreVertical,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  UploadCloud,
  User,
  X,
  XCircle,
} from 'lucide-react'
import Swal from 'sweetalert2'

import { ROLE_LABEL, ROLES, type UserRole } from '../../config/permissions'
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal'
import { PdfThumbnail } from '../../components/common/PdfThumbnail'
import { getMockUser } from '../../lib/mockAuth'
import { reviewProposalDocument, viewDocumentBlobForStaff } from '../../services/documentStore'
import {
  addChecklistHistoryLog,
  createChecklistTemplate,
  deleteChecklistTemplate,
  fetchChecklistProposals,
  fetchChecklistTemplates,
  getChecklistHistory,
  removeChecklistDocument,
  restoreChecklistTemplate,
  saveProposalChecklistReview,
  updateChecklistTemplate,
  uploadChecklistDocument,
  GIA_STAGES,
  SETUP_SETS,
  type ChecklistHistoryAction,
  type ChecklistHistoryItem,
  type ChecklistItemStatus,
  type DocumentChecklistItem,
  type ProposalChecklistRecord,
} from '../../services/documentChecklistStore'
import { cn } from '../../utils/cn'

function formatFileSize(bytes?: number | null): string {
  if (bytes == null || bytes <= 0) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recently'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 30) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}

function getItemComplianceState(item: DocumentChecklistItem) {
  const hasFile = Boolean(item.uploadedDoc)
  const isReturned =
    hasFile && (item.status === 'Needs Revision' || item.uploadedDoc?.status === 'returned_for_revision')
  const isApproved =
    item.status === 'Complied' && (item.uploadedDoc?.status === 'approved' || !hasFile || Boolean(item.reviewedAt))

  if (isReturned) {
    return {
      type: 'RETURNED' as const,
      label: 'Revision',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80',
      iconClass: 'bg-rose-500 text-white',
    }
  }

  if (isApproved || (item.isPresent && !isReturned)) {
    return {
      type: 'SATISFIED' as const,
      label: 'Verified',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      iconClass: 'bg-emerald-500 text-white',
    }
  }

  if (hasFile) {
    return {
      type: 'UNDER_REVIEW' as const,
      label: 'In Review',
      badgeClass: 'bg-blue-50 text-[#0f53b7] border border-blue-200/80',
      iconClass: 'bg-[#0f53b7] text-white',
    }
  }

  return {
    type: 'PENDING' as const,
    label: null,
    badgeClass: '',
    iconClass: 'bg-slate-100 text-slate-400',
  }
}

export function DocumentChecklistPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = getMockUser()

  const isRpmo = currentUser?.role === ROLES.RPMO
  const isDirector = currentUser?.role === ROLES.PROVINCIAL_DIRECTOR
  const isFocal = currentUser?.role === ROLES.FOCAL
  const isStaff = currentUser?.role === ROLES.PROJECT_STAFF
  const isAdmin = currentUser?.role === ROLES.SYSTEM_ADMIN

  const isReadOnly = isRpmo || isDirector
  const canUpload = !isReadOnly && (isStaff || isFocal || isAdmin)
  const canReview = !isReadOnly && (isFocal || isAdmin)
  const canMarkComplete = !isReadOnly && (isFocal || isAdmin)
  const canViewHistory = isStaff || isFocal || isDirector || isAdmin

  const userProgram = currentUser?.program as 'SETUP' | 'GIA' | undefined

  const activeProgram: 'SETUP' | 'GIA' = useMemo(() => {
    if ((isFocal || isStaff) && userProgram) {
      return userProgram === 'GIA' ? 'GIA' : 'SETUP'
    }
    const param = searchParams.get('program')?.toUpperCase()
    if (param === 'GIA') return 'GIA'
    if (param === 'SETUP') return 'SETUP'
    return userProgram || 'SETUP'
  }, [searchParams, isFocal, isStaff, userProgram])

  const [proposals, setProposals] = useState<ProposalChecklistRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(() => {
    const fromUrl = searchParams.get('proposalId') || searchParams.get('proposal')
    return fromUrl ? parseInt(fromUrl, 10) || null : null
  })
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false)
  const [modalSearchQuery, setModalSearchQuery] = useState('')
  const [modalFilter, setModalFilter] = useState<'ALL' | 'COMPLETE' | 'INCOMPLETE'>('ALL')

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const fromUrl = searchParams.get('stage') || searchParams.get('set') || searchParams.get('category')
    if (fromUrl) return fromUrl
    return activeProgram === 'GIA' ? '01' : 'SET1'
  })
  const [statusTab, setStatusTab] = useState<
    'ALL' | 'VERIFIED' | 'UNDER_REVIEW' | 'RETURNED' | 'PENDING' | 'UPLOADED'
  >('ALL')
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [viewMode, setViewModeState] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('dprms_checklist_view_mode')
    if (saved === 'grid' || saved === 'list') return saved
    const urlParam = searchParams.get('view')
    if (urlParam === 'grid' || urlParam === 'list') return urlParam
    return 'list'
  })

  const setViewMode = (mode: 'grid' | 'list') => {
    setViewModeState(mode)
    localStorage.setItem('dprms_checklist_view_mode', mode)
    const next = new URLSearchParams(searchParams)
    next.set('view', mode)
    setSearchParams(next, { replace: true })
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [isTemplateEditMode, setIsTemplateEditMode] = useState(false)

  const [editingItems, setEditingItems] = useState<DocumentChecklistItem[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [editingOverallRemarks, setEditingOverallRemarks] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null)
  const [isCompletingReview, setIsCompletingReview] = useState(false)
  const lastSavedPayloadRef = useRef<string>('')

  const [historyList, setHistoryList] = useState<ChecklistHistoryItem[]>([])
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)

  const [reviewModalItem, setReviewModalItem] = useState<DocumentChecklistItem | null>(null)
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'UNDER_REVIEW' | 'RETURNED' | 'PENDING'>('APPROVED')
  const [reviewRemarks, setReviewRemarks] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isLoadingPreviewBlob, setIsLoadingPreviewBlob] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [versionModalDoc, setVersionModalDoc] = useState<DocumentChecklistItem | null>(null)

  const [blobMap, setBlobMap] = useState<Record<string, string>>({})

  const [uploadModalItem, setUploadModalItem] = useState<DocumentChecklistItem | null>(null)
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean
    title: string
    fileName?: string
    fileSize?: number | null
    uploadedAt?: string | null
    status?: string
    blobUrl?: string | null
    isLoading: boolean
    error: string | null
    docId?: number | null
  }>({
    isOpen: false,
    title: '',
    isLoading: false,
    error: null,
  })

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [editingTemplateItem, setEditingTemplateItem] = useState<DocumentChecklistItem | null>(null)
  const [templateFormData, setTemplateFormData] = useState({
    document_name: '',
    group_name: '',
    phase_code: '',
    phase_title: '',
    is_mandatory: true,
    sort_order: 1,
  })
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false)
  const [archivedTemplates, setArchivedTemplates] = useState<any[]>([])
  const [templateSubTab, setTemplateSubTab] = useState<'active' | 'archived'>('active')
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | number | null>(null)
  const [archiveToast, setArchiveToast] = useState<{ id: number; name: string; templateId?: number } | null>(null)
  const archiveToastTimerRef = useRef<any>(null)

  const handleOpenAddTemplateModal = () => {
    setEditingTemplateItem(null)
    const currentPhase = selectedCategory !== 'ALL' ? selectedCategory : (activeProgram === 'GIA' ? '01' : 'SET1')
    const phaseTitleMatch = categories.find((c) => c.id === currentPhase)
    setTemplateFormData({
      document_name: '',
      group_name: 'General Requirements',
      phase_code: currentPhase,
      phase_title: phaseTitleMatch?.name || (activeProgram === 'GIA' ? 'Stage 01: Proposal Submission' : 'SET 1 (Prior to TNA)'),
      is_mandatory: true,
      sort_order: (editingItems.length || 0) + 1,
    })
    setIsTemplateModalOpen(true)
  }

  const handleOpenEditTemplateModal = (item: DocumentChecklistItem) => {
    setEditingTemplateItem(item)
    const phaseCode = item.setId || item.stageId || (activeProgram === 'GIA' ? '01' : 'SET1')
    const phaseTitleMatch = categories.find((c) => c.id === phaseCode)
    setTemplateFormData({
      document_name: item.name,
      group_name: item.group || 'General Requirements',
      phase_code: phaseCode,
      phase_title: phaseTitleMatch?.name || 'Requirement Category',
      is_mandatory: item.isRequired,
      sort_order: 1,
    })
    setIsTemplateModalOpen(true)
  }

  const handleCloseTemplateModal = () => {
    if (isSubmittingTemplate) return
    setIsTemplateModalOpen(false)
    setEditingTemplateItem(null)
  }

  const handleSaveTemplateModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateFormData.document_name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Requirement Name Required',
        text: 'Please enter a valid document requirement name.',
        confirmButtonColor: '#0f53b7',
      })
      return
    }

    setIsSubmittingTemplate(true)
    try {
      if (editingTemplateItem?.templateId) {
        await updateChecklistTemplate(editingTemplateItem.templateId, {
          document_name: templateFormData.document_name,
          group_name: templateFormData.group_name,
          phase_code: templateFormData.phase_code,
          phase_title: templateFormData.phase_title,
          is_mandatory: templateFormData.is_mandatory,
        })
        Swal.fire({
          icon: 'success',
          title: 'Template Updated',
          text: 'The requirement template item was successfully updated.',
          timer: 1500,
          showConfirmButton: false,
        })
      } else {
        const itemCode = `${activeProgram.toLowerCase()}-${templateFormData.phase_code.toLowerCase()}-${Date.now().toString(36)}`
        await createChecklistTemplate({
          program_type: activeProgram,
          phase_code: templateFormData.phase_code,
          phase_title: templateFormData.phase_title,
          item_code: itemCode,
          document_name: templateFormData.document_name,
          group_name: templateFormData.group_name,
          is_mandatory: templateFormData.is_mandatory,
          sort_order: templateFormData.sort_order,
        })
        Swal.fire({
          icon: 'success',
          title: 'Requirement Created',
          text: 'New template requirement added successfully.',
          timer: 1500,
          showConfirmButton: false,
        })
      }
      setIsTemplateModalOpen(false)
      loadData()
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err?.response?.data?.message || err?.message || 'Could not save template item.',
        confirmButtonColor: '#0f53b7',
      })
    } finally {
      setIsSubmittingTemplate(false)
    }
  }

  const handleToggleTemplateMandatory = async (item: DocumentChecklistItem) => {
    const nextMandatory = !item.isRequired
    setEditingItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isRequired: nextMandatory } : i))
    )

    if (item.templateId) {
      try {
        await updateChecklistTemplate(item.templateId, {
          is_mandatory: nextMandatory,
        })
      } catch (err) {
        console.warn('Failed to update template mandatory status on backend:', err)
      }
    }
  }

  const handleReorderTemplateItems = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= editingItems.length || toIndex >= editingItems.length) return

    const updated = [...editingItems]
    const [movedItem] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, movedItem)

    setEditingItems(updated)

    try {
      const promises = updated.map((item, index) => {
        if (item.templateId) {
          return updateChecklistTemplate(item.templateId, { sort_order: index + 1 })
        }
        return Promise.resolve()
      })
      await Promise.all(promises)
    } catch (err) {
      console.warn('Failed to update drag-and-drop sort order:', err)
    }
  }

  const handleDeactivateTemplateItem = async (item: DocumentChecklistItem) => {
    if (!item.templateId) {
      Swal.fire({
        icon: 'info',
        title: 'Built-in Requirement',
        text: 'This requirement is hardcoded in frontend configuration. Please select a database template item to deactivate.',
        confirmButtonColor: '#0f53b7',
      })
      return
    }

    const result = await Swal.fire({
      title: 'Deactivate Requirement Item?',
      html: `
        <div class="text-left space-y-2 pt-1">
          <p class="text-xs text-slate-600">Are you sure you want to deactivate this requirement template?</p>
          <div class="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-bold text-slate-800">
            ${item.name}
          </div>
          <p class="text-[11px] text-slate-400">
            It will be hidden from future proposal checklists. Historical proposal records will remain intact.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Deactivate Requirement',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl p-6 font-sans' },
    })

    if (!result.isConfirmed) return

    try {
      await deleteChecklistTemplate(item.templateId)
      
      if (archiveToastTimerRef.current) {
        clearTimeout(archiveToastTimerRef.current)
      }

      setArchiveToast({
        id: Date.now(),
        name: item.name,
        templateId: item.templateId,
      })

      archiveToastTimerRef.current = setTimeout(() => {
        setArchiveToast(null)
      }, 6000)

      await loadData()
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Deactivation Failed',
        text: err?.response?.data?.message || 'Unable to deactivate requirement template.',
        confirmButtonColor: '#0f53b7',
      })
    }
  }

  const handleDeleteTemplateItem = async (item: DocumentChecklistItem) => {
    if (!item.templateId) {
      Swal.fire({
        icon: 'info',
        title: 'Built-in Requirement',
        text: 'This requirement is hardcoded in frontend configuration and cannot be deleted.',
        confirmButtonColor: '#0f53b7',
      })
      return
    }

    const result = await Swal.fire({
      title: 'Delete Requirement Item?',
      html: `
        <div class="text-left space-y-2 pt-1">
          <p class="text-xs text-slate-600">Are you sure you want to delete this requirement template?</p>
          <div class="rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs font-bold text-rose-900">
            ${item.name}
          </div>
          <p class="text-[11px] text-slate-400">
            This requirement item will be removed from the checklist configuration.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete Requirement',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl p-6 font-sans' },
    })

    if (!result.isConfirmed) return

    try {
      await deleteChecklistTemplate(item.templateId)
      Swal.fire({
        icon: 'success',
        title: 'Requirement Deleted',
        text: 'The requirement template has been deleted successfully.',
        timer: 1500,
        showConfirmButton: false,
      })
      await loadData()
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Deletion Failed',
        text: err?.response?.data?.message || 'Unable to delete requirement template.',
        confirmButtonColor: '#0f53b7',
      })
    }
  }

  const handleRestoreTemplateItem = async (templateId: number, templateName: string) => {
    const result = await Swal.fire({
      title: 'Revert & Restore Requirement?',
      html: `
        <div class="text-left space-y-2 pt-1">
          <p class="text-xs text-slate-600">Reactivating this requirement will bring it back into the active checklist for <b>${activeProgram}</b>.</p>
          <div class="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs font-bold text-slate-800">
            ${templateName}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f53b7',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Revert & Restore',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl p-6 font-sans' },
    })

    if (!result.isConfirmed) return

    try {
      await restoreChecklistTemplate(templateId)
      Swal.fire({
        icon: 'success',
        title: 'Requirement Restored',
        text: 'The requirement has been restored and reactivated successfully.',
        timer: 1500,
        showConfirmButton: false,
      })
      await loadData()
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Restoration Failed',
        text: err?.response?.data?.message || 'Unable to restore template.',
        confirmButtonColor: '#0f53b7',
      })
    }
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await fetchChecklistProposals()
      setProposals(data)

      try {
        const allTemplates = await fetchChecklistTemplates(activeProgram, true)
        const inactives = allTemplates.filter((t: any) => t.is_active === false)
        setArchivedTemplates(inactives)
      } catch {
        setArchivedTemplates([])
      }
    } catch (err) {
      setLoadError((err as Error)?.message || 'Failed to load document checklists')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeProgram])

  const programProposals = useMemo(() => {
    return proposals.filter((p) => p.program === activeProgram)
  }, [proposals, activeProgram])

  const activeProposal = useMemo(() => {
    if (selectedProposalId) {
      const match = programProposals.find((p) => p.proposalId === selectedProposalId)
      if (match) return match
    }
    return programProposals[0] || null
  }, [programProposals, selectedProposalId])

  useEffect(() => {
    const urlProposalId = searchParams.get('proposalId') || searchParams.get('proposal')
    if (urlProposalId) {
      const parsed = parseInt(urlProposalId, 10)
      if (parsed && parsed !== selectedProposalId) {
        setSelectedProposalId(parsed)
      }
    }
    const urlStage = searchParams.get('stage') || searchParams.get('set') || searchParams.get('category')
    if (urlStage && urlStage !== selectedCategory) {
      setSelectedCategory(urlStage)
    }
  }, [searchParams, selectedProposalId, selectedCategory])

  useEffect(() => {
    if (activeProposal) {
      setSelectedProposalId(activeProposal.proposalId)
      const itemsCopy = JSON.parse(JSON.stringify(activeProposal.items))
      const remarksCopy = activeProposal.overallRemarks || ''
      setEditingItems(itemsCopy)
      setEditingOverallRemarks(remarksCopy)
      lastSavedPayloadRef.current = JSON.stringify({
        proposalId: activeProposal.proposalId,
        items: itemsCopy,
        remarks: remarksCopy,
      })
      setAutoSaveStatus('idle')
      setHistoryList(getChecklistHistory(activeProposal.proposalId))
    } else {
      setSelectedProposalId(null)
      setEditingItems([])
      setEditingOverallRemarks('')
      setHistoryList([])
      lastSavedPayloadRef.current = ''
      setAutoSaveStatus('idle')
    }
  }, [activeProposal?.proposalId, activeProgram])

  useEffect(() => {
    if (!activeProposal || isReadOnly || editingItems.length === 0) return

    const currentPayload = JSON.stringify({
      proposalId: activeProposal.proposalId,
      items: editingItems,
      remarks: editingOverallRemarks,
    })

    if (currentPayload === lastSavedPayloadRef.current) {
      return
    }

    setAutoSaveStatus('saving')
    const timer = setTimeout(async () => {
      try {
        await saveProposalChecklistReview(
          activeProposal.proposalId,
          editingItems,
          editingOverallRemarks
        )

        const totalRequired = editingItems.filter((i) => i.isRequired).length || editingItems.length
        const compliedCount = editingItems.filter((i) => (i.isRequired ? i.isPresent : false)).length
        const compliancePercentage =
          totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0

        setProposals((prev) =>
          prev.map((p) => {
            if (p.proposalId !== activeProposal.proposalId) return p
            return {
              ...p,
              items: editingItems,
              overallRemarks: editingOverallRemarks,
              compliedCount,
              totalRequired,
              compliancePercentage,
              lastUpdated: new Date().toISOString(),
            }
          })
        )
        lastSavedPayloadRef.current = currentPayload
        setLastSavedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        )
        setAutoSaveStatus('saved')
      } catch {
        setAutoSaveStatus('idle')
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [editingItems, editingOverallRemarks, activeProposal?.proposalId, isReadOnly])

  useEffect(() => {
    if (viewMode !== 'grid') return

    const unmappedItems = editingItems.filter(
      (item) => item.uploadedDoc?.id && !blobMap[item.id]
    )

    if (unmappedItems.length === 0) return

    unmappedItems.forEach(async (item) => {
      if (!item.uploadedDoc?.id) return
      try {
        const url = await viewDocumentBlobForStaff(item.uploadedDoc.id)
        setBlobMap((prev) => ({ ...prev, [item.id]: url }))
      } catch {
        // Silently fallback to placeholder
      }
    })
  }, [viewMode, editingItems, blobMap])



  const categories = useMemo(() => {
    if (activeProgram === 'GIA') {
      return GIA_STAGES.map((s) => ({
        id: s.id,
        stageOrSetTag: `Stage ${s.number}`,
        name: `Stage ${s.number}: ${s.shortTitle}`,
        shortName: s.shortTitle,
        subtitle: s.subtitle,
      }))
    }
    return SETUP_SETS.map((s) => ({
      id: s.id,
      stageOrSetTag: s.number.replace('SET', 'SET '),
      name: `${s.number.replace('SET', 'SET ')} · ${s.shortTitle}`,
      shortName: s.shortTitle,
      subtitle: s.subtitle,
    }))
  }, [activeProgram])

  const filteredItems = useMemo(() => {
    return editingItems.filter((item) => {
      if (selectedCategory !== 'ALL') {
        const itemCat = item.setId || item.stageId
        if (itemCat !== selectedCategory) return false
      }

      const state = getItemComplianceState(item)
      if (statusTab === 'VERIFIED' && state.type !== 'SATISFIED') return false
      if (statusTab === 'UNDER_REVIEW' && state.type !== 'UNDER_REVIEW') return false
      if (statusTab === 'RETURNED' && state.type !== 'RETURNED') return false
      if (statusTab === 'PENDING' && state.type !== 'PENDING') return false
      if (statusTab === 'UPLOADED' && !item.uploadedDoc && !item.isPresent) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = item.name.toLowerCase().includes(q)
        const matchGroup = item.group.toLowerCase().includes(q)
        const matchFile = item.uploadedDoc?.file_name.toLowerCase().includes(q) || false
        if (!matchName && !matchGroup && !matchFile) return false
      }

      return true
    })
  }, [editingItems, selectedCategory, statusTab, searchQuery])



  const stats = useMemo(() => {
    const total = editingItems.length
    const required = editingItems.filter((i) => i.isRequired).length || total
    const verified = editingItems.filter((i) => getItemComplianceState(i).type === 'SATISFIED').length
    const underReview = editingItems.filter((i) => getItemComplianceState(i).type === 'UNDER_REVIEW').length
    const returned = editingItems.filter((i) => getItemComplianceState(i).type === 'RETURNED').length
    const pending = editingItems.filter((i) => getItemComplianceState(i).type === 'PENDING').length
    const uploaded = editingItems.filter((i) => Boolean(i.uploadedDoc)).length
    const percent = required > 0 ? Math.round((verified / required) * 100) : 0

    return {
      total,
      required,
      uploaded,
      verified,
      underReview,
      returned,
      pending,
      percent,
    }
  }, [editingItems])

  const filteredModalProposals = useMemo(() => {
    return programProposals.filter((p) => {
      if (modalFilter === 'COMPLETE' && p.compliancePercentage < 100) return false
      if (modalFilter === 'INCOMPLETE' && p.compliancePercentage >= 100) return false

      if (modalSearchQuery.trim()) {
        const query = modalSearchQuery.toLowerCase()
        const matchTitle = p.enterpriseName.toLowerCase().includes(query)
        const matchRef = p.referenceNumber.toLowerCase().includes(query)
        const matchProponent = p.proponentName.toLowerCase().includes(query)
        const matchDistrict = (p.district || '').toLowerCase().includes(query)
        if (!matchTitle && !matchRef && !matchProponent && !matchDistrict) return false
      }

      return true
    })
  }, [programProposals, modalFilter, modalSearchQuery])

  const handleSelectProposal = (proposal: ProposalChecklistRecord) => {
    setSelectedProposalId(proposal.proposalId)
    const itemsCopy = JSON.parse(JSON.stringify(proposal.items))
    const remarksCopy = proposal.overallRemarks || ''
    setEditingItems(itemsCopy)
    setEditingOverallRemarks(remarksCopy)
    lastSavedPayloadRef.current = JSON.stringify({
      proposalId: proposal.proposalId,
      items: itemsCopy,
      remarks: remarksCopy,
    })
    setAutoSaveStatus('idle')
    setIsProjectSelectorOpen(false)
    setModalSearchQuery('')
  }

  const handleToggleItemVerify = async (itemId: string) => {
    if (isReadOnly) return
    const targetItem = editingItems.find((i) => i.id === itemId)
    if (!targetItem) return

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
      })
      if (!result.isConfirmed) return
    }

    const nextPresent = !targetItem.isPresent
    const nextStatus: ChecklistItemStatus = nextPresent ? 'Complied' : 'Missing'

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
      })
      setHistoryList((prev) => [log, ...prev])
    }

    setEditingItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          isPresent: nextPresent,
          status: nextStatus,
          reviewedAt: nextPresent ? new Date().toISOString() : undefined,
        }
      })
      if (activeProposal) {
        saveProposalChecklistReview(activeProposal.proposalId, next, editingOverallRemarks).catch(() => {})
      }
      return next
    })

    if (activeProposal) {
      setProposals((prev) =>
        prev.map((p) => {
          if (p.proposalId !== activeProposal.proposalId) return p
          const updatedItems = p.items.map((it) =>
            it.id === itemId
              ? {
                  ...it,
                  isPresent: nextPresent,
                  status: nextStatus,
                  reviewedAt: nextPresent ? new Date().toISOString() : undefined,
                }
              : it
          )
          const totalRequired = updatedItems.filter((i) => i.isRequired).length || updatedItems.length
          const compliedCount = updatedItems.filter((i) => (i.isRequired ? i.isPresent : false)).length
          const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0
          return {
            ...p,
            items: updatedItems,
            totalRequired,
            compliedCount,
            compliancePercentage,
          }
        })
      )
    }
  }

  const handleOpenUploadModal = (item: DocumentChecklistItem) => {
    setUploadModalItem(item)
    setSelectedUploadFile(null)
  }

  const handleCloseUploadModal = () => {
    if (isUploading) return
    setUploadModalItem(null)
    setSelectedUploadFile(null)
  }

  const validateAndSetFile = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File Format',
        text: 'Only PDF documents (.pdf) can be uploaded. Images, Word documents, and spreadsheets are not supported.',
        confirmButtonColor: '#0f53b7',
      })
      setSelectedUploadFile(null)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      Swal.fire({
        icon: 'warning',
        title: 'File Exceeds Limit',
        text: `The selected file is ${sizeMb} MB. Maximum upload file size is 10 MB.`,
        confirmButtonColor: '#0f53b7',
      })
      setSelectedUploadFile(null)
      return
    }

    setSelectedUploadFile(file)
  }

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleConfirmUpload = async () => {
    if (!uploadModalItem || !selectedUploadFile || !activeProposal || isReadOnly) return
    setIsUploading(true)

    try {
      const { uploadedDoc, blobUrl } = await uploadChecklistDocument(
        activeProposal.proposalId,
        uploadModalItem,
        selectedUploadFile,
        activeProposal.referenceNumber
      )

      setBlobMap((prev) => ({ ...prev, [uploadModalItem.id]: blobUrl }))

      if (activeProposal) {
        const log = addChecklistHistoryLog({
          proposalId: activeProposal.proposalId,
          action: uploadModalItem.isPresent ? 'REPLACE' : 'UPLOAD',
          itemName: uploadModalItem.name,
          fileName: selectedUploadFile.name,
          userName: currentUser?.name || 'User',
          userRole: currentUser?.role || ROLES.PROJECT_STAFF,
          details: `Uploaded ${selectedUploadFile.name} (${formatFileSize(selectedUploadFile.size)})`,
        })
        setHistoryList((prev) => [log, ...prev])
      }

      setEditingItems((prev) => {
        const next = prev.map((item) => {
          if (item.id !== uploadModalItem.id) return item
          return {
            ...item,
            isPresent: true,
            status: 'Complied' as ChecklistItemStatus,
            uploadedDoc,
            reviewedAt: new Date().toISOString(),
          }
        })
        if (activeProposal) {
          saveProposalChecklistReview(activeProposal.proposalId, next, editingOverallRemarks).catch(() => {})
        }
        return next
      })

      if (activeProposal) {
        setProposals((prev) =>
          prev.map((p) => {
            if (p.proposalId !== activeProposal.proposalId) return p
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
            )
            const totalRequired = updatedItems.filter((i) => i.isRequired).length || updatedItems.length
            const compliedCount = updatedItems.filter((i) => (i.isRequired ? i.isPresent : false)).length
            const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0
            return {
              ...p,
              items: updatedItems,
              totalRequired,
              compliedCount,
              compliancePercentage,
            }
          })
        )
      }

      Swal.fire({
        icon: 'success',
        title: 'Document Uploaded',
        text: `${selectedUploadFile.name} uploaded and verified successfully.`,
        timer: 1600,
        showConfirmButton: false,
      })

      handleCloseUploadModal()
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: err?.message || 'Failed to upload document. Please ensure it is a valid PDF under 10 MB.',
        confirmButtonColor: '#0f53b7',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = async (item: DocumentChecklistItem) => {
    if (isReadOnly) return
    const result = await Swal.fire({
      title: 'Remove Attached Document?',
      text: `Are you sure you want to remove ${item.uploadedDoc?.file_name || 'this file'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    })

    if (!result.isConfirmed) return

    if (item.uploadedDoc?.id) {
      await removeChecklistDocument(item.uploadedDoc.id)
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
      })
      setHistoryList((prev) => [log, ...prev])
    }

    setBlobMap((prev) => {
      const next = { ...prev }
      delete next[item.id]
      return next
    })

    setEditingItems((prev) => {
      const next = prev.map((i) => {
        if (i.id !== item.id) return i
        return {
          ...i,
          isPresent: false,
          status: 'Missing' as ChecklistItemStatus,
          uploadedDoc: null,
        }
      })
      if (activeProposal) {
        saveProposalChecklistReview(activeProposal.proposalId, next, editingOverallRemarks).catch(() => {})
      }
      return next
    })

    if (activeProposal) {
      setProposals((prev) =>
        prev.map((p) => {
          if (p.proposalId !== activeProposal.proposalId) return p
          const updatedItems = p.items.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  isPresent: false,
                  status: 'Missing' as ChecklistItemStatus,
                  uploadedDoc: null,
                }
              : it
          )
          const totalRequired = updatedItems.filter((i) => i.isRequired).length || updatedItems.length
          const compliedCount = updatedItems.filter((i) => (i.isRequired ? i.isPresent : false)).length
          const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0
          return {
            ...p,
            items: updatedItems,
            totalRequired,
            compliedCount,
            compliancePercentage,
          }
        })
      )
    }

    Swal.fire({
      icon: 'success',
      title: 'Document Removed',
      text: 'The attachment has been cleared.',
      timer: 1400,
      showConfirmButton: false,
    })
  }

  const handleOpenReviewModal = async (item: DocumentChecklistItem) => {
    setReviewModalItem(item)
    const state = getItemComplianceState(item)
    if (state.type === 'SATISFIED') setReviewDecision('APPROVED')
    else setReviewDecision('RETURNED')
    setReviewRemarks(item.remarks || item.uploadedDoc?.remarks || '')

    if (item.uploadedDoc?.id && !blobMap[item.id]) {
      setIsLoadingPreviewBlob(true)
      try {
        const url = await viewDocumentBlobForStaff(item.uploadedDoc.id)
        setBlobMap((prev) => ({ ...prev, [item.id]: url }))
      } catch (err) {
        console.warn('Failed to load review document preview:', err)
      } finally {
        setIsLoadingPreviewBlob(false)
      }
    }
  }

  const handleCloseReviewModal = () => {
    if (isSubmittingReview) return
    setReviewModalItem(null)
    setReviewRemarks('')
  }

  const handleConfirmReview = async () => {
    if (!reviewModalItem || isReadOnly) return
    const remarksValue = reviewRemarks.trim()

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
      })
      return
    }

    setIsSubmittingReview(true)
    try {
      let newStatus: ChecklistItemStatus = 'Complied'
      let isPresent = true
      let action: ChecklistHistoryAction = 'REVIEW_APPROVED'
      let docStatus = 'approved'
      let successTitle = 'Document Verified'
      let successText = 'The requirement has been marked as Verified.'

      if (reviewDecision === 'APPROVED') {
        newStatus = 'Complied'
        isPresent = true
        action = 'REVIEW_APPROVED'
        docStatus = 'approved'
        successTitle = 'Document Verified'
        successText = 'The requirement has been marked as Verified.'
      } else if (reviewDecision === 'UNDER_REVIEW') {
        newStatus = 'Under Review'
        isPresent = false
        action = 'REVIEW_UNDER_REVIEW'
        docStatus = 'under_review'
        successTitle = 'Set to In Review'
        successText = 'The document status is set to In Review.'
      } else if (reviewDecision === 'RETURNED') {
        newStatus = 'Needs Revision'
        isPresent = false
        action = 'REVIEW_RETURNED'
        docStatus = 'returned_for_revision'
        successTitle = 'Returned for Revision'
        successText = 'Rejection remarks saved and document returned for revision.'
      } else {
        newStatus = 'Missing'
        isPresent = false
        action = 'REVIEW_PENDING'
        docStatus = 'pending'
        successTitle = 'Marked as Pending'
        successText = 'The requirement has been set to Pending.'
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
            }
          }
          return it
        })
        if (activeProposal) {
          saveProposalChecklistReview(activeProposal.proposalId, next, editingOverallRemarks).catch(() => {})
        }
        return next
      })

      if (activeProposal) {
        setProposals((prev) =>
          prev.map((p) => {
            if (p.proposalId !== activeProposal.proposalId) return p
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
            )
            const totalRequired = updatedItems.filter((i) => i.isRequired).length || updatedItems.length
            const compliedCount = updatedItems.filter((i) => (i.isRequired ? i.isPresent : false)).length
            const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0
            return {
              ...p,
              items: updatedItems,
              totalRequired,
              compliedCount,
              compliancePercentage,
            }
          })
        )
      }

      if (reviewModalItem.uploadedDoc?.id) {
        try {
          await reviewProposalDocument(
            reviewModalItem.uploadedDoc.id,
            docStatus as any,
            remarksValue
          )
        } catch {
          // Backend sync error fallback
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
        })
        setHistoryList((prev) => [log, ...prev])
      }

      handleCloseReviewModal()
      Swal.fire({
        icon: 'success',
        title: successTitle,
        text: successText,
        timer: 1800,
        showConfirmButton: false,
        customClass: { popup: 'rounded-3xl p-6 font-sans' },
      })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleRestoreArchivedVersion = (item: DocumentChecklistItem, archived: any) => {
    if (!item.uploadedDoc) return

    const currentDoc = item.uploadedDoc
    const currentVersionNumber = (currentDoc.archived_versions?.length || 0) + 1

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
    }

    const updatedArchivedVersions = (currentDoc.archived_versions || [])
      .filter((v: any) => (v.id || v.file_name) !== (archived.id || archived.file_name))
      .concat(currentAsArchived as any)

    const restoredUploadedDoc = {
      ...currentDoc,
      file_name: archived.file_name,
      file_size: archived.file_size,
      file_path: archived.file_path,
      status: archived.status || 'under_review',
      remarks: archived.remarks || '',
      created_at: archived.created_at || new Date().toISOString(),
      archived_versions: updatedArchivedVersions,
    }

    setEditingItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, uploadedDoc: restoredUploadedDoc, status: 'Under Review' } : it))
    )

    if (archived.file_path) {
      setBlobMap((prev) => ({ ...prev, [item.id]: archived.file_path }))
    }

    setVersionModalDoc(null)

    Swal.fire({
      icon: 'success',
      title: 'Version Restored',
      text: `Restored "${archived.file_name}" as active document version.`,
      toast: true,
      position: 'bottom-end',
      timer: 3000,
      showConfirmButton: false,
    })
  }

  const handlePreviewDocument = async (item: DocumentChecklistItem) => {
    if (!item.uploadedDoc) return

    const docId = item.uploadedDoc.id
    const liveBlob = blobMap[item.id]

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
      })
      return
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
    })

    if (docId) {
      try {
        const blobUrl = await viewDocumentBlobForStaff(docId)
        setBlobMap((prev) => ({ ...prev, [item.id]: blobUrl }))
        setPreviewDoc((prev) => ({
          ...prev,
          blobUrl,
          isLoading: false,
        }))
      } catch {
        setPreviewDoc((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Could not load server PDF preview.',
        }))
      }
    } else if (item.uploadedDoc.file_path) {
      setPreviewDoc((prev) => ({
        ...prev,
        blobUrl: item.uploadedDoc!.file_path,
        isLoading: false,
      }))
    }
  }

  const handleDownloadPreviewFile = () => {
    if (!previewDoc.blobUrl) return
    const link = document.createElement('a')
    link.href = previewDoc.blobUrl
    link.download = previewDoc.fileName || `${previewDoc.title}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenPreviewNewTab = () => {
    if (!previewDoc.blobUrl) return
    window.open(previewDoc.blobUrl, '_blank')
  }

  const handleMarkReviewCompleted = async () => {
    if (!activeProposal || isReadOnly || isCompletingReview) return

    const missingRequiredCount = editingItems.filter((i) => i.isRequired && !i.isPresent).length

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
      })
      if (!result.isConfirmed) return
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
      })
      if (!result.isConfirmed) return
    }

    setIsCompletingReview(true)
    try {
      await saveProposalChecklistReview(
        activeProposal.proposalId,
        editingItems,
        editingOverallRemarks
      )

      const totalRequired = editingItems.filter((i) => i.isRequired).length || editingItems.length
      const compliedCount = editingItems.filter((i) => (i.isRequired ? i.isPresent : false)).length
      const compliancePercentage =
        totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0

      setProposals((prev) =>
        prev.map((p) => {
          if (p.proposalId !== activeProposal.proposalId) return p
          return {
            ...p,
            items: editingItems,
            overallRemarks: editingOverallRemarks,
            compliedCount,
            totalRequired,
            compliancePercentage,
            lastUpdated: new Date().toISOString(),
          }
        })
      )

      if (activeProposal) {
        const log = addChecklistHistoryLog({
          proposalId: activeProposal.proposalId,
          action: 'COMPLETE_REVIEW',
          userName: currentUser?.name || 'Focal Evaluator',
          userRole: currentUser?.role || ROLES.FOCAL,
          details: 'Finalized and marked document checklist evaluation review as Completed.',
        })
        setHistoryList((prev) => [log, ...prev])
      }

      setLastSavedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      )
      setAutoSaveStatus('saved')

      Swal.fire({
        icon: 'success',
        title: 'Review Completed',
        text: `Document review for ${activeProposal.enterpriseName} has been successfully completed.`,
        timer: 2000,
        showConfirmButton: false,
      })
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Completion Failed',
        text: 'Unable to finalize review. Please try again.',
        confirmButtonColor: '#0f53b7',
      })
    } finally {
      setIsCompletingReview(false)
    }
  }

  const exportSummaryCsv = () => {
    if (programProposals.length === 0) return
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
    ]
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
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `${activeProgram.toLowerCase()}_document_checklist_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Top Header & Program Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-9 sm:h-10 w-1.5 rounded-full bg-[#0f53b7]" />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-slate-400">
              <span>Document Checklist</span>
              <span>&gt;</span>
              <span className="font-bold text-[#285497]">{activeProgram} Program</span>
              {isReadOnly && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-bold text-slate-500">
                    <Lock className="size-2.5" />
                    Regional View
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
                Documents
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {!isReadOnly && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
              {autoSaveStatus === 'saving' ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin text-[#0f53b7]" />
                  <span className="text-[#0f53b7] font-semibold">Saving...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                  <span className="text-slate-600">
                    {autoSaveStatus === 'saved' && lastSavedTime
                      ? `Autosaved at ${lastSavedTime}`
                      : 'Autosaved Just now'}
                  </span>
                </>
              )}
            </div>
          )}

          {(isAdmin || isFocal) && (
            isTemplateEditMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsTemplateEditMode(false)
                  setTemplateSubTab('active')
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 text-xs font-black shadow-xs border border-amber-400 transition cursor-pointer"
                title="Finish requirement configuration"
              >
                <Check className="size-3.5 text-slate-950 stroke-[3]" />
                <span>Done</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsTemplateEditMode(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950 cursor-pointer"
              >
                <SlidersHorizontal className="size-3.5 text-slate-500" />
                <span>Configure</span>
              </button>
            )
          )}

          {!isTemplateEditMode && (
            <>
              <button
                type="button"
                onClick={exportSummaryCsv}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
              >
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              >
                <RefreshCw className={cn('size-3.5 text-slate-500', isLoading && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center">
          <LoaderCircle className="size-8 animate-spin text-[#0f53b7]" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Loading {activeProgram} documents…</p>
        </div>
      ) : loadError ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center text-red-500">
          <XCircle className="size-9 text-rose-500" />
          <p className="mt-2 text-sm font-bold">{loadError}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-4 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
          >
            Try again
          </button>
        </div>
      ) : !activeProposal ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#E6EEF4] text-[#285497]">
            <FolderOpen className="size-6" />
          </span>
          <h3 className="mt-3 text-base font-bold text-slate-900">
            No {activeProgram} Proposals Found
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            There are currently no proposals registered under the {activeProgram} program.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[305px_1fr] gap-6 items-start">
          <aside className="space-y-4 lg:sticky lg:top-4">
            <div className="overflow-hidden rounded-2xl border border-[#B5BFCD]/80 bg-white p-4 shadow-sm space-y-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Project
                  </span>
                  <h3 className="mt-0.5 text-sm font-bold leading-snug text-slate-950 break-words" title={activeProposal.enterpriseName}>
                    {activeProposal.enterpriseName}
                  </h3>
                  <p className="mt-1 font-mono text-xs font-semibold text-[#285497]">
                    {activeProposal.referenceNumber}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                    stats.percent >= 100
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                  )}
                >
                  {stats.percent}%
                </span>
              </div>

              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      stats.percent >= 100 ? 'bg-emerald-600' : 'bg-[#0f53b7]'
                    )}
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{stats.verified} / {stats.required} Complied</span>
                  <span>{stats.uploaded} Uploaded</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProjectSelectorOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white py-2 px-3 text-xs font-bold text-slate-700 hover:bg-[#E6EEF4]/60 hover:text-[#0f53b7] hover:border-[#0f53b7]/30 transition shadow-2xs cursor-pointer"
              >
                <Search className="size-3.5 text-slate-400 shrink-0" />
                <span>Switch Project</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#B5BFCD]/80 bg-white p-3 shadow-sm space-y-1">
              <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Categories
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer',
                  selectedCategory === 'ALL'
                    ? 'bg-[#0f53b7] font-bold text-white shadow-xs'
                    : 'font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Inbox className="size-4 shrink-0" />
                  <span className="tracking-tight">All Requirements</span>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                    selectedCategory === 'ALL'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {editingItems.length}
                </span>
              </button>

              <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1 overscroll-contain custom-scrollbar">
                {categories.map((cat) => {
                  const catItems = editingItems.filter((i) => i.setId === cat.id || i.stageId === cat.id)
                  const catComplied = catItems.filter((i) => i.isPresent).length
                  const catTotal = catItems.length
                  const isCatComplete = catTotal > 0 && catComplied >= catTotal
                  const isSelected = selectedCategory === cat.id

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        'group flex w-full flex-col gap-0.5 rounded-xl px-3 py-2 text-left transition cursor-pointer',
                        isSelected
                          ? 'bg-[#0f53b7] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wider',
                            isSelected ? 'text-blue-100' : 'text-slate-400'
                          )}
                        >
                          {cat.stageOrSetTag}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                            isSelected
                              ? 'bg-white/20 text-white'
                              : isCatComplete
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {catComplied}/{catTotal}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-xs leading-snug tracking-tight',
                          isSelected ? 'font-bold text-white' : 'font-semibold text-slate-800'
                        )}
                        title={cat.name}
                      >
                        {cat.shortName}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {canViewHistory && (
              <div className="overflow-hidden rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsHistoryExpanded((prev) => !prev)}
                  className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex size-6 items-center justify-center rounded-lg bg-[#0f53b7]/10 text-[#0f53b7] shrink-0">
                      <History className="size-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 truncate">History</span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0f53b7] border border-blue-200/80 shrink-0">
                      {historyList.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'size-4 text-slate-400 transition-transform duration-200 shrink-0',
                      isHistoryExpanded && 'rotate-180 text-slate-700'
                    )}
                  />
                </button>

                {isHistoryExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-3 max-h-64 sm:max-h-72 overflow-y-auto overscroll-contain space-y-2.5 divide-y divide-slate-100/80 pr-1.5 custom-scrollbar">
                    {historyList.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No activity records yet for this project.
                      </div>
                    ) : (
                      historyList.map((item) => {
                        const roleFormatted = ROLE_LABEL[item.userRole as UserRole] || item.userRole
                        return (
                          <div key={item.id} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={cn(
                                  'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase',
                                  item.action === 'UPLOAD' || item.action === 'REPLACE'
                                    ? 'bg-blue-100 text-[#0f53b7]'
                                    : item.action === 'REMOVE'
                                    ? 'bg-rose-100 text-rose-700'
                                    : item.action === 'REVIEW_APPROVED' || item.action === 'VERIFY'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : item.action === 'REVIEW_RETURNED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : item.action === 'REVIEW_UNDER_REVIEW'
                                    ? 'bg-blue-100 text-blue-700'
                                    : item.action === 'REVIEW_PENDING' || item.action === 'UNVERIFY'
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-purple-100 text-purple-700'
                                )}
                              >
                                {item.action === 'UPLOAD'
                                  ? 'Uploaded'
                                  : item.action === 'REPLACE'
                                  ? 'Replaced'
                                  : item.action === 'REMOVE'
                                  ? 'Removed'
                                  : item.action === 'VERIFY' || item.action === 'REVIEW_APPROVED'
                                  ? 'Verified'
                                  : item.action === 'UNVERIFY' || item.action === 'REVIEW_PENDING'
                                  ? 'Pending'
                                  : item.action === 'REVIEW_UNDER_REVIEW'
                                  ? 'In Review'
                                  : item.action === 'REVIEW_RETURNED'
                                  ? 'Revision'
                                  : item.action === 'COMPLETE_REVIEW'
                                  ? 'Completed'
                                  : 'Updated'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatRelativeDate(item.timestamp)}
                              </span>
                            </div>

                            {item.itemName && (
                              <p className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-2">
                                {item.itemName}
                              </p>
                            )}

                            {item.fileName && (
                              <p className="font-mono text-[10px] text-slate-500 truncate bg-white rounded px-1.5 py-0.5 border border-slate-200/60">
                                {item.fileName}
                              </p>
                            )}

                            {item.details && (
                              <p className="text-[10px] text-slate-500 leading-snug italic">
                                {item.details}
                              </p>
                            )}

                            <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                              <User className="size-2.5 text-slate-400" />
                              <span className="font-semibold text-slate-700 truncate">{item.userName}</span>
                              <span>•</span>
                              <span className="truncate">{roleFormatted}</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* Main Documents Workspace */}
          <main className="space-y-4 min-w-0">
            {isTemplateEditMode && templateSubTab === 'archived' ? (
              <div className="overflow-hidden rounded-3xl border border-amber-300 bg-white p-6 shadow-sm space-y-4 animate-in fade-in duration-150 font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-amber-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-xl bg-[#0f53b7] text-white shadow-2xs">
                        <Archive className="size-3.5" />
                      </span>
                      <span>Archived Requirements</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Deactivated requirement items are safely stored in Archive. Click <b>Revert & Restore</b> to reactivate them into the active checklist.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    <div className="inline-flex items-center rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTemplateSubTab('active')}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none text-slate-500 hover:text-slate-900"
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateSubTab('archived')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none bg-[#0f53b7] text-white shadow-xs"
                      >
                        <Archive className="size-3.5" />
                        <span>Archive</span>
                      </button>
                    </div>
                  </div>
                </div>

                {archivedTemplates.length === 0 ? (
                  <div className="py-12 text-center text-xs font-medium text-slate-400">
                    No archived or deactivated requirement items found for {activeProgram}.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {archivedTemplates.map((t: any) => (
                      <div
                        key={t.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:bg-white hover:border-amber-300 hover:shadow-xs"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900">
                              {t.phase_code || t.item_code}
                            </span>
                            <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {t.group_name || 'General'}
                            </span>
                            {t.is_mandatory && (
                              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/60">
                                Mandatory
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-950 leading-snug">{t.document_name}</h4>
                          <p className="text-xs text-slate-500 font-medium">{t.phase_title}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRestoreTemplateItem(t.id, t.document_name)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition shadow-2xs cursor-pointer shrink-0"
                          title="Revert and reactivate this requirement template item"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>Revert & Restore</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : isTemplateEditMode && templateSubTab === 'active' ? (
              <div className="space-y-3 font-sans animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border-2 border-[#0f53b7] bg-white p-4 shadow-xs">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal className="size-4.5 text-[#0f53b7]" />
                      <span>Configure Requirements ({activeProgram})</span>
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      Toggle mandatory status, edit template descriptions, or deactivate requirements.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    <div className="inline-flex items-center rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTemplateSubTab('active')}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none bg-white text-slate-950 shadow-xs"
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateSubTab('archived')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer select-none text-slate-500 hover:text-slate-900"
                      >
                        <Archive className="size-3.5" />
                        <span>Archive</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddTemplateModal}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] cursor-pointer"
                    >
                      <Plus className="size-4 stroke-[2.5]" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center">
                    <FileText className="size-8 text-slate-300" />
                    <p className="mt-3 text-sm font-bold text-slate-800">No requirements found</p>
                    <p className="text-xs text-slate-500">Try selecting a different category or add a new requirement.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredItems.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2.5 sm:gap-3">
                        <span className="shrink-0 text-xs sm:text-sm font-bold font-mono text-slate-400 select-none min-w-[24px] text-right">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>

                        <div
                          draggable
                          onDragStart={(e) => {
                            setDraggedIndex(idx)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            setDragOverIndex(idx)
                          }}
                          onDragEnd={() => {
                            setDraggedIndex(null)
                            setDragOverIndex(null)
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggedIndex !== null && draggedIndex !== idx) {
                              handleReorderTemplateItems(draggedIndex, idx)
                            }
                            setDraggedIndex(null)
                            setDragOverIndex(null)
                          }}
                          className={cn(
                            'flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition duration-150 cursor-grab active:cursor-grabbing select-none',
                            draggedIndex === idx && 'opacity-50 border-2 border-dashed border-[#0f53b7] bg-blue-50/40 shadow-md scale-[0.995]',
                            dragOverIndex === idx && draggedIndex !== idx && 'border-2 border-[#0f53b7] bg-blue-50/20 ring-2 ring-blue-100'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-[#0f53b7] transition p-1 rounded-xl hover:bg-slate-100 shrink-0 select-none"
                              title="Drag to reorder requirement position"
                            >
                              <GripVertical className="size-5" />
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                                {item.name}
                              </h4>
                              <p className="text-xs font-medium text-slate-400 truncate">
                                {item.isRequired ? 'Required' : 'Optional'} · PDF or JPG · Max 10MB
                              </p>
                            </div>
                          </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-semibold text-slate-500 select-none">
                              Required
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleTemplateMandatory(item)}
                              className={cn(
                                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                                item.isRequired ? 'bg-blue-600' : 'bg-slate-200'
                              )}
                              title={item.isRequired ? 'Click to set as optional' : 'Click to set as required'}
                            >
                              <span
                                className={cn(
                                  'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                                  item.isRequired ? 'translate-x-5' : 'translate-x-0'
                                )}
                              />
                            </button>
                          </div>

                          <div className="relative flex items-center pl-3 border-l border-slate-200">
                            <button
                              type="button"
                              onClick={() => setRowMenuOpenId(rowMenuOpenId === item.id ? null : item.id)}
                              className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer select-none"
                              title="More options"
                            >
                              <MoreVertical className="size-4.5" />
                            </button>

                            {rowMenuOpenId === item.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={() => setRowMenuOpenId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-100 font-sans text-xs font-semibold text-slate-700">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRowMenuOpenId(null)
                                      handleOpenEditTemplateModal(item)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer select-none"
                                  >
                                    <Pencil className="size-4 text-slate-500" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRowMenuOpenId(null)
                                      handleDeactivateTemplateItem(item)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer select-none"
                                  >
                                    <Archive className="size-4 text-slate-500" />
                                    <span>Archive</span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRowMenuOpenId(null)
                                      handleDeleteTemplateItem(item)
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-rose-50 text-rose-600 transition cursor-pointer select-none"
                                  >
                                    <Trash2 className="size-4 text-rose-500" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Top Workspace Bar: Search, Segmented View Mode Pill, Filter Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-3xl border border-[#B5BFCD]/70 bg-white p-3 sm:px-4 shadow-sm">
              <div className="relative flex-1 min-w-0 sm:max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search requirement name or file..."
                  className="h-10 w-full rounded-2xl border border-[#B5BFCD] bg-slate-50/50 pl-10 pr-4 text-xs sm:text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {/* Segmented View Mode Pill */}
                <div className="flex items-center rounded-2xl border border-[#B5BFCD]/60 bg-slate-100/80 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-xl text-slate-500 transition cursor-pointer',
                      viewMode === 'list'
                        ? 'bg-white text-[#0f53b7] shadow-xs font-bold'
                        : 'hover:text-slate-900'
                    )}
                    title="List View (Default)"
                  >
                    <List className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-xl text-slate-500 transition cursor-pointer',
                      viewMode === 'grid'
                        ? 'bg-white text-[#0f53b7] shadow-xs font-bold'
                        : 'hover:text-slate-900'
                    )}
                    title="Grid View (5 Columns)"
                  >
                    <Grid2X2 className="size-4" />
                  </button>
                </div>

                {/* Filter Button with Dropdown Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-xs font-bold transition shadow-xs cursor-pointer',
                      statusTab !== 'ALL' || isFilterDropdownOpen
                        ? 'border-[#0f53b7] bg-blue-50 text-[#0f53b7]'
                        : 'border-[#B5BFCD] bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <Filter className="size-3.5" />
                    <span>
                      {statusTab === 'ALL'
                        ? 'Filter'
                        : statusTab === 'VERIFIED'
                        ? 'Verified'
                        : statusTab === 'UNDER_REVIEW'
                        ? 'In Review'
                        : statusTab === 'RETURNED'
                        ? 'Revision'
                        : 'Missing File'}
                    </span>
                  </button>

                  {isFilterDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsFilterDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 z-30 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 font-sans">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          Filter by Status
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusTab('ALL')
                            setIsFilterDropdownOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                            statusTab === 'ALL'
                              ? 'bg-blue-50 text-[#0f53b7]'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span>All Requirements</span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {stats.total}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusTab('VERIFIED')
                            setIsFilterDropdownOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                            statusTab === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span>Verified</span>
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {stats.verified}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusTab('UNDER_REVIEW')
                            setIsFilterDropdownOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                            statusTab === 'UNDER_REVIEW'
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-blue-500" />
                            <span>In Review</span>
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {stats.underReview}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusTab('RETURNED')
                            setIsFilterDropdownOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                            statusTab === 'RETURNED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-rose-500" />
                            <span>Revision</span>
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {stats.returned}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusTab('PENDING')
                            setIsFilterDropdownOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                            statusTab === 'PENDING'
                              ? 'bg-slate-100 text-slate-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-slate-400" />
                            <span>Missing File</span>
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {stats.pending}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Document Cards Container (5-Column Grid) */}
            {filteredItems.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center">
                <FileText className="size-8 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-800">No documents found</p>
                <p className="text-xs text-slate-500">Try changing your search query or filter tab.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {filteredItems.map((item, idx) => {
                  const hasFile = Boolean(item.uploadedDoc)
                  const blobUrl = blobMap[item.id] || (item.uploadedDoc?.file_path?.startsWith('blob:') ? item.uploadedDoc.file_path : null)
                  const state = getItemComplianceState(item)

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'group flex flex-col justify-between rounded-2xl border p-2.5 bg-white transition duration-200 hover:shadow-md',
                        state.type === 'RETURNED'
                          ? 'border-rose-300/90 bg-rose-50/15 hover:border-rose-400'
                          : state.type === 'UNDER_REVIEW'
                          ? 'border-blue-200/90 bg-blue-50/10 hover:border-[#0f53b7]/60'
                          : hasFile
                          ? 'border-slate-200/90 hover:border-[#0f53b7]/60'
                          : 'border-dashed border-slate-300 hover:border-[#0f53b7]/60 bg-slate-50/40'
                      )}
                    >
                      <div>
                        <div
                          onClick={() => hasFile ? (canReview ? handleOpenReviewModal(item) : handlePreviewDocument(item)) : canUpload && handleOpenUploadModal(item)}
                          className={cn(
                            'relative h-36 sm:h-40 w-full overflow-hidden rounded-xl border flex flex-col items-center justify-center cursor-pointer transition select-none',
                            hasFile
                              ? 'bg-slate-50 border-slate-200/80 group-hover:border-[#0f53b7]/40 shadow-2xs'
                              : 'bg-white border-dashed border-slate-300 hover:bg-blue-50/40 hover:border-[#0f53b7]'
                          )}
                        >
                          {hasFile ? (
                            <div className="relative h-full w-full overflow-hidden bg-white p-1 flex items-center justify-center">
                              <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow-2xs border border-slate-200/60">
                                <PdfThumbnail
                                  url={blobUrl}
                                  documentId={item.uploadedDoc?.id}
                                  title={item.uploadedDoc?.file_name || item.name}
                                  alt={item.uploadedDoc?.file_name || item.name}
                                />
                              </div>
                              <div className="absolute inset-0 bg-transparent transition group-hover:bg-blue-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="rounded-xl bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white shadow-md flex items-center gap-1">
                                  {canReview ? <FileCheck2 className="size-3" /> : <Eye className="size-3" />}
                                  <span>{canReview ? 'Review' : 'Preview'}</span>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                              <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#0f53b7] transition">
                                <UploadCloud className="size-4.5" />
                              </span>
                              <p className="text-xs font-bold text-slate-700 group-hover:text-[#0f53b7]">
                                Upload PDF
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Click or drag file
                              </p>
                            </div>
                          )}

                          {state.type !== 'PENDING' && (
                            <div className={cn('absolute top-2 left-2 z-10 rounded-md px-2 py-0.5 text-[9px] font-bold shadow-xs', state.badgeClass)}>
                              {state.label}
                            </div>
                          )}

                          {item.uploadedDoc?.archived_versions && item.uploadedDoc.archived_versions.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setVersionModalDoc(item)
                              }}
                              className="absolute top-2 right-2 z-10 inline-flex items-center gap-0.5 rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[9px] font-medium font-mono text-slate-500 border border-slate-200/80 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer shadow-2xs"
                              title={`Version ${item.uploadedDoc.archived_versions.length + 1} (${item.uploadedDoc.archived_versions.length} prior versions - click to view history)`}
                            >
                              <History className="size-2.5 text-slate-400" />
                              <span>v{item.uploadedDoc.archived_versions.length + 1}</span>
                            </button>
                          )}
                        </div>

                        <div className="mt-2.5 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className="truncate text-xs font-bold text-slate-950 flex-1"
                              title={`${idx + 1}. ${item.name}`}
                            >
                              {idx + 1}. {item.name}
                            </h4>
                          </div>

                          {hasFile ? (
                            <p
                              className="truncate text-[11px] text-slate-500 font-medium flex items-center gap-1"
                              title={item.uploadedDoc?.file_name}
                            >
                              <FileText className="size-3 shrink-0 text-slate-400" />
                              <span className="truncate">{item.uploadedDoc?.file_name}</span>
                            </p>
                          ) : (
                            <p className="truncate text-[10px] text-slate-400 font-medium" title={item.group}>
                              {item.group}
                            </p>
                          )}

                          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold">
                                <User className="size-2.5" />
                              </span>
                              <span className="truncate text-slate-700 font-medium text-[10px]">
                                {activeProposal.proponentName.split(' ')[0] || 'Proponent'}
                              </span>
                              <span>•</span>
                              <span className="text-slate-400 shrink-0 text-[10px]">
                                {state.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {hasFile && (
                                <button
                                  type="button"
                                  onClick={() => canReview ? handleOpenReviewModal(item) : handlePreviewDocument(item)}
                                  className={cn(
                                    "inline-flex size-6 items-center justify-center rounded-lg border transition shadow-2xs cursor-pointer",
                                    canReview && (state.type === 'UNDER_REVIEW' || state.type === 'RETURNED')
                                      ? 'border-[#0f53b7] bg-[#0f53b7] text-white hover:bg-[#0b3f8b]'
                                      : 'border-slate-200 text-slate-700 hover:bg-[#E6EEF4]/70 hover:text-[#0f53b7]'
                                  )}
                                  title={canReview ? "Review Document" : "Preview Document"}
                                >
                                  {canReview ? <FileCheck2 className="size-3" /> : <Eye className="size-3" />}
                                </button>
                              )}

                              {hasFile ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!item.uploadedDoc) return
                                      if (item.uploadedDoc.file_path?.startsWith('blob:')) {
                                        const link = document.createElement('a')
                                        link.href = item.uploadedDoc.file_path
                                        link.download = item.uploadedDoc.file_name
                                        document.body.appendChild(link)
                                        link.click()
                                        document.body.removeChild(link)
                                      } else {
                                        const blobUrl = await viewDocumentBlobForStaff(item.uploadedDoc.id)
                                        const link = document.createElement('a')
                                        link.href = blobUrl
                                        link.download = item.uploadedDoc.file_name
                                        document.body.appendChild(link)
                                        link.click()
                                        document.body.removeChild(link)
                                      }
                                    }}
                                    className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                    title="Download"
                                  >
                                    <Download className="size-3" />
                                  </button>

                                  {canUpload && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenUploadModal(item)}
                                        className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition cursor-pointer"
                                        title="Replace Document"
                                      >
                                        <Upload className="size-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFile(item)}
                                        className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                                        title="Remove Document"
                                      >
                                        <Trash2 className="size-3" />
                                      </button>
                                    </>
                                  )}
                                </>
                              ) : (
                                canUpload && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleItemVerify(item.id)}
                                      title={item.isPresent ? 'Checked (Click to uncheck)' : 'Click to manually verify offline'}
                                      className={cn(
                                        'flex size-6 items-center justify-center rounded-lg border transition cursor-pointer',
                                        item.isPresent
                                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                          : 'border-slate-300 bg-white text-transparent hover:border-slate-400 hover:bg-slate-50'
                                      )}
                                    >
                                      <Check className="size-3.5 stroke-[3]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenUploadModal(item)}
                                      className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition cursor-pointer"
                                      title="Upload PDF scan"
                                    >
                                      <Plus className="size-3.5" />
                                    </button>
                                  </>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="divide-y divide-[#B5BFCD]/40 overflow-hidden rounded-3xl border border-[#B5BFCD]/70 bg-white shadow-sm">
                {filteredItems.map((item, idx) => {
                  const hasFile = Boolean(item.uploadedDoc)
                  const state = getItemComplianceState(item)

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 transition hover:bg-[#f7fbff]',
                        state.type === 'RETURNED'
                          ? 'bg-rose-50/20'
                          : state.type === 'UNDER_REVIEW'
                          ? 'bg-blue-50/10'
                          : ''
                      )}
                    >
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className="flex items-center gap-3.5 shrink-0">
                          <div className="mt-0.5">
                            {state.type === 'RETURNED' ? (
                              <span
                                className="flex size-7 items-center justify-center rounded-xl bg-rose-500 text-white shadow-2xs select-none"
                                title="Returned for revision - Needs re-upload"
                              >
                                <RotateCcw className="size-3.5 stroke-[2.5]" />
                              </span>
                            ) : state.type === 'SATISFIED' ? (
                              <span
                                className="flex size-7 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-2xs select-none"
                                title={hasFile ? 'Complied and Satisfied' : 'Verified Offline'}
                              >
                                <Check className="size-4 stroke-[3.5]" />
                              </span>
                            ) : state.type === 'UNDER_REVIEW' ? (
                              <span
                                className="flex size-7 items-center justify-center rounded-xl bg-[#0f53b7] text-white shadow-2xs select-none"
                                title="Uploaded - Pending Focal review"
                              >
                                <FileText className="size-3.5" />
                              </span>
                            ) : isReadOnly ? (
                              <span
                                className="flex size-7 items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-300 select-none cursor-default"
                                title="Pending compliance"
                              >
                                <Minus className="size-3.5 text-slate-300 stroke-[3]" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleItemVerify(item.id)}
                                title="Click to manually verify requirement offline"
                                className="flex size-7 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:bg-emerald-50/50 transition cursor-pointer"
                              >
                                <Check className="size-4 stroke-[3.5]" />
                              </button>
                            )}
                          </div>
                          <span className="h-6 w-px bg-slate-200" />
                        </div>

                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="mt-0.5 shrink-0 text-xs font-bold text-slate-400 font-mono select-none min-w-[22px]">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>

                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold text-slate-950 sm:text-sm">{item.name}</p>
                              {state.label && (
                                <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold', state.badgeClass)}>
                                  {state.label}
                                </span>
                              )}
                              {item.uploadedDoc?.archived_versions && item.uploadedDoc.archived_versions.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setVersionModalDoc(item)}
                                  className="inline-flex items-center gap-0.5 rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[9px] font-medium font-mono text-slate-500 border border-slate-200/80 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                                  title={`Version ${item.uploadedDoc.archived_versions.length + 1} (${item.uploadedDoc.archived_versions.length} prior versions - click to view history)`}
                                >
                                  <History className="size-2.5 text-slate-400" />
                                  <span>v{item.uploadedDoc.archived_versions.length + 1}</span>
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span>{item.group}</span>
                              {hasFile && (
                                <>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={() => handlePreviewDocument(item)}
                                    className="font-semibold text-[#0f53b7] hover:underline cursor-pointer text-left truncate max-w-xs inline-flex items-center gap-1"
                                    title="Click to preview file"
                                  >
                                    <FileText className="size-3 shrink-0" />
                                    <span className="truncate">{item.uploadedDoc?.file_name}</span>
                                    <span className="text-slate-400 font-normal">({formatFileSize(item.uploadedDoc?.file_size)})</span>
                                  </button>
                                </>
                              )}
                            </div>

                            {state.type === 'RETURNED' && (
                              <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-200/90 bg-rose-50/80 p-2.5 text-xs text-rose-900">
                                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-rose-800">Return for Revision Feedback:</p>
                                  <p className="mt-0.5 text-slate-700 leading-relaxed">
                                    {item.remarks || item.uploadedDoc?.remarks || 'Please revise and re-upload this document.'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {(isAdmin || isFocal) && isTemplateEditMode ? (
                        <div className="relative flex items-center pl-11 sm:pl-0 shrink-0 mt-2 sm:mt-0 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => setRowMenuOpenId(rowMenuOpenId === item.id ? null : item.id)}
                            className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer select-none"
                            title="More options"
                          >
                            <MoreVertical className="size-4.5" />
                          </button>

                          {rowMenuOpenId === item.id && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setRowMenuOpenId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-100 font-sans text-xs font-semibold text-slate-700">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRowMenuOpenId(null)
                                    handleOpenEditTemplateModal(item)
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer select-none"
                                >
                                  <Pencil className="size-4 text-slate-500" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setRowMenuOpenId(null)
                                    handleDeactivateTemplateItem(item)
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer select-none"
                                >
                                  <Archive className="size-4 text-slate-500" />
                                  <span>Archive</span>
                                </button>

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setRowMenuOpenId(null)
                                    handleDeleteTemplateItem(item)
                                  }}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-rose-50 text-rose-600 transition cursor-pointer select-none"
                                >
                                  <Trash2 className="size-4 text-rose-500" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pl-11 sm:pl-0 shrink-0 mt-2 sm:mt-0">
                          {hasFile && (
                            <button
                              type="button"
                              onClick={() => canReview ? handleOpenReviewModal(item) : handlePreviewDocument(item)}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer",
                                canReview && (state.type === 'UNDER_REVIEW' || state.type === 'RETURNED')
                                  ? 'border-[#0f53b7] bg-[#0f53b7] text-white hover:bg-[#0b3f8b]'
                                  : 'border-slate-300 bg-white text-slate-700 hover:bg-[#E6EEF4]/60 hover:text-[#0f53b7]'
                              )}
                              title={canReview ? "Review Document" : "Preview Document"}
                            >
                              {canReview ? <FileCheck2 className="size-3.5" /> : <Eye className="size-3.5" />}
                              <span>{canReview ? 'Review' : 'Preview'}</span>
                            </button>
                          )}

                          {canUpload && (
                            hasFile ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUploadModal(item)}
                                  className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition cursor-pointer"
                                  title="Replace Document"
                                >
                                  <Upload className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(item)}
                                  className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenUploadModal(item)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-[#E6EEF4]/60 hover:text-[#0f53b7] transition shadow-2xs cursor-pointer"
                              >
                                <Upload className="size-3.5" />
                                <span>Upload File</span>
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Evaluation Remarks Section (Focal, Admin, or Viewers with recorded remarks) */}
            {!isStaff && (
              <div className="overflow-hidden rounded-3xl border border-[#B5BFCD]/70 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-700">
                    Overall Evaluation Remarks & Notes
                  </label>
                  {canReview && (
                    <span className="text-[11px] font-medium text-slate-400">
                      {autoSaveStatus === 'saving'
                        ? 'Saving remarks...'
                        : autoSaveStatus === 'saved'
                        ? `Saved ${lastSavedTime ? `at ${lastSavedTime}` : ''}`
                        : 'Changes save automatically'}
                    </span>
                  )}
                </div>
                {canReview ? (
                  <textarea
                    rows={2}
                    value={editingOverallRemarks}
                    onChange={(e) => setEditingOverallRemarks(e.target.value)}
                    placeholder="Enter overall review notes or remarks for this project..."
                    className="w-full rounded-2xl border border-[#B5BFCD] bg-slate-50/70 p-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#0f53b7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm"
                  />
                ) : (
                  <div className="w-full rounded-2xl border border-[#B5BFCD] bg-slate-50/70 p-3.5 text-xs text-slate-800">
                    {editingOverallRemarks || <span className="text-slate-400 italic">No overall remarks recorded.</span>}
                  </div>
                )}

                {canMarkComplete && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span
                        className={cn(
                          'size-2 rounded-full',
                          stats.percent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                        )}
                      />
                      <span className="font-semibold text-slate-700">
                        {stats.verified} of {stats.required} requirements verified
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleMarkReviewCompleted}
                      disabled={isCompletingReview}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {isCompletingReview ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4 stroke-[2.5]" />
                      )}
                      <span>Mark Review as Completed</span>
                    </button>
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </main>
        </div>
      )}


      {/* Upload Document Modal (Matching Image 2) */}
      {uploadModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#B5BFCD]/60 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Upload your documents</h3>
              <button
                type="button"
                onClick={handleCloseUploadModal}
                disabled={isUploading}
                className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Requirement</span>
                <p className="text-sm font-bold text-slate-950">{uploadModalItem.name}</p>
                <p className="text-xs text-slate-400">{uploadModalItem.group}</p>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl bg-blue-50/70 p-3 text-xs text-[#0f53b7] border border-blue-100/80">
                <FileText className="size-4 shrink-0 text-[#0f53b7]" />
                <span className="leading-relaxed">
                  Allowed file format: <b>PDF only (.pdf)</b>. Maximum file size: <b>10 MB</b>.
                </span>
              </div>

              {/* Dashed Drag and Drop Zone (Image 2 style) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
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
                      validateAndSetFile(e.target.files[0])
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

              {/* Selected File Card */}
              {selectedUploadFile && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>1 files uploaded</span>
                    <button
                      type="button"
                      onClick={() => setSelectedUploadFile(null)}
                      className="text-slate-400 hover:text-slate-700"
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

            {/* Modal Bottom Buttons (Image 2 style) */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              <button
                type="button"
                onClick={handleCloseUploadModal}
                disabled={isUploading}
                className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={!selectedUploadFile || isUploading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-6 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
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
      )}

      {reviewModalItem && (() => {
        const itemState = getItemComplianceState(reviewModalItem)
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
            {/* Header matching DocumentPreviewModal */}
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

            {/* Main Content Viewport */}
            <div className="relative flex flex-1 flex-col lg:flex-row overflow-hidden bg-slate-100 min-h-0">
              {/* Left Side: Paper sheet centered preview */}
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

              {/* Right Side: Slim Extended Panel */}
              <div className="w-full lg:w-80 shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-[#B5BFCD]/50 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto space-y-4">
                <div className="space-y-4">
                  {/* Requirement Group & Version Info */}
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

                  {/* Uploader Card */}
                  {reviewModalItem.uploadedDoc && (() => {
                    const uploadLog = historyList.find(
                      (h) => (h.action === 'UPLOAD' || h.action === 'REPLACE') && h.itemName === reviewModalItem.name
                    )
                    const uploaderName =
                      uploadLog?.userName ||
                      activeProposal?.proponentName ||
                      'Proponent / Staff'
                    const uploaderRole = uploadLog?.userRole
                      ? ROLE_LABEL[uploadLog.userRole as UserRole] || uploadLog.userRole
                      : 'Proponent'
                    const uploadDate = uploadLog?.timestamp || reviewModalItem.uploadedDoc.created_at

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
                    )
                  })()}

                  {/* Decision Options */}
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

                  {/* Remarks & Findings Textarea */}
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

                {/* Bottom Actions inside slim right panel */}
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

            {/* Footer matching DocumentPreviewModal */}
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
        )
      })()}

      {/* Project Selector Modal Dialog */}
      {isProjectSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#B5BFCD]/60 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 bg-[#f7fbff] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
                  <FolderOpen className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Select Project Proposal</h3>
                  <p className="text-xs text-slate-500">Choose a {activeProgram} proposal to inspect its document checklist</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProjectSelectorOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Search and Filters Bar */}
            <div className="border-b border-[#B5BFCD]/40 bg-white p-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="Search enterprise name, reference number, proponent, or location..."
                  className="h-10 w-full rounded-xl border border-[#B5BFCD] bg-white pl-10 pr-4 text-xs sm:text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status:</span>
                {(['ALL', 'COMPLETE', 'INCOMPLETE'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setModalFilter(filter)}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-bold transition',
                      modalFilter === filter
                        ? 'bg-[#0f53b7] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {filter === 'ALL' ? 'All' : filter === 'COMPLETE' ? 'Complied' : 'Pending'}
                  </button>
                ))}
              </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
              {filteredModalProposals.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Search className="size-6 text-slate-300" />
                  <p className="mt-2 text-xs font-bold text-slate-700">No matching proposals found</p>
                  <p className="text-[11px] text-slate-500">Try searching for a different keyword or change filter.</p>
                </div>
              ) : (
                filteredModalProposals.map((proposal) => {
                  const isComplete = proposal.compliancePercentage >= 100
                  const isSelected = activeProposal?.proposalId === proposal.proposalId

                  return (
                    <button
                      key={proposal.proposalId}
                      type="button"
                      onClick={() => handleSelectProposal(proposal)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition',
                        isSelected
                          ? 'border-[#0f53b7] bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-[#0f53b7]/60 hover:bg-slate-50'
                      )}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-xs sm:text-sm font-bold text-slate-950" title={proposal.enterpriseName}>
                            {proposal.enterpriseName}
                          </h4>
                          {isSelected && (
                            <span className="rounded-full bg-[#0f53b7] px-2 py-0.2 text-[10px] font-bold text-white">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500">
                          <span className="font-mono font-semibold text-[#285497]">{proposal.referenceNumber}</span>
                          <span>•</span>
                          <span>{proposal.proponentName}</span>
                          {proposal.district && (
                            <>
                              <span>•</span>
                              <span>{proposal.district}</span>
                            </>
                          )}
                        </div>

                        {/* Mini progress bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                isComplete ? 'bg-emerald-600' : 'bg-[#0f53b7]'
                              )}
                              style={{ width: `${Math.min(100, proposal.compliancePercentage)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 shrink-0">
                            {proposal.compliedCount}/{proposal.totalRequired} ({proposal.compliancePercentage}%)
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="size-4 text-slate-400 shrink-0" />
                    </button>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#B5BFCD]/40 bg-[#f7fbff] px-6 py-3 text-right">
              <button
                type="button"
                onClick={() => setIsProjectSelectorOpen(false)}
                className="rounded-xl border border-[#B5BFCD] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {versionModalDoc && versionModalDoc.uploadedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
          <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#B5BFCD]/60 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-[#f7fbff]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <History className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Document Version History</h3>
                  <p className="text-xs text-slate-500">Audit trail of current and superseded submissions</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVersionModalDoc(null)}
                className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requirement</span>
                <p className="text-sm font-bold text-slate-950 leading-snug">{versionModalDoc.name}</p>
                <p className="text-[11px] text-slate-500">{versionModalDoc.group}</p>
              </div>

              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase shrink-0">
                      Current Version (V{(versionModalDoc.uploadedDoc.archived_versions?.length || 0) + 1})
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {versionModalDoc.uploadedDoc.file_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const doc = versionModalDoc
                      setVersionModalDoc(null)
                      handlePreviewDocument(doc)
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shrink-0"
                  >
                    <Eye className="size-3" />
                    <span>Preview</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-emerald-100 font-mono">
                  <span>Size: {formatFileSize(versionModalDoc.uploadedDoc.file_size)}</span>
                  <span>Uploaded: {formatRelativeDate(versionModalDoc.uploadedDoc.created_at || versionModalDoc.uploadedDoc.updated_at)}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                    <Archive className="size-3.5" />
                  </span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Archived Versions & Prior History
                  </h4>
                </div>

                {versionModalDoc.uploadedDoc.archived_versions && versionModalDoc.uploadedDoc.archived_versions.length > 0 ? (
                  versionModalDoc.uploadedDoc.archived_versions.map((archived, aIdx) => (
                    <div
                      key={archived.id || aIdx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 hover:bg-white transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-700 shadow-2xs">
                            <Archive className="size-3.5" />
                          </span>
                          <span className="rounded-md bg-slate-200/80 text-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 font-mono">
                            v{archived.version || aIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate" title={archived.file_name}>
                            {archived.file_name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const tempItem = {
                                ...versionModalDoc,
                                uploadedDoc: {
                                  ...versionModalDoc.uploadedDoc!,
                                  file_name: archived.file_name,
                                  file_size: archived.file_size,
                                  file_path: archived.file_path,
                                },
                              }
                              setVersionModalDoc(null)
                              handleOpenReviewModal(tempItem)
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            title="Preview this archived version"
                          >
                            <Eye className="size-3 text-slate-500" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRestoreArchivedVersion(versionModalDoc, archived)}
                            className="inline-flex items-center gap-1 rounded-xl bg-[#0f53b7] px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                            title="Restore this version as active document"
                          >
                            <RotateCcw className="size-3" />
                            <span>Restore</span>
                          </button>
                        </div>
                      </div>

                      {archived.remarks && (
                        <div className="rounded-xl bg-white p-2.5 border border-slate-200 text-xs">
                          <p className="font-bold text-slate-700 text-[11px]">Previous Remarks:</p>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">{archived.remarks}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/70 font-mono">
                        <span>Size: {formatFileSize(archived.file_size)}</span>
                        <span>Archived: {formatRelativeDate(archived.archived_at || archived.created_at)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No previous versions on record.</p>
                )}
              </div>
            </div>

            <div className="border-t border-[#B5BFCD]/40 bg-[#f7fbff] px-6 py-3 text-right">
              <button
                type="button"
                onClick={() => setVersionModalDoc(null)}
                className="rounded-xl border border-[#B5BFCD] bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Document Checklist Template Management Modal (WCAG 2.1 AA) */}
      {isTemplateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="template-modal-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#E6EEF4]/60 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#0f53b7] text-white shadow-xs">
                  <PlusCircle className="size-5" />
                </span>
                <div>
                  <h3 id="template-modal-title" className="text-base font-bold text-slate-900">
                    {editingTemplateItem ? 'Edit Requirement' : `Add ${activeProgram} Requirement`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingTemplateItem ? 'Update requirement details' : `Add a new document requirement for ${activeProgram}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseTemplateModal}
                disabled={isSubmittingTemplate}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplateModal} className="p-6 space-y-4">
              <div>
                <label htmlFor="document_name" className="block text-xs font-bold text-slate-700 mb-1">
                  Document Requirement Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="document_name"
                  type="text"
                  required
                  value={templateFormData.document_name}
                  onChange={(e) => setTemplateFormData((prev) => ({ ...prev, document_name: e.target.value }))}
                  placeholder="e.g. Mayor's Business Permit 2026"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#0f53b7] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phase_code" className="block text-xs font-bold text-slate-700 mb-1">
                    {activeProgram === 'GIA' ? 'Stage Category' : 'SET Category'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="phase_code"
                    value={templateFormData.phase_code}
                    onChange={(e) => {
                      const val = e.target.value
                      const catMatch = categories.find((c) => c.id === val)
                      setTemplateFormData((prev) => ({
                        ...prev,
                        phase_code: val,
                        phase_title: catMatch?.name || prev.phase_title,
                      }))
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#0f53b7] focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="group_name" className="block text-xs font-bold text-slate-700 mb-1">
                    Group Category <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="group_name"
                    type="text"
                    required
                    value={templateFormData.group_name}
                    onChange={(e) => setTemplateFormData((prev) => ({ ...prev, group_name: e.target.value }))}
                    placeholder="e.g. Business Documents"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#0f53b7] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                <input
                  id="is_mandatory"
                  type="checkbox"
                  checked={templateFormData.is_mandatory}
                  onChange={(e) => setTemplateFormData((prev) => ({ ...prev, is_mandatory: e.target.checked }))}
                  className="size-4 rounded border-slate-300 text-[#0f53b7] focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="is_mandatory" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
                  Mandatory Requirement (Includes item in total compliance count calculation)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseTemplateModal}
                  disabled={isSubmittingTemplate}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTemplate}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0b3f8b] transition shadow-xs cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {isSubmittingTemplate && <LoaderCircle className="size-3.5 animate-spin" />}
                  <span>{editingTemplateItem ? 'Save Changes' : 'Add Requirement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewDoc.isOpen}
        onClose={() => setPreviewDoc((prev) => ({ ...prev, isOpen: false }))}
        title={previewDoc.title}
        fileName={previewDoc.fileName}
        fileSize={previewDoc.fileSize}
        uploadedAt={previewDoc.uploadedAt}
        status={previewDoc.status}
        blobUrl={previewDoc.blobUrl}
        isLoading={previewDoc.isLoading}
        error={previewDoc.error}
        onDownload={handleDownloadPreviewFile}
        onOpenNewTab={handleOpenPreviewNewTab}
      />

      {/* Floating Dark Toast Notification for Archive & Undo */}
      {archiveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 rounded-2xl bg-[#333333] p-4 text-white shadow-2xl backdrop-blur-md border border-slate-700/80 animate-in slide-in-from-bottom-5 fade-in duration-200 min-w-[340px] max-w-md w-[92vw]">
          <style>{`
            @keyframes toastProgress {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-xs font-bold text-white truncate leading-snug">
                "{archiveToast.name}"
              </p>
              <p className="text-xs text-slate-300 font-medium">
                is now <span className="font-bold text-slate-200">inactive</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (archiveToast.templateId) {
                    handleRestoreTemplateItem(archiveToast.templateId, archiveToast.name)
                  }
                  if (archiveToastTimerRef.current) {
                    clearTimeout(archiveToastTimerRef.current)
                  }
                  setArchiveToast(null)
                }}
                className="rounded-xl bg-[#4a4a4a] hover:bg-[#5a5a5a] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-200 transition cursor-pointer border border-slate-600/50 shadow-2xs"
              >
                UNDO
              </button>

              <button
                type="button"
                onClick={() => {
                  if (archiveToastTimerRef.current) {
                    clearTimeout(archiveToastTimerRef.current)
                  }
                  setArchiveToast(null)
                }}
                className="flex size-7 items-center justify-center rounded-xl text-slate-400 hover:bg-[#444444] hover:text-white transition cursor-pointer"
                title="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="h-0.5 w-full bg-slate-700/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-200"
              style={{ animation: 'toastProgress 5s linear forwards' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
