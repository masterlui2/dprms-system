import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Grid2X2,
  List,
  LoaderCircle,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Store,
} from 'lucide-react'
import { fetchProjects, type Program, type ProjectRecord } from '../../services/projectStore'
import { cn } from '../../utils/cn'

interface Props {
  onSelectProject: (project: any) => void
  viewMode?: 'box' | 'list'
  onViewModeChange?: (mode: 'box' | 'list') => void
  program?: Program
  projects?: any
  searchValue?: string
  isFiltering?: boolean
  pagination?: any
  districtValue?: string
  districts?: string[]
  agencyValue?: string
  agencies?: string[]
  statusValue?: string
  statuses?: string[]
  onSearchChange?: (value: string) => void
  onDistrictChange?: (value: string) => void
  onAgencyChange?: (value: string) => void
  onStatusChange?: (value: string) => void
  onPageChange?: (page: number) => void
}

const PER_PAGE = 6

function readableStatus(value?: string): string {
  if (!value) return 'Not started'
  return value.toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function getInitials(name: string): string {
  if (!name) return 'DO'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ProjectStatus({ project }: { project: ProjectRecord }) {
  if (project.program === 'GIA') {
    if (project.compliance === 'Overdue') {
      return <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">Delayed milestone</span>
    }
    return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0f53b7]">{project.progress}% complete</span>
  }

  const pending = project.pendingReports ?? 0
  if (pending > 0) {
    return <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">{pending} pending</span>
  }
  if (project.monitored) {
    return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Monitored</span>
  }
  return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">Newly Active</span>
}

function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs animate-pulse space-y-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-slate-100" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 rounded-md bg-slate-200" />
              <div className="h-3 w-20 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-5 w-16 rounded-full bg-slate-100" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-3/4 rounded bg-slate-100" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="h-3 w-14 rounded bg-slate-200" />
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200" />
        </div>
        <div className="mt-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-200" />
          </div>
          <div className="h-5 w-20 rounded-md bg-slate-100" />
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex gap-2">
        <div className="h-8.5 w-20 rounded-xl bg-slate-100" />
        <div className="h-8.5 flex-1 rounded-xl bg-slate-200" />
      </div>
    </div>
  )
}

