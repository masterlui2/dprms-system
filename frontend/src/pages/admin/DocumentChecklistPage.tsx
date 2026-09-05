import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  Grid2X2,
  Inbox,
  List,
  LoaderCircle,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UploadCloud,
  User,
  X,
  XCircle,
} from 'lucide-react'
import Swal from 'sweetalert2'

import { ROLES } from '../../config/permissions'
import { AnimatedTabs } from '../../components/common/AnimatedTabs'
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal'
import { getMockUser } from '../../lib/mockAuth'
import { viewDocumentBlobForStaff } from '../../services/documentStore'
import {
  fetchChecklistProposals,
  removeChecklistDocument,
  saveProposalChecklistReview,
  uploadChecklistDocument,
  GIA_STAGES,
  SETUP_SETS,
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


export function DocumentChecklistPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = getMockUser()

  const isRpmo = currentUser?.role === ROLES.RPMO
  const isReadOnly = isRpmo

  const userProgram = currentUser?.program as 'SETUP' | 'GIA' | undefined
  const isFocal = currentUser?.role === ROLES.FOCAL

  const canSwitchProgram =
    !isFocal &&
    (isRpmo ||
      currentUser?.role === ROLES.PROVINCIAL_DIRECTOR ||
      currentUser?.role === ROLES.SYSTEM_ADMIN)

  const activeProgram: 'SETUP' | 'GIA' = useMemo(() => {
    if (isFocal) return userProgram === 'GIA' ? 'GIA' : 'SETUP'
    const param = searchParams.get('program')?.toUpperCase()
    if (param === 'GIA') return 'GIA'
    if (param === 'SETUP') return 'SETUP'
    return userProgram || 'SETUP'
  }, [searchParams, isFocal, userProgram])

  const [proposals, setProposals] = useState<ProposalChecklistRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null)
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false)
  const [modalSearchQuery, setModalSearchQuery] = useState('')
  const [modalFilter, setModalFilter] = useState<'ALL' | 'COMPLETE' | 'INCOMPLETE'>('ALL')

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [statusTab, setStatusTab] = useState<'ALL' | 'UPLOADED' | 'PENDING'>('ALL')
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

  const [editingItems, setEditingItems] = useState<DocumentChecklistItem[]>([])
  const [editingOverallRemarks, setEditingOverallRemarks] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null)
  const [isCompletingReview, setIsCompletingReview] = useState(false)
  const lastSavedPayloadRef = useRef<string>('')

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

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const setProgram = (prog: 'SETUP' | 'GIA') => {
    setSearchParams({ program: prog })
    setSelectedCategory('ALL')
  }

  const loadData = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await fetchChecklistProposals()
      setProposals(data)
    } catch (err) {
      setLoadError((err as Error)?.message || 'Failed to load document checklists')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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
    } else {
      setSelectedProposalId(null)
      setEditingItems([])
      setEditingOverallRemarks('')
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
    let cancelled = false
    const itemsWithDocs = editingItems.filter((i) => i.uploadedDoc)

    itemsWithDocs.forEach(async (item) => {
      const doc = item.uploadedDoc!
      if (blobMap[item.id]) return

      if (doc.file_path && doc.file_path.startsWith('blob:')) {
        if (!cancelled) {
          setBlobMap((prev) => ({ ...prev, [item.id]: doc.file_path }))
        }
        return
      }

      if (doc.id) {
        try {
          const blobUrl = await viewDocumentBlobForStaff(doc.id)
          if (!cancelled) {
            setBlobMap((prev) => ({ ...prev, [item.id]: blobUrl }))
          }
        } catch {
          //
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [editingItems])

  const categories = useMemo(() => {
    if (activeProgram === 'GIA') {
      return GIA_STAGES.map((s) => ({
        id: s.id,
        name: `Stage ${s.number}: ${s.shortTitle}`,
        shortName: s.shortTitle,
        subtitle: s.subtitle,
      }))
    }
    return SETUP_SETS.map((s) => ({
      id: s.id,
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

      if (statusTab === 'UPLOADED' && !item.uploadedDoc && !item.isPresent) return false
      if (statusTab === 'PENDING' && (item.uploadedDoc || item.isPresent)) return false

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
    const uploaded = editingItems.filter((i) => Boolean(i.uploadedDoc)).length
    const verified = editingItems.filter((i) => i.isPresent).length
    const pending = total - verified
    const percent = required > 0 ? Math.round((verified / required) * 100) : 0

    return {
      total,
      required,
      uploaded,
      verified,
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

    setEditingItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const nextPresent = !item.isPresent
        const nextStatus: ChecklistItemStatus = nextPresent ? 'Complied' : 'Missing'
        return {
          ...item,
          isPresent: nextPresent,
          status: nextStatus,
          reviewedAt: nextPresent ? new Date().toISOString() : undefined,
        }
      })
    )
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

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedUploadFile(e.dataTransfer.files[0])
    }
  }

  const handleConfirmUpload = async () => {
    if (!uploadModalItem || !selectedUploadFile || !activeProposal || isReadOnly) return
    setIsUploading(true)

    try {
      const { uploadedDoc, blobUrl } = await uploadChecklistDocument(
        activeProposal.proposalId,
        uploadModalItem,
        selectedUploadFile
      )

      setBlobMap((prev) => ({ ...prev, [uploadModalItem.id]: blobUrl }))

      setEditingItems((prev) =>
        prev.map((item) => {
          if (item.id !== uploadModalItem.id) return item
          return {
            ...item,
            isPresent: true,
            status: 'Complied',
            uploadedDoc,
            reviewedAt: new Date().toISOString(),
          }
        })
      )

      Swal.fire({
        icon: 'success',
        title: 'Document Uploaded',
        text: `${selectedUploadFile.name} uploaded and verified successfully.`,
        timer: 1600,
        showConfirmButton: false,
      })

      handleCloseUploadModal()
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Failed to upload document. Please try again.',
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

    setBlobMap((prev) => {
      const next = { ...prev }
      delete next[item.id]
      return next
    })

    setEditingItems((prev) =>
      prev.map((i) => {
        if (i.id !== item.id) return i
        return {
          ...i,
          isPresent: false,
          status: 'Missing',
          uploadedDoc: null,
        }
      })
    )

    Swal.fire({
      icon: 'success',
      title: 'Document Removed',
      text: 'The attachment has been cleared.',
      timer: 1400,
      showConfirmButton: false,
    })
  }

  const handlePreviewDocument = async (item: DocumentChecklistItem) => {
    if (!item.uploadedDoc) return

    const docId = item.uploadedDoc.id
    const existingBlob = blobMap[item.id] || (item.uploadedDoc.file_path?.startsWith('blob:') ? item.uploadedDoc.file_path : null)

    setPreviewDoc({
      isOpen: true,
      title: item.name,
      fileName: item.uploadedDoc.file_name,
      fileSize: item.uploadedDoc.file_size,
      uploadedAt: item.uploadedDoc.created_at || item.uploadedDoc.updated_at,
      status: item.status,
      blobUrl: existingBlob,
      isLoading: !existingBlob,
      error: null,
      docId,
    })

    if (!existingBlob && docId) {
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
            <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
              Documents
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

          {canSwitchProgram && (
            <AnimatedTabs
              layoutId="checklist-program-tabs"
              activeTab={activeProgram}
              onChange={(id) => setProgram(id as 'SETUP' | 'GIA')}
              tabs={[
                { id: 'SETUP', label: 'SETUP' },
                { id: 'GIA', label: 'GIA' },
              ]}
            />
          )}

          <button
            type="button"
            onClick={exportSummaryCsv}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <FileSpreadsheet className="size-4 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={cn('size-4 text-slate-500', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
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
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#B5BFCD] bg-white py-2 text-xs font-bold text-slate-700 hover:bg-[#E6EEF4]/60 hover:text-[#0f53b7] hover:border-[#0f53b7]/30 transition shadow-2xs"
              >
                <Search className="size-3.5 text-slate-400" />
                <span>Switch Project ({programProposals.length})</span>
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
                  'flex w-full items-center justify-between gap-1.5 rounded-xl px-2.5 py-2 text-left text-[11.5px] transition',
                  selectedCategory === 'ALL'
                    ? 'bg-[#0f53b7] font-bold text-white shadow-xs'
                    : 'font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Inbox className="size-4 shrink-0" />
                  <span className="whitespace-nowrap tracking-tight">All Requirements</span>
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

              {categories.map((cat) => {
                const catItems = editingItems.filter((i) => i.setId === cat.id || i.stageId === cat.id)
                const catComplied = catItems.filter((i) => i.isPresent).length
                const catTotal = catItems.length
                const isCatComplete = catTotal > 0 && catComplied >= catTotal

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-1.5 rounded-xl px-2.5 py-2 text-left text-[11.5px] transition',
                      selectedCategory === cat.id
                        ? 'bg-[#0f53b7] font-bold text-white shadow-xs'
                        : 'font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-nowrap tracking-tight" title={cat.shortName}>{cat.shortName}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                        selectedCategory === cat.id
                          ? 'bg-white/20 text-white'
                          : isCatComplete
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {catComplied}/{catTotal}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* Main Documents Workspace */}
          <main className="space-y-4 min-w-0">
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
                        : statusTab === 'UPLOADED'
                        ? 'Uploaded'
                        : 'Pending'}
                    </span>
                    {statusTab !== 'ALL' && (
                      <span className="flex size-2 rounded-full bg-[#0f53b7]" />
                    )}
                  </button>

                  {isFilterDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsFilterDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 z-30 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 font-sans">
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
                            {editingItems.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStatusTab('UPLOADED')
                            setIsFilterDropdownOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer',
                            statusTab === 'UPLOADED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span>Uploaded Files</span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {stats.uploaded}
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
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span>Pending Upload</span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {editingItems.length - stats.uploaded}
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
                  const blobUrl = blobMap[item.id]

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'group flex flex-col justify-between rounded-2xl border p-2.5 bg-white transition duration-200 hover:shadow-md',
                        hasFile
                          ? 'border-slate-200/90 hover:border-[#0f53b7]/60'
                          : 'border-dashed border-slate-300 hover:border-[#0f53b7]/60 bg-slate-50/40'
                      )}
                    >
                      <div>
                        <div
                          onClick={() => hasFile ? handlePreviewDocument(item) : !isReadOnly && handleOpenUploadModal(item)}
                          className={cn(
                            'relative h-36 sm:h-40 w-full overflow-hidden rounded-xl border flex flex-col items-center justify-center cursor-pointer transition select-none',
                            hasFile
                              ? 'bg-slate-50 border-slate-200/80 group-hover:border-[#0f53b7]/40 shadow-2xs'
                              : 'bg-white border-dashed border-slate-300 hover:bg-blue-50/40 hover:border-[#0f53b7]'
                          )}
                        >
                          {hasFile ? (
                            blobUrl ? (
                              <div className="relative h-full w-full overflow-hidden bg-white p-1.5 flex items-center justify-center">
                                <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow-2xs border border-slate-200/60">
                                  <iframe
                                    src={`${blobUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                    className="pointer-events-none absolute -top-4 -left-4 w-[130%] h-[155%] scale-[1.08] origin-top border-0 select-none bg-white"
                                    title={item.name}
                                  />
                                </div>
                                <div className="absolute inset-0 bg-transparent transition group-hover:bg-blue-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <span className="rounded-xl bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white shadow-md flex items-center gap-1">
                                    <Eye className="size-3" />
                                    <span>Expand</span>
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center bg-white">
                                <FileCheck2 className="size-8 text-[#0f53b7]" />
                                <p className="text-[11px] font-bold text-slate-700 truncate max-w-[140px]">
                                  {item.uploadedDoc?.file_name}
                                </p>
                                <LoaderCircle className="size-3.5 animate-spin text-slate-400 mt-1" />
                              </div>
                            )
                          ) : item.isPresent ? (
                            <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                              <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 shadow-2xs">
                                <Check className="size-4 stroke-[2.5]" />
                              </span>
                              <p className="text-xs font-semibold text-slate-800">
                                Verified
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Offline document verified
                              </p>
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
                        </div>

                        <div className="mt-2.5 space-y-1.5">
                          <h4
                            className="truncate text-xs font-bold text-slate-950"
                            title={hasFile ? item.uploadedDoc?.file_name : item.name}
                          >
                            {hasFile ? item.uploadedDoc?.file_name : `${idx + 1}. ${item.name}`}
                          </h4>

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
                                {hasFile ? (
                                  formatRelativeDate(item.uploadedDoc?.created_at)
                                ) : item.isPresent ? (
                                  <span className="font-medium text-emerald-600">Verified</span>
                                ) : (
                                  'Pending'
                                )}
                              </span>
                            </div>

                            {hasFile ? (
                              <div className="flex items-center gap-1 shrink-0">
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
                                  className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                                  title="Download"
                                >
                                  <Download className="size-3" />
                                </button>

                                {!isReadOnly && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenUploadModal(item)}
                                      className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition"
                                      title="Replace Document"
                                    >
                                      <Upload className="size-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFile(item)}
                                      className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                                      title="Remove Document"
                                    >
                                      <Trash2 className="size-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              !isReadOnly && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleItemVerify(item.id)}
                                    title={item.isPresent ? 'Checked (Click to uncheck)' : 'Click to check requirement'}
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
                                    className="inline-flex size-6 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition"
                                    title="Upload PDF scan"
                                  >
                                    <Plus className="size-3.5" />
                                  </button>
                                </div>
                              )
                            )}
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

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 transition hover:bg-[#f7fbff]"
                    >
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className="flex items-center gap-3.5 shrink-0">
                          <div className="mt-0.5">
                            {hasFile ? (
                              <span
                                className="flex size-7 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-2xs select-none"
                                title="Document uploaded and verified"
                              >
                                <Check className="size-4 stroke-[3.5]" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleToggleItemVerify(item.id)}
                                title={
                                  item.isPresent
                                    ? 'Checked (Click to uncheck)'
                                    : 'Click to check requirement'
                                }
                                className={cn(
                                  'flex size-7 items-center justify-center rounded-xl border-2 transition cursor-pointer',
                                  item.isPresent
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs hover:bg-emerald-600 hover:border-emerald-600'
                                    : 'border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:bg-emerald-50/50'
                                )}
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

                          <div className="space-y-0.5 min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-950 sm:text-sm">{item.name}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span>{item.group}</span>
                              {hasFile && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-[#0f53b7]">
                                    {item.uploadedDoc?.file_name} ({formatFileSize(item.uploadedDoc?.file_size)})
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-11 sm:pl-0 shrink-0">
                        {hasFile ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePreviewDocument(item)}
                              className="inline-flex items-center gap-1 rounded-xl bg-[#E6EEF4] px-3 py-1.5 text-xs font-bold text-[#285497] hover:bg-blue-100 transition"
                            >
                              <Eye className="size-3" />
                              <span>Preview</span>
                            </button>
                            {!isReadOnly && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUploadModal(item)}
                                  className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-[#0f53b7] transition"
                                  title="Replace Document"
                                >
                                  <Upload className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(item)}
                                  className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                                  title="Delete Document"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          !isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleOpenUploadModal(item)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0b3f8b] transition"
                            >
                              <Plus className="size-3" />
                              <span>Upload Document</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Evaluation Remarks Section */}
            <div className="overflow-hidden rounded-3xl border border-[#B5BFCD]/70 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-700">
                  Overall Evaluation Remarks & Notes
                </label>
                {!isReadOnly && (
                  <span className="text-[11px] font-medium text-slate-400">
                    {autoSaveStatus === 'saving'
                      ? 'Saving remarks...'
                      : autoSaveStatus === 'saved'
                      ? `Saved ${lastSavedTime ? `at ${lastSavedTime}` : ''}`
                      : 'Changes save automatically'}
                  </span>
                )}
              </div>
              {isReadOnly ? (
                <div className="w-full rounded-2xl border border-[#B5BFCD] bg-slate-50/70 p-3.5 text-xs text-slate-800">
                  {editingOverallRemarks || <span className="text-slate-400 italic">No overall remarks recorded.</span>}
                </div>
              ) : (
                <textarea
                  rows={2}
                  value={editingOverallRemarks}
                  onChange={(e) => setEditingOverallRemarks(e.target.value)}
                  placeholder="Enter overall review notes or remarks for this project..."
                  className="w-full rounded-2xl border border-[#B5BFCD] bg-slate-50/70 p-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#0f53b7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm"
                />
              )}

              {!isReadOnly && (
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
                  accept="application/pdf,image/*,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedUploadFile(e.target.files[0])
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
                  Image and document up to 10 mb file
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
                          <span>•</span>
                          <span>{proposal.district || 'Davao Oriental'}</span>
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
    </div>
  )
}
