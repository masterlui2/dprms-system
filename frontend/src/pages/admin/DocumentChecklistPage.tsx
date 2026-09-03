import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCheck,
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
  RotateCcw,
  Search,
  Store,
  X,
  XCircle,
} from 'lucide-react'
import Swal from 'sweetalert2'

import { ROLES } from '../../config/permissions'
import { AnimatedTabs } from '../../components/common/AnimatedTabs'
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

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETE' | 'INCOMPLETE'>('ALL')
  const [viewMode, setViewMode] = useState<'box' | 'list'>('box')
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedProposal, setSelectedProposal] = useState<ProposalChecklistRecord | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string>('')
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
    const totalRequiredDocs = programProposals.reduce((sum, p) => sum + p.totalRequired, 0)
    const totalCompliedDocs = programProposals.reduce((sum, p) => sum + p.compliedCount, 0)
    const coverage = totalRequiredDocs > 0 ? Math.round((totalCompliedDocs / totalRequiredDocs) * 100) : 0

    return {
      total,
      complete,
      incomplete,
      coverage,
    }
  }, [programProposals])

  const openReviewModal = (proposal: ProposalChecklistRecord) => {
    setSelectedProposal(proposal)
    setEditingItems(JSON.parse(JSON.stringify(proposal.items)))
    setEditingOverallRemarks(proposal.overallRemarks || '')
    setActiveSectionId(proposal.program === 'GIA' ? 'STAGE_01' : 'SET_1')
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
    const isAllComplied = selectedPercent >= 100
    setEditingItems((prev) =>
      prev.map((item) => ({
        ...item,
        isPresent: !isAllComplied,
        status: !isAllComplied ? 'Complied' : 'Missing',
      }))
    )
  }

  const handleToggleSectionAll = (sectionId: string, targetChecked: boolean) => {
    if (isReadOnly) return
    setEditingItems((prev) =>
      prev.map((item) => {
        const belongsToSection = item.setId === sectionId || item.stageId === sectionId
        if (!belongsToSection) return item
        return {
          ...item,
          isPresent: targetChecked,
          status: targetChecked ? 'Complied' : 'Missing',
        }
      })
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
  const selectedMissingCount = Math.max(0, selectedTotalRequired - selectedCompliedCount)
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
          number: stage.number,
          shortTitle: stage.shortTitle,
          header: `${stage.number}: ${stage.title}`,
          subtitle: stage.subtitle,
          badge: `${complied}/${total} Complied`,
          complied,
          total,
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
        number: setDef.id.replace('SET', 'SET '),
        shortTitle: setDef.shortTitle,
        header: setDef.title,
        subtitle: setDef.subtitle,
        badge: `${complied}/${total} Complied`,
        complied,
        total,
        isComplete: total > 0 && complied >= total,
        groups: Array.from(groupsMap.entries()),
      }
    })
  }, [editingItems, selectedProposal])

  const scrollToSection = (id: string) => {
    setActiveSectionId(id)
    const el = document.getElementById(`section-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Page Header */}
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
              Document Checklist
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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

      {/* Overview Stat Cards (Matching Project Monitoring Theme) */}
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-[#B5BFCD]/70 bg-white p-5 shadow-sm transition hover:border-[#0f53b7]/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                Active Proposals
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {stats.total}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Total {activeProgram} proposals under documentary evaluation
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0f53b7]">
              <FileText className="size-5" />
            </span>
          </div>
        </article>

        <article className="rounded-2xl border border-[#B5BFCD]/70 bg-white p-5 shadow-sm transition hover:border-emerald-500/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                Complete Compliance
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-emerald-700">
                {stats.complete}
              </p>
              <p className="mt-2 text-xs font-medium text-emerald-600">
                {stats.coverage}% overall documentary completion rate
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </span>
          </div>
        </article>

        <article className="rounded-2xl border border-[#B5BFCD]/70 bg-white p-5 shadow-sm transition hover:border-amber-500/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                Pending Documents
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-amber-700">
                {stats.incomplete}
              </p>
              <p className="mt-2 text-xs font-medium text-amber-600">
                {stats.incomplete === 0 ? 'All dossiers are fully complied' : 'Proposals with missing requirements'}
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <AlertCircle className="size-5" />
            </span>
          </div>
        </article>
      </div>

      {/* Main Section Card with Header & Filter Bar (Aligned with Approvals & Monitored Projects) */}
      <section className="overflow-hidden rounded-2xl border border-[#B5BFCD]/70 bg-white shadow-sm">
        <div className="flex flex-col gap-3.5 border-b border-[#B5BFCD]/50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block min-w-0 flex-1 lg:max-w-md">
            <span className="sr-only">Search proposals</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enterprise, proponent, or reference..."
              className="h-10 w-full rounded-xl border border-[#B5BFCD] bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2.5">
            <label>
              <span className="sr-only">Filter by compliance status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'COMPLETE' | 'INCOMPLETE')}
                className="h-10 rounded-xl border border-[#B5BFCD] bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100 sm:w-44"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETE">Complied</option>
                <option value="INCOMPLETE">Pending</option>
              </select>
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode('box')}
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl border border-[#B5BFCD] transition',
                  viewMode === 'box'
                    ? 'bg-[#E6EEF4] text-[#285497] border-[#0f53b7]/30'
                    : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                )}
                title="Box View"
              >
                <Grid2X2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl border border-[#B5BFCD] transition',
                  viewMode === 'list'
                    ? 'bg-[#E6EEF4] text-[#285497] border-[#0f53b7]/30'
                    : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                )}
                title="List View"
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center text-sm text-slate-400">
            <LoaderCircle className="size-7 animate-spin text-[#0f53b7]" />
            <p className="mt-3 font-semibold text-slate-700">Loading {activeProgram} checklists…</p>
          </div>
        ) : loadError ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center text-sm text-red-500">
            <XCircle className="size-8 text-rose-500" />
            <p className="mt-2 font-bold">{loadError}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-4 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
            >
              Try again
            </button>
          </div>
        ) : paginatedProposals.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#E6EEF4] text-[#285497]">
              <Search className="size-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-slate-900">
              No matching proposals found
            </h3>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
              Try a different search term or change your compliance status filter.
            </p>
          </div>
        ) : viewMode === 'box' ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedProposals.map((proposal) => {
              const isComplete = proposal.compliancePercentage >= 100
              const Icon = proposal.program === 'GIA' ? FileSpreadsheet : Store

              return (
                <article
                  key={proposal.proposalId}
                  className="flex min-w-0 flex-col justify-between rounded-2xl border border-[#B5BFCD]/65 bg-white p-4 transition hover:border-[#0f53b7]/60 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
                        <Icon className="size-4.5" />
                      </span>
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
                    </div>

                    <h3 className="mt-4 truncate text-base font-bold text-slate-950" title={proposal.enterpriseName}>
                      {proposal.enterpriseName}
                    </h3>
                    <p className="mt-0.5 truncate text-xs font-semibold text-[#285497] font-mono">
                      {proposal.referenceNumber}
                    </p>
                    <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{proposal.district || 'Davao Oriental'}</span>
                    </p>

                    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
                      <div className="min-w-0">
                        <dt className="text-[11px] text-slate-400">Proponent</dt>
                        <dd className="mt-0.5 truncate font-bold text-slate-800">{proposal.proponentName}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] text-slate-400">Assigned Reviewer</dt>
                        <dd className="mt-0.5 truncate font-bold text-slate-800">{proposal.focalName || 'Focal'}</dd>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <dt className="text-[11px] text-slate-400">Compliance Rate</dt>
                        <dd className="mt-0.5 font-bold text-slate-800">
                          {proposal.compliedCount} of {proposal.totalRequired} verified ({proposal.compliancePercentage}%)
                        </dd>
                      </div>
                    </dl>

                    {/* Progress Bar */}
                    <div className="mt-3.5">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            isComplete ? 'bg-emerald-600' : 'bg-[#0f53b7]'
                          )}
                          style={{ width: `${Math.min(100, proposal.compliancePercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openReviewModal(proposal)}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0f53b7] text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3f8b] active:scale-[0.99]"
                  >
                    <span>{isReadOnly ? 'Open checklist view' : 'Open checklist evaluation'}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="divide-y divide-[#B5BFCD]/40">
            {paginatedProposals.map((proposal) => {
              const isComplete = proposal.compliancePercentage >= 100
              return (
                <article
                  key={proposal.proposalId}
                  className="grid gap-3 px-5 py-4 transition hover:bg-[#E6EEF4]/35 md:grid-cols-[minmax(220px,1.4fr)_minmax(160px,0.8fr)_minmax(150px,0.7fr)_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-slate-950">{proposal.enterpriseName}</h3>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                          isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        )}
                      >
                        {isComplete ? 'Complied' : 'Pending'}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                      <MapPin className="size-3.5 shrink-0" />
                      <span>{proposal.district || 'Davao Oriental'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono font-semibold text-[#285497]">{proposal.referenceNumber}</span>
                    </p>
                  </div>

                  <div className="min-w-0 text-xs">
                    <p className="text-[11px] text-slate-400">Proponent</p>
                    <p className="font-bold text-slate-800 truncate">{proposal.proponentName}</p>
                  </div>

                  <div className="min-w-0 text-xs">
                    <p className="text-[11px] text-slate-400">Compliance</p>
                    <p className="font-bold text-slate-800">
                      {proposal.compliedCount}/{proposal.totalRequired} ({proposal.compliancePercentage}%)
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => openReviewModal(proposal)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0f53b7] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3f8b]"
                    >
                      <span>{isReadOnly ? 'View' : 'Review'}</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {filteredProposals.length > PER_PAGE && (
          <div className="flex items-center justify-between border-t border-[#B5BFCD]/50 px-5 py-3">
            <span className="text-xs text-slate-500">
              Showing <strong className="font-bold text-slate-800">{(currentPage - 1) * PER_PAGE + 1}</strong> to{' '}
              <strong className="font-bold text-slate-800">
                {Math.min(currentPage * PER_PAGE, filteredProposals.length)}
              </strong>{' '}
              of <strong className="font-bold text-slate-800">{filteredProposals.length}</strong> proposals
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-[#B5BFCD] text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 text-xs font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-[#B5BFCD] text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Comprehensive Checklist Review Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6 font-sans">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#B5BFCD]/60 bg-[#f7fbff] px-6 py-4">
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E6EEF4] text-[#285497] shadow-sm">
                  <ClipboardCheck className="size-5.5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-950 sm:text-lg">{selectedProposal.enterpriseName}</h2>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        selectedProposal.program === 'SETUP'
                          ? 'bg-blue-50 text-[#0f53b7]'
                          : 'bg-emerald-50 text-emerald-700'
                      )}
                    >
                      {selectedProposal.program}
                    </span>
                    {isReadOnly && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                        <Lock className="size-3" />
                        Regional View
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Ref No: <span className="font-mono font-bold text-[#285497]">{selectedProposal.referenceNumber}</span> | Proponent: <span className="font-bold text-slate-800">{selectedProposal.proponentName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeReviewModal}
                disabled={isSaving}
                className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Top Dossier KPI Bar */}
            <div className="border-b border-[#B5BFCD]/50 bg-white px-6 py-3.5 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    Compliance Rate:
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-3 py-0.5 text-xs font-bold',
                      selectedPercent >= 100
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                    )}
                  >
                    {selectedPercent >= 100
                      ? 'Fully Complied'
                      : `${selectedCompliedCount} of ${selectedTotalRequired} Complied (${selectedPercent}%)`}
                  </span>
                  {selectedMissingCount > 0 && (
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200/70">
                      {selectedMissingCount} missing
                    </span>
                  )}
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    {selectedPercent >= 100 ? (
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 shadow-xs transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 active:scale-[0.98]"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>Reset All</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleMarkAllPresent}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-xs transition hover:bg-emerald-100 hover:border-emerald-400 active:scale-[0.98]"
                      >
                        <CheckCheck className="size-3.5 text-emerald-600" />
                        <span>Mark All as Complied</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Gauge */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    selectedPercent >= 100 ? 'bg-emerald-600' : 'bg-[#0f53b7]'
                  )}
                  style={{ width: `${Math.min(100, selectedPercent)}%` }}
                />
              </div>

              {/* Section Jump Anchors (Underline Animation) */}
              <div className="flex items-center gap-3 overflow-x-auto pt-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0 pb-1">
                  Jump to:
                </span>
                <AnimatedTabs
                  layoutId="modal-section-underline-tabs"
                  variant="underline"
                  activeTab={activeSectionId || allStructuredSections[0]?.id || ''}
                  onChange={scrollToSection}
                  tabs={allStructuredSections.map((sec) => ({
                    id: sec.id,
                    label: sec.shortTitle || sec.number,
                    count: `${sec.complied}/${sec.total}`,
                  }))}
                />
              </div>
            </div>

            {/* Modal Checklist Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
              {allStructuredSections.map((section) => (
                <div key={section.id} id={`section-${section.id}`} className="space-y-4 pt-1">
                  {/* Section Main Header (Set or Stage) */}
                  <div className="flex flex-col gap-2 border-b border-[#B5BFCD]/60 pb-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="h-5 w-1 rounded-full bg-[#0f53b7]" />
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wide text-slate-950 sm:text-base">
                          {section.header}
                        </h3>
                        {section.subtitle && (
                          <p className="mt-0.5 text-xs text-slate-500">{section.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      {!isReadOnly && (
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 px-3 py-1 text-xs font-bold text-slate-700 hover:text-[#0f53b7] transition shadow-2xs">
                          <input
                            type="checkbox"
                            checked={section.isComplete}
                            ref={(el) => {
                              if (el) {
                                el.indeterminate = section.complied > 0 && !section.isComplete
                              }
                            }}
                            onChange={(e) => handleToggleSectionAll(section.id, e.target.checked)}
                            className="size-4 rounded border-[#B5BFCD] text-[#0f53b7] focus:ring-[#0f53b7]/20 cursor-pointer"
                          />
                          <span>
                            {section.isComplete
                              ? 'All Complied'
                              : section.complied > 0
                                ? `Select All (${section.complied}/${section.total})`
                                : `Select All (${section.total})`}
                          </span>
                        </label>
                      )}
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-bold shrink-0',
                          section.isComplete
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {section.badge}
                      </span>
                    </div>
                  </div>

                  {/* Groups inside this Set/Stage */}
                  <div className="space-y-4">
                    {section.groups.map(([groupName, items]) => (
                      <div key={groupName} className="space-y-2">
                        {groupName && groupName !== 'General Requirements' && groupName !== 'General Documentary Requirements' && (
                          <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600 pl-1">
                            {groupName}
                          </h4>
                        )}

                        <div className="overflow-hidden rounded-2xl border border-[#B5BFCD]/70 divide-y divide-[#B5BFCD]/40 bg-white shadow-sm">
                          {items.map((item, index) => {
                            const hasFile = Boolean(item.uploadedDoc)
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  'flex flex-col gap-3 p-4 transition sm:flex-row sm:items-start sm:justify-between',
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
                                      className="size-5 rounded-md border-[#B5BFCD] text-[#0f53b7] focus:ring-[#0f53b7]/20 disabled:cursor-not-allowed disabled:opacity-75"
                                    />
                                  </label>

                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={cn(
                                          'text-xs font-bold sm:text-sm',
                                          item.isPresent ? 'text-slate-950' : 'text-slate-800'
                                        )}
                                      >
                                        {index + 1}. {item.name}
                                      </span>
                                      {item.isRequired && (
                                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                          Required
                                        </span>
                                      )}
                                    </div>

                                    {/* Attached Document info */}
                                    {hasFile ? (
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                                          <FileCheck2 className="size-3.5 text-emerald-600" />
                                          {item.uploadedDoc?.file_name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleViewDocument(item.uploadedDoc!.id)}
                                          disabled={viewingDocId === item.uploadedDoc!.id}
                                          className="inline-flex items-center gap-1 rounded-lg bg-[#E6EEF4] px-2.5 py-1 font-bold text-[#285497] hover:bg-blue-100 transition disabled:opacity-50"
                                        >
                                          {viewingDocId === item.uploadedDoc!.id ? (
                                            <LoaderCircle className="size-3 animate-spin" />
                                          ) : (
                                            <Eye className="size-3" />
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
                                          <p className="text-xs text-slate-700 bg-slate-50 rounded-xl px-3.5 py-2 border border-[#B5BFCD]/60">
                                            <span className="font-bold text-slate-500">Remarks: </span>
                                            {item.remarks}
                                          </p>
                                        ) : null
                                      ) : (
                                        <input
                                          type="text"
                                          value={item.remarks}
                                          onChange={(e) => handleItemRemarksChange(item.id, e.target.value)}
                                          placeholder="Enter remarks or deficiency notes..."
                                          className="h-8.5 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#0f53b7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100/50"
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Status Tag */}
                                <div className="sm:text-right pl-8 sm:pl-0">
                                  <span
                                    className={cn(
                                      'inline-block rounded-full px-2.5 py-1 text-[11px] font-bold',
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
                <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-700">
                  Overall Evaluation Remarks
                </label>
                {isReadOnly ? (
                  <div className="w-full rounded-2xl border border-[#B5BFCD] bg-slate-50/70 p-4 text-xs text-slate-800 sm:text-sm">
                    {editingOverallRemarks || <span className="text-slate-400 italic">No overall remarks recorded.</span>}
                  </div>
                ) : (
                  <textarea
                    rows={2}
                    value={editingOverallRemarks}
                    onChange={(e) => setEditingOverallRemarks(e.target.value)}
                    placeholder="Enter summary notes or final evaluation remarks for this dossier..."
                    className="w-full rounded-2xl border border-[#B5BFCD] bg-slate-50/70 p-3.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#0f53b7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm"
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#B5BFCD]/60 bg-[#f7fbff] px-6 py-4">
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={isSaving}
                className="h-10 rounded-xl border border-[#B5BFCD] bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Close
              </button>

              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveChecklist}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-6 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3f8b] active:scale-[0.99] disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        <span>Saving Evaluation...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-4" />
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