export function MonitoredProjectsSection({
  onSelectProject,
  viewMode: propViewMode,
  onViewModeChange,
  program,
  projects: passedProjects,
  searchValue: propSearchValue,
  isFiltering = false,
  pagination: propPagination,
  districtValue: propDistrictValue,
  districts: propDistricts,
  agencyValue: propAgencyValue,
  agencies: propAgencies,
  statusValue: propStatusValue,
  statuses: propStatuses,
  onSearchChange,
  onDistrictChange,
  onAgencyChange,
  onStatusChange,
  onPageChange,
}: Props) {
  const navigate = useNavigate()
  const [internalViewMode, setInternalViewMode] = useState<'box' | 'list'>('box')
  const viewMode = propViewMode ?? internalViewMode
  const setViewMode = (mode: 'box' | 'list') => {
    setInternalViewMode(mode)
    onViewModeChange?.(mode)
  }

  const isControlled = passedProjects !== undefined
  const [fetchedProjects, setFetchedProjects] = useState<ProjectRecord[]>([])
  const [isLoadingInternal, setIsLoadingInternal] = useState(!isControlled)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [internalSearch, setInternalSearch] = useState('')
  const [internalAgency, setInternalAgency] = useState('')
  const [internalStatus, setInternalStatus] = useState('')
  const [internalPage, setInternalPage] = useState(1)

  useEffect(() => {
    if (isControlled) return
    let cancelled = false
    setIsLoadingInternal(true)
    fetchProjects()
      .then((data) => {
        if (!cancelled) {
          setFetchedProjects(data)
          setIsLoadingInternal(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err?.message ?? 'Failed to load projects')
          setIsLoadingInternal(false)
        }
      })
    return () => { cancelled = true }
  }, [isControlled])

  const searchValue = isControlled ? (propSearchValue ?? '') : internalSearch
  const agencyValue = isControlled ? (propAgencyValue ?? '') : internalAgency
  const statusValue = isControlled ? (propStatusValue ?? '') : internalStatus
  const districtValue = propDistrictValue ?? ''

  const handleSearchChange = (val: string) => {
    if (onSearchChange) onSearchChange(val)
    else setInternalSearch(val)
  }

  const handleAgencyChange = (val: string) => {
    if (onAgencyChange) onAgencyChange(val)
    else setInternalAgency(val)
  }

  const handleStatusChange = (val: string) => {
    if (onStatusChange) onStatusChange(val)
    else setInternalStatus(val)
  }

  const handleDistrictChange = (val: string) => {
    onDistrictChange?.(val)
  }

  const handlePageChange = (page: number) => {
    if (onPageChange) onPageChange(page)
    else setInternalPage(page)
  }

  const fallbackScoped = useMemo(() => {
    if (isControlled) return []
    return program ? fetchedProjects.filter((p) => p.program === program) : fetchedProjects
  }, [isControlled, program, fetchedProjects])

  const isGia = program === 'GIA' || (isControlled ? passedProjects?.some((p: any) => p.program === 'GIA') : fallbackScoped.some((p) => p.program === 'GIA'))

  const agencies = propAgencies ?? Array.from(new Set(fallbackScoped.map((p) => p.agency).filter(Boolean))).sort()
  const statuses = propStatuses ?? Array.from(new Set(fallbackScoped.map((p) => p.status))).sort()
  const districts = propDistricts ?? []

  const projects: ProjectRecord[] = isControlled
    ? (Array.isArray(passedProjects) ? passedProjects : [])
    : useMemo(() => {
        const term = internalSearch.trim().toLowerCase()
        const filtered = fallbackScoped.filter((p) => {
          if (term) {
            const haystack = `${p.enterprise} ${p.referenceNumber} ${p.location}`.toLowerCase()
            if (!haystack.includes(term)) return false
          }
          if (internalAgency && p.agency !== internalAgency) return false
          if (internalStatus && p.status !== internalStatus) return false
          return true
        })
        const pageStart = (internalPage - 1) * PER_PAGE
        return filtered.slice(pageStart, pageStart + PER_PAGE)
      }, [fallbackScoped, internalSearch, internalAgency, internalStatus, internalPage])

  const pagination = isControlled && propPagination ? propPagination : {
    currentPage: internalPage,
    lastPage: Math.max(1, Math.ceil(fallbackScoped.length / PER_PAGE)),
    total: fallbackScoped.length,
    from: fallbackScoped.length === 0 ? 0 : (internalPage - 1) * PER_PAGE + 1,
    to: Math.min(internalPage * PER_PAGE, fallbackScoped.length),
  }

  const visiblePages = Array.from({ length: pagination.lastPage || 1 }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === pagination.lastPage || Math.abs(page - pagination.currentPage) <= 1,
  )

  const hasActiveFilters = searchValue.trim() !== '' || agencyValue !== '' || statusValue !== '' || districtValue !== ''

  const clearFilters = () => {
    handleSearchChange('')
    handleAgencyChange('')
    handleStatusChange('')
    if (onDistrictChange) onDistrictChange('')
  }

  if (!isControlled && isLoadingInternal) {
    return <div className="py-10 text-center text-sm text-slate-400">Loading projects…</div>
  }

  if (loadError) {
    return <div className="py-10 text-center text-sm text-red-500">{loadError}</div>
  }

  return (
    <div className="space-y-4 font-sans">
      <section className="overflow-hidden rounded-2xl border border-[#B5BFCD]/70 bg-white shadow-sm">
        <div className="flex flex-col gap-3.5 border-b border-[#B5BFCD]/50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block min-w-0 flex-1 lg:max-w-md">
            <span className="sr-only">Search monitored projects</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={isGia ? 'Search agency, project, or reference...' : 'Search enterprise, reference, or address...'}
              className="h-10 w-full rounded-xl border border-[#B5BFCD] bg-white pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100"
            />
            {isFiltering ? (
              <LoaderCircle className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#0f53b7]" />
            ) : null}
          </label>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isGia && districts.length > 0 ? (
              <label>
                <span className="sr-only">Filter by district</span>
                <select
                  value={districtValue}
                  onChange={(event) => handleDistrictChange(event.target.value)}
                  className="h-10 rounded-xl border border-[#B5BFCD] bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100 sm:w-44"
                >
                  <option value="">All Districts</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </label>
            ) : null}

            {isGia && agencies.length > 0 ? (
              <label>
                <span className="sr-only">Filter by implementing agency</span>
                <select
                  value={agencyValue}
                  onChange={(event) => handleAgencyChange(event.target.value)}
                  className="h-10 rounded-xl border border-[#B5BFCD] bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100 sm:w-48"
                >
                  <option value="">All Agencies</option>
                  {agencies.map((agency) => (
                    <option key={agency} value={agency}>{agency}</option>
                  ))}
                </select>
              </label>
            ) : null}

            {statuses.length > 0 ? (
              <label>
                <span className="sr-only">Filter by monitoring status</span>
                <select
                  value={statusValue}
                  onChange={(event) => handleStatusChange(event.target.value)}
                  className="h-10 rounded-xl border border-[#B5BFCD] bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100 sm:w-44"
                >
                  <option value="">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{readableStatus(status)}</option>
                  ))}
                </select>
              </label>
            ) : null}

            <button
              type="button"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] hover:shadow-sm"
              title="Add Active Project"
            >
              <Plus className="size-4" />
              <span>Add Active Project</span>
            </button>

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

        {isFiltering && projects.length === 0 ? (
          <div className="grid gap-4.5 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <ProjectCardSkeleton key={idx} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#E6EEF4] text-[#285497]">
              <Search className="size-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-slate-900">
              {hasActiveFilters ? 'No matching projects' : `No active ${isGia ? 'GIA' : 'SETUP'} projects`}
            </h3>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
              {hasActiveFilters
                ? 'Try a different search term or select another filter.'
                : 'Approved projects will appear automatically when they become active.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : viewMode === 'box' ? (
          <div className={cn("grid gap-4.5 p-5 sm:grid-cols-2 xl:grid-cols-3 transition-opacity duration-150", isFiltering ? "opacity-60" : "opacity-100")}>
            {projects.map((project) => {
              const isGiaProject = project.program === 'GIA'
              const Icon = isGiaProject ? Building2 : Store
              const totalGrant = project.budget || 1500000
              const totalRefunded = project.used || 250000
              const progressPercent = project.progress
                ? project.progress
                : isGiaProject
                  ? 68
                  : Math.min(100, Math.round((totalRefunded / totalGrant) * 100))

              return (
                <article
                  key={project.backendId || project.id}
                  onClick={() => onSelectProject(project)}
                  className="group relative flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0f53b7] hover:shadow-md cursor-pointer space-y-4"
                >
                  <div>
                    {/* Top Header: Enterprise Icon + Title & Ref + Status Badge & Menu */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#0f53b7] group-hover:bg-[#0f53b7] group-hover:text-white transition shadow-2xs">
                          <Icon className="size-5.5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-base font-black tracking-tight text-slate-900 truncate group-hover:text-[#0f53b7] transition">
                            {project.enterprise || project.title}
                          </h3>
                          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-xs font-bold text-slate-500">
                            <span>{project.referenceNumber || project.id}</span>
                            {project.proposalId ? (
                              <span className="font-sans rounded bg-sky-50 px-1.5 py-0.2 text-[10px] font-bold text-sky-700 border border-sky-200">
                                Online
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <ProjectStatus project={project} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectProject(project)
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
                          title="Options"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sector, Business Structure & Location Details */}
                    <div className="mt-3.5 space-y-1">
                      <p className="text-xs font-semibold text-slate-700">
                        {project.industrySector || (isGiaProject ? 'Community Empowerment' : 'Food Processing')}
                        {' '}<span className="text-slate-300">•</span>{' '}
                        <span className="font-medium text-slate-500">{project.businessStructure || 'Sole Proprietorship'}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="size-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{project.location || 'sd, Davao del Sur'}</span>
                      </p>
                    </div>

                    {/* Progress Bar (Explicitly Labeled) */}
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          {isGiaProject ? 'Milestone Progress' : 'Refund Progress'}
                        </span>
                        <span className="font-extrabold text-slate-900 font-mono">
                          {isGiaProject
                            ? `${progressPercent}%`
                            : `₱${totalRefunded.toLocaleString()} / ₱${totalGrant.toLocaleString()} (${progressPercent}%)`
                          }
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isGiaProject
                              ? "bg-purple-600"
                              : "bg-[#0f53b7]"
                          )}
                          style={{ width: `${Math.min(100, Math.max(8, progressPercent))}%` }}
                        />
                      </div>
                    </div>

                    {/* Proponent & Documents 0/0 Representation */}
                    <div className="mt-3.5 flex items-center justify-between gap-2 text-xs text-slate-600">
                      {/* Proponent / Lead Name */}
                      <div className="flex items-center gap-2 min-w-0" title={`Assigned Monitor: ${project.manager || 'Maria SETUP Proponent'}`}>
                        <div className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0f53b7] text-[10px] font-black text-white">
                          {getInitials(project.manager || 'Maria SETUP Proponent')}
                        </div>
                        <span className="font-bold text-slate-800 truncate text-xs">
                          {project.manager || 'Maria SETUP Proponent'}
                        </span>
                      </div>

                      {/* Clean 0/0 Documents Representation matching sample style with real whole-sets data */}
                      {(() => {
                        const compliedDocs = project.checklistStats?.complied ?? 0
                        const totalDocs = project.checklistStats?.total ?? 0

                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              if (project.proposalId || project.backendId) {
                                e.stopPropagation()
                                navigate(`/dashboard/document-checklist?proposalId=${project.proposalId || project.backendId}&program=${project.program}`)
                              }
                            }}
                            className="inline-flex items-center gap-1.5 shrink-0 font-semibold text-slate-600 text-xs hover:text-[#0f53b7] transition group/docs cursor-pointer"
                            title={`Document Checklist (Whole Sets): ${compliedDocs} of ${totalDocs} required documents complied`}
                          >
                            <CheckSquare className="size-3.5 text-slate-400 group-hover/docs:text-[#0f53b7] transition" />
                            <span>{compliedDocs}/{totalDocs} docs</span>
                          </button>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    {project.proposalId || project.backendId ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/dashboard/document-checklist?proposalId=${project.proposalId || project.backendId}&program=${project.program}`)
                        }}
                        className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-[#0f53b7] transition shrink-0"
                        title="Open Document Checklist"
                      >
                        <FileCheck2 className="size-3.5 text-[#0f53b7]" />
                        <span>Checklist</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectProject(project)
                      }}
                      className="inline-flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0f53b7] px-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#0b3f8b] active:scale-[0.98]"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="divide-y divide-[#B5BFCD]/40">
            {projects.map((project) => (
              <article
                key={project.backendId}
                onClick={() => onSelectProject(project)}
                className="grid gap-4 px-6 py-4.5 transition hover:bg-[#E6EEF4]/40 md:grid-cols-[minmax(240px,1.5fr)_minmax(180px,1fr)_minmax(150px,0.9fr)_minmax(130px,0.8fr)_auto] md:items-center cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-slate-900">{project.enterprise || project.title}</h3>
                    <ProjectStatus project={project} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="font-mono text-[11px] font-bold text-[#285497]">{project.referenceNumber || project.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-500">{project.proposalId ? 'Online Application' : 'Active Project'}</span>
                  </div>
                </div>

                <div className="min-w-0 text-xs">
                  <p className="font-bold text-slate-800 truncate">{project.industrySector || 'Food Processing'}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{project.businessStructure || 'Sole Proprietorship'} · {project.manager}</p>
                </div>

                <div className="min-w-0 text-xs">
                  <p className="flex items-center gap-1 text-slate-600 truncate">
                    <MapPin className="size-3 text-slate-400 shrink-0" />
                    <span className="truncate">{project.location || 'Davao Region'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">Monitor: <strong className="text-slate-700">{project.manager}</strong></p>
                </div>

                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Approved Grant</span>
                  <p className="font-extrabold text-slate-900 text-sm">₱{(project.budget || 1500000).toLocaleString()}</p>
                </div>

                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                  {project.proposalId || project.backendId ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/dashboard/document-checklist?proposalId=${project.proposalId || project.backendId}&program=${project.program}`)
                      }}
                      className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-[#0f53b7] transition"
                      title="Open Document Checklist"
                    >
                      <FileCheck2 className="size-3.5 text-[#0f53b7]" />
                      <span>Checklist</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectProject(project)
                    }}
                    className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl bg-[#0f53b7] px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#0b3f8b]"
                  >
                    <span>Workspace</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {pagination.total > 0 ? (
          <footer className="flex flex-col gap-3 border-t border-[#B5BFCD]/50 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing <strong className="text-slate-800">{pagination.from}-{pagination.to}</strong> of{' '}
              <strong className="text-slate-800">{pagination.total}</strong> projects · {PER_PAGE} per page
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous page"
                disabled={pagination.currentPage <= 1}
                onClick={() => handlePageChange(Math.max(1, pagination.currentPage - 1))}
                className="grid size-8 place-items-center rounded-lg border border-[#B5BFCD] bg-white text-slate-600 transition hover:border-[#0f53b7] hover:text-[#0f53b7] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              {visiblePages.map((page, index) => {
                const previous = visiblePages[index - 1]
                return (
                  <div key={page} className="flex items-center gap-1.5">
                    {previous && page - previous > 1 ? <span className="px-1 text-xs text-slate-400">…</span> : null}
                    <button
                      type="button"
                      onClick={() => handlePageChange(page)}
                      className={`size-8 rounded-lg text-xs font-bold transition ${
                        page === pagination.currentPage
                          ? 'bg-[#0f53b7] text-white shadow-sm'
                          : 'border border-[#B5BFCD] bg-white text-slate-600 hover:border-[#0f53b7] hover:text-[#0f53b7]'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                )
              })}
              <button
                type="button"
                aria-label="Next page"
                disabled={pagination.currentPage >= pagination.lastPage}
                onClick={() => handlePageChange(Math.min(pagination.lastPage, pagination.currentPage + 1))}
                className="grid size-8 place-items-center rounded-lg border border-[#B5BFCD] bg-white text-slate-600 transition hover:border-[#0f53b7] hover:text-[#0f53b7] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </footer>
        ) : null}
      </section>
    </div>
  )
}