import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Grid2X2,
  List,
  LoaderCircle,
  Lock,
  MapPin,
  RefreshCw,
  Search,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'
import Swal from 'sweetalert2'

import { ROLES } from '../../config/permissions'
import { getMockUser } from '../../lib/mockAuth'
import { viewDocumentBlobForStaff } from '../../services/documentStore'
import {
  fetchChecklistProposals,
  saveProposalChecklistReview,
  GIA_STAGES,
  SETUP_SETS,
  type ChecklistItemStatus,
  type DocumentChecklistItem,
  type ProposalChecklistRecord,
} from '../../services/documentChecklistStore'
import { cn } from '../../utils/cn'

const PER_PAGE = 6

export function DocumentChecklistPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = getMockUser()

  const isRpmo = currentUser?.role === ROLES.RPMO
  const isReadOnly = isRpmo

  const userProgram = currentUser?.program as 'SETUP' | 'GIA' | undefined
  const canSwitchProgram =
    !userProgram ||
    isRpmo ||
    currentUser?.role === ROLES.PROVINCIAL_DIRECTOR ||
    currentUser?.role === ROLES.SYSTEM_ADMIN

  const activeProgram: 'SETUP' | 'GIA' = useMemo(() => {
    if (!canSwitchProgram && userProgram) return userProgram
    const param = searchParams.get('program')?.toUpperCase()
    if (param === 'GIA') return 'GIA'
    return 'SETUP'
  }, [searchParams, canSwitchProgram, userProgram])

  const [proposals, setProposals] = useState<ProposalChecklistRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETE' | 'INCOMPLETE'>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedProposal, setSelectedProposal] = useState<ProposalChecklistRecord | null>(null)
  const [editingItems, setEditingItems] = useState<DocumentChecklistItem[]>([])
  const [editingOverallRemarks, setEditingOverallRemarks] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [viewingDocId, setViewingDocId] = useState<number | null>(null)

  const setProgram = (prog: 'SETUP' | 'GIA') => {
    setSearchParams({ program: prog })
    setCurrentPage(1)
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

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, activeProgram])

  const programProposals = useMemo(() => {
    return proposals.filter((p) => p.program === activeProgram)
  }, [proposals, activeProgram])

  const filteredProposals = useMemo(() => {
    return programProposals.filter((p) => {
      if (statusFilter === 'COMPLETE' && p.compliancePercentage < 100) return false
      if (statusFilter === 'INCOMPLETE' && p.compliancePercentage >= 100) return false

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = p.enterpriseName.toLowerCase().includes(query)
        const matchRef = p.referenceNumber.toLowerCase().includes(query)
        const matchProponent = p.proponentName.toLowerCase().includes(query)
        if (!matchTitle && !matchRef && !matchProponent) return false
      }

      return true
    })
  }, [programProposals, statusFilter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / PER_PAGE))
  const paginatedProposals = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE
    return filteredProposals.slice(start, start + PER_PAGE)
  }, [filteredProposals, currentPage])

  const stats = useMemo(() => {
    const total = programProposals.length
    const complete = programProposals.filter((p) => p.compliancePercentage >= 100).length
    const incomplete = total - complete
    return { total, complete, incomplete }
  }, [programProposals])

  const openReviewModal = (proposal: ProposalChecklistRecord) => {
    setSelectedProposal(proposal)
    setEditingItems(JSON.parse(JSON.stringify(proposal.items)))
    setEditingOverallRemarks(proposal.overallRemarks || '')
  }

  const closeReviewModal = () => {
    if (isSaving) return
    setSelectedProposal(null)
    setEditingItems([])
    setEditingOverallRemarks('')
  }

  const handleToggleItem = (itemId: string) => {
    if (isReadOnly) return
    setEditingItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        const nextPresent = !item.isPresent
        const nextStatus: ChecklistItemStatus = nextPresent ? 'Complied' : 'Missing'
        return {
          ...item,
          isPresent: nextPresent,
          status: nextStatus,
        }
      })
    )
  }

  const handleItemRemarksChange = (itemId: string, text: string) => {
    if (isReadOnly) return
    setEditingItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, remarks: text } : item))
    )
  }

  const handleMarkAllPresent = () => {
    if (isReadOnly) return
    setEditingItems((prev) =>
      prev.map((item) => ({
        ...item,
        isPresent: true,
        status: 'Complied',
      }))
    )
  }

  const handleViewDocument = async (docId: number) => {
    setViewingDocId(docId)
    try {
      const blobUrl = await viewDocumentBlobForStaff(docId)
      window.open(blobUrl, '_blank')
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Preview Failed',
        text: 'Could not preview document file.',
        confirmButtonColor: '#0f53b7',
      })
    } finally {
      setViewingDocId(null)
    }
  }

  const handleSaveChecklist = async () => {
    if (!selectedProposal || isReadOnly) return
    setIsSaving(true)

    try {
      await saveProposalChecklistReview(
        selectedProposal.proposalId,
        editingItems,
        editingOverallRemarks
      )

      const totalRequired = editingItems.filter((i) => i.isRequired).length || editingItems.length
      const compliedCount = editingItems.filter((i) => (i.isRequired ? i.isPresent : false)).length
      const compliancePercentage = totalRequired > 0 ? Math.round((compliedCount / totalRequired) * 100) : 0

      setProposals((prev) =>
        prev.map((p) => {
          if (p.proposalId !== selectedProposal.proposalId) return p
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

      Swal.fire({
        icon: 'success',
        title: 'Checklist Saved',
        text: 'Document checklist evaluation has been updated successfully.',
        timer: 1800,
        showConfirmButton: false,
      })

      closeReviewModal()
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: (err as Error)?.message || 'Could not save checklist evaluation.',
        confirmButtonColor: '#0f53b7',
      })
    } finally {
      setIsSaving(false)
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

  const selectedCompliedCount = editingItems.filter((i) => i.isRequired && i.isPresent).length
  const selectedTotalRequired = editingItems.filter((i) => i.isRequired).length || editingItems.length
  const selectedPercent =
    selectedTotalRequired > 0 ? Math.round((selectedCompliedCount / selectedTotalRequired) * 100) : 0

  const allStructuredSections = useMemo(() => {
    if (!selectedProposal) return []

    if (selectedProposal.program === 'GIA') {
      return GIA_STAGES.map((stage) => {
        const stageItems = editingItems.filter((item) => item.stageId === stage.id)
        const groupsMap = new Map<string, DocumentChecklistItem[]>()
        stageItems.forEach((item) => {
          const list = groupsMap.get(item.group) || []
          list.push(item)
          groupsMap.set(item.group, list)
        })

        const complied = stageItems.filter((i) => (i.isRequired ? i.isPresent : false)).length
        const total = stageItems.filter((i) => i.isRequired).length || stageItems.length

        return {
          id: stage.id,
          header: `${stage.number}: ${stage.title}`,
          subtitle: stage.subtitle,
          badge: `${complied}/${total} Complied`,
          isComplete: total > 0 && complied >= total,
          groups: Array.from(groupsMap.entries()),
        }
      })
    }

    return SETUP_SETS.map((setDef) => {
      const setItems = editingItems.filter((item) => item.setId === setDef.id)
      const groupsMap = new Map<string, DocumentChecklistItem[]>()
      setItems.forEach((item) => {
        const list = groupsMap.get(item.group) || []
        list.push(item)
        groupsMap.set(item.group, list)
      })

      const complied = setItems.filter((i) => (i.isRequired ? i.isPresent : false)).length
      const total = setItems.filter((i) => i.isRequired).length || setItems.length

      return {
        id: setDef.id,
        header: setDef.title,
        subtitle: setDef.subtitle,
        badge: `${complied}/${total} Complied`,
        isComplete: total > 0 && complied >= total,
        groups: Array.from(groupsMap.entries()),
      }
    })
  }, [editingItems, selectedProposal])

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0f53b7] shadow-sm">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {activeProgram} Document Checklist
                </h1>
                {isReadOnly && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    <Lock className="h-3 w-3" />
                    Regional View
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 sm:text-sm">
                {activeProgram === 'SETUP'
                  ? 'Verify and manage all SET 1, SET 2, and SET 3 documentary requirements for SETUP proposals.'
                  : 'Verify and manage all 5-stage documentary requirements and reports for Grants-in-Aid projects.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canSwitchProgram && (
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setProgram('SETUP')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition',
                  activeProgram === 'SETUP'
                    ? 'bg-white text-[#0f53b7] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                SETUP
              </button>
              <button
                type="button"
                onClick={() => setProgram('GIA')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition',
                  activeProgram === 'GIA'
                    ? 'bg-white text-[#0f53b7] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                GIA
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={exportSummaryCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4 text-slate-500', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Proposals
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0f53b7]">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500">applications in queue</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Complete Compliance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{stats.complete}</span>
            <span className="text-xs font-medium text-emerald-600">100% verified</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Compliance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{stats.incomplete}</span>
            <span className="text-xs font-medium text-amber-600">missing documents</span>
          </div>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search enterprise, proponent name, or reference no..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 transition focus:border-[#0f53b7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f53b7]/15 sm:text-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'COMPLETE' | 'INCOMPLETE')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition focus:border-[#0f53b7] focus:outline-none sm:text-sm"
            >
              <option value="ALL">All Compliance Status</option>
              <option value="COMPLETE">Complete Compliance</option>
              <option value="INCOMPLETE">Pending Compliance</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-lg p-2 transition',
                viewMode === 'grid'
                  ? 'bg-blue-50 text-[#0f53b7]'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              )}
              title="Grid View"
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'rounded-lg p-2 transition',
                viewMode === 'table'
                  ? 'bg-blue-50 text-[#0f53b7]'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              )}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main List Area */}
      {isLoading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <LoaderCircle className="h-8 w-8 animate-spin text-[#0f53b7]" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Loading {activeProgram} checklists...</p>
          <p className="text-xs text-slate-400">Fetching proposals and requirement verification data</p>
        </div>
      ) : loadError ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center shadow-sm">
          <XCircle className="h-10 w-10 text-rose-500" />
          <p className="mt-3 text-sm font-semibold text-rose-800">Error loading checklists</p>
          <p className="mt-1 text-xs text-rose-600">{loadError}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      ) : paginatedProposals.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-800">No {activeProgram} proposals found</p>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search criteria or filter selection.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedProposals.map((proposal) => {
            const isComplete = proposal.compliancePercentage >= 100
            return (
              <div
                key={proposal.proposalId}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-[#0f53b7]/30 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold font-mono text-slate-700">
                      {proposal.referenceNumber}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                        proposal.program === 'SETUP'
                          ? 'bg-blue-50 text-[#0f53b7]'
                          : 'bg-emerald-50 text-emerald-700'
                      )}
                    >
                      {proposal.program}
                    </span>
                  </div>

                  <h3 className="mt-3 line-clamp-1 text-base font-bold text-slate-900" title={proposal.enterpriseName}>
                    {proposal.enterpriseName}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{proposal.proponentName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{proposal.district || 'Davao Oriental'}</span>
                    </div>
                  </div>

                  {/* Compliance Progress */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Compliance Rate</span>
                      <span
                        className={cn(
                          'font-bold',
                          isComplete ? 'text-emerald-600' : 'text-[#0f53b7]'
                        )}
                      >
                        {proposal.compliedCount} / {proposal.totalRequired} ({proposal.compliancePercentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          isComplete ? 'bg-emerald-500' : 'bg-[#0f53b7]'
                        )}
                        style={{ width: `${Math.min(100, proposal.compliancePercentage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-bold',
                        isComplete
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      )}
                    >
                      {isComplete ? 'Complied' : 'Pending Documents'}
                    </span>

                    <button
                      type="button"
                      onClick={() => openReviewModal(proposal)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition',
                        isReadOnly ? 'bg-slate-700 hover:bg-slate-800' : 'bg-[#0f53b7] hover:bg-[#0c4496]'
                      )}
                    >
                      <span>{isReadOnly ? 'View Checklist' : 'Review Checklist'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 sm:text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Reference & Title</th>
                  <th className="px-5 py-3.5">Proponent</th>
                  <th className="px-5 py-3.5">Program</th>
                  <th className="px-5 py-3.5">Compliance</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProposals.map((proposal) => {
                  const isComplete = proposal.compliancePercentage >= 100
                  return (
                    <tr key={proposal.proposalId} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{proposal.enterpriseName}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{proposal.referenceNumber}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">{proposal.proponentName}</div>
                        <div className="text-xs text-slate-400">{proposal.district}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                            proposal.program === 'SETUP'
                              ? 'bg-blue-50 text-[#0f53b7]'
                              : 'bg-emerald-50 text-emerald-700'
                          )}
                        >
                          {proposal.program}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{proposal.compliancePercentage}%</span>
                            <span className="text-slate-400">
                              {proposal.compliedCount}/{proposal.totalRequired}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cn(
                                'h-full transition-all',
                                isComplete ? 'bg-emerald-500' : 'bg-[#0f53b7]'
                              )}
                              style={{ width: `${Math.min(100, proposal.compliancePercentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] font-bold',
                            isComplete
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          )}
                        >
                          {isComplete ? 'Complied' : 'Pending Documents'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openReviewModal(proposal)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition',
                            isReadOnly ? 'bg-slate-700 hover:bg-slate-800' : 'bg-[#0f53b7] hover:bg-[#0c4496]'
                          )}
                        >
                          <span>{isReadOnly ? 'View' : 'Review'}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredProposals.length > PER_PAGE && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-3 shadow-sm">
          <span className="text-xs text-slate-500">
            Showing <strong className="font-semibold text-slate-700">{(currentPage - 1) * PER_PAGE + 1}</strong> to{' '}
            <strong className="font-semibold text-slate-700">
              {Math.min(currentPage * PER_PAGE, filteredProposals.length)}
            </strong>{' '}
            of <strong className="font-semibold text-slate-700">{filteredProposals.length}</strong> proposals
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Checklist Review Modal showing ALL documents */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm',
                    selectedProposal.program === 'SETUP' ? 'bg-[#0f53b7]' : 'bg-emerald-600'
                  )}
                >
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 sm:text-lg">{selectedProposal.enterpriseName}</h2>
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[11px] font-bold',
                        selectedProposal.program === 'SETUP'
                          ? 'bg-blue-100 text-[#0f53b7]'
                          : 'bg-emerald-100 text-emerald-800'
                      )}
                    >
                      {selectedProposal.program}
                    </span>
                    {isReadOnly && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        <Lock className="h-3 w-3" />
                        Regional View
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Ref No: <span className="font-mono font-semibold text-slate-700">{selectedProposal.referenceNumber}</span> | Proponent: <span className="font-medium text-slate-700">{selectedProposal.proponentName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeReviewModal}
                disabled={isSaving}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Progress Strip */}
            <div className="border-b border-slate-100 bg-white px-6 py-3.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Compliance:</span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-bold',
                      selectedPercent >= 100
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {selectedPercent >= 100
                      ? 'All Requirements Complied'
                      : `${selectedCompliedCount} of ${selectedTotalRequired} Complied (${selectedPercent}%)`}
                  </span>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMarkAllPresent}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Mark All as Complied</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    selectedPercent >= 100
                      ? 'bg-emerald-500'
                      : selectedProposal.program === 'SETUP'
                      ? 'bg-[#0f53b7]'
                      : 'bg-emerald-600'
                  )}
                  style={{ width: `${Math.min(100, selectedPercent)}%` }}
                />
              </div>
            </div>

            {/* Modal Checklist Body showing ALL Documents Across All Sets/Stages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
              {allStructuredSections.map((section) => (
                <div key={section.id} className="space-y-4">
                  {/* Section Main Header (Set or Stage) */}
                  <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 sm:text-base">
                        {section.header}
                      </h3>
                      {section.subtitle && (
                        <p className="text-xs text-slate-500">{section.subtitle}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-bold shrink-0',
                        section.isComplete
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      )}
                    >
                      {section.badge}
                    </span>
                  </div>

                  {/* Groups inside this Set/Stage */}
                  <div className="space-y-4 pl-1 sm:pl-2">
                    {section.groups.map(([groupName, items]) => (
                      <div key={groupName} className="space-y-2">
                        {groupName && groupName !== 'General Requirements' && groupName !== 'General Documentary Requirements' && (
                          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
                            {groupName}
                          </h4>
                        )}

                        <div className="rounded-2xl border border-slate-200/90 divide-y divide-slate-100 bg-white overflow-hidden shadow-sm">
                          {items.map((item, index) => {
                            const hasFile = Boolean(item.uploadedDoc)
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  'flex flex-col gap-3 p-3.5 transition sm:flex-row sm:items-start sm:justify-between',
                                  item.isPresent ? 'bg-white' : 'bg-slate-50/40'
                                )}
                              >
                                {/* Checkbox and Details */}
                                <div className="flex items-start gap-3.5 flex-1">
                                  <label className={cn('relative mt-0.5 flex items-center', !isReadOnly && 'cursor-pointer')}>
                                    <input
                                      type="checkbox"
                                      checked={item.isPresent}
                                      disabled={isReadOnly}
                                      onChange={() => handleToggleItem(item.id)}
                                      className="h-5 w-5 rounded-md border-slate-300 text-[#0f53b7] focus:ring-[#0f53b7]/20 disabled:cursor-not-allowed disabled:opacity-75"
                                    />
                                  </label>

                                  <div className="space-y-1 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={cn(
                                          'text-xs font-bold sm:text-sm',
                                          item.isPresent ? 'text-slate-900' : 'text-slate-700'
                                        )}
                                      >
                                        {index + 1}. {item.name}
                                      </span>
                                      {item.isRequired && (
                                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                                          Required
                                        </span>
                                      )}
                                    </div>

                                    {/* Attached Document info */}
                                    {hasFile ? (
                                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                          <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                                          {item.uploadedDoc?.file_name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleViewDocument(item.uploadedDoc!.id)}
                                          disabled={viewingDocId === item.uploadedDoc!.id}
                                          className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 font-semibold text-[#0f53b7] hover:bg-blue-100 transition disabled:opacity-50"
                                        >
                                          {viewingDocId === item.uploadedDoc!.id ? (
                                            <LoaderCircle className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Eye className="h-3 w-3" />
                                          )}
                                          <span>Preview PDF</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-slate-400">No applicant upload attached to this requirement.</p>
                                    )}

                                    {/* Remarks field per requirement */}
                                    <div className="mt-2">
                                      {isReadOnly ? (
                                        item.remarks ? (
                                          <p className="text-xs text-slate-700 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
                                            <span className="font-semibold text-slate-500">Remarks: </span>
                                            {item.remarks}
                                          </p>
                                        ) : null
                                      ) : (
                                        <input
                                          type="text"
                                          value={item.remarks}
                                          onChange={(e) => handleItemRemarksChange(item.id, e.target.value)}
                                          placeholder="Enter remarks / notes regarding this requirement..."
                                          className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#0f53b7] focus:bg-white focus:outline-none"
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Status Tag */}
                                <div className="sm:text-right pl-8 sm:pl-0">
                                  <span
                                    className={cn(
                                      'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                                      item.isPresent
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-rose-50 text-rose-600'
                                    )}
                                  >
                                    {item.isPresent ? 'Complied' : 'Missing'}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Overall Evaluation Remarks */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Overall Evaluation Remarks
                </label>
                {isReadOnly ? (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-800 sm:text-sm">
                    {editingOverallRemarks || <span className="text-slate-400 italic">No overall remarks recorded.</span>}
                  </div>
                ) : (
                  <textarea
                    rows={2}
                    value={editingOverallRemarks}
                    onChange={(e) => setEditingOverallRemarks(e.target.value)}
                    placeholder="Enter summary remarks or evaluation notes for this dossier..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#0f53b7] focus:bg-white focus:outline-none sm:text-sm"
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={isSaving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Close
              </button>

              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveChecklist}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0f53b7] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0c4496] disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        <span>Saving Evaluation...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Save Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
