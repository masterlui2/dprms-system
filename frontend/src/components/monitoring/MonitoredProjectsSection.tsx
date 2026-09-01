import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  LoaderCircle,
  MapPin,
  Search,
  Store,
  UserRound,
} from 'lucide-react'

import type { Program, ProjectRecord } from '../../data/admin'
import type { ProjectPagination } from '../../types/monitoring'

interface Props {
  projects: ProjectRecord[]
  onSelectProject: (project: ProjectRecord) => void
  viewMode?: 'box' | 'list'
  searchValue?: string
  districtValue?: string
  districts?: string[]
  isFiltering?: boolean
  program?: Program
  agencyValue?: string
  agencies?: string[]
  statusValue?: string
  statuses?: string[]
  pagination?: ProjectPagination
  onSearchChange?: (value: string) => void
  onDistrictChange?: (value: string) => void
  onAgencyChange?: (value: string) => void
  onStatusChange?: (value: string) => void
  onPageChange?: (page: number) => void
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not yet monitored'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not yet monitored'

  return date.toLocaleDateString('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function readableStatus(value?: string): string {
  if (!value) return 'Not started'

  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function ProjectStatus({ project }: { project: ProjectRecord }) {
  if (project.program === 'GIA') {
    if (project.compliance === 'Overdue') {
      return (
        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
          Delayed milestone
        </span>
      )
    }

    return (
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0f53b7]">
        {project.progress}% complete
      </span>
    )
  }

  const pending = project.pendingReports ?? 0

  if (pending > 0) {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
        {pending} pending
      </span>
    )
  }

  if (project.monitored) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
        Monitored
      </span>
    )
  }

  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
      Not yet monitored
    </span>
  )
}

export function MonitoredProjectsSection({
  projects,
  onSelectProject,
  viewMode = 'box',
  searchValue = '',
  districtValue = '',
  districts = [],
  isFiltering = false,
  program,
  agencyValue = '',
  agencies = [],
  statusValue = '',
  statuses = [],
  pagination,
  onSearchChange,
  onDistrictChange,
  onAgencyChange,
  onStatusChange,
  onPageChange,
}: Props) {
  const isGia = program === 'GIA' || projects.some((project) => project.program === 'GIA')
  const hasServerFilters = Boolean(
    onSearchChange && (onDistrictChange || onAgencyChange || onStatusChange),
  )
  const hasActiveFilters = searchValue.trim() !== '' || districtValue !== '' || agencyValue !== '' || statusValue !== ''
  const visiblePages = pagination
    ? Array.from({ length: pagination.lastPage }, (_, index) => index + 1)
        .filter((page) =>
          page === 1 ||
          page === pagination.lastPage ||
          Math.abs(page - pagination.currentPage) <= 1,
        )
    : []

  return (
    <div className="space-y-4 font-sans">
      <section className="overflow-hidden rounded-2xl border border-[#B5BFCD]/70 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#B5BFCD]/50 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-950">
                {isGia ? 'GIA monitored projects' : 'SETUP monitored enterprises'}
              </h2>
              {isFiltering ? <LoaderCircle className="size-4 animate-spin text-[#0f53b7]" /> : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {projects.length} active {isGia ? 'community projects' : 'SETUP enterprises'} shown
            </p>
          </div>

          {hasServerFilters ? (
            <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:max-w-4xl lg:justify-end">
              <label className="relative block">
                <span className="sr-only">Search monitored projects</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  placeholder={isGia ? 'Search agency, project, or reference' : 'Search enterprise, reference, or address'}
                  className="h-10 w-full rounded-xl border border-[#B5BFCD] bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100 sm:w-72"
                />
              </label>
              {onDistrictChange ? <label>
                <span className="sr-only">Filter by district or city</span>
                <select
                  value={districtValue}
                  onChange={(event) => onDistrictChange?.(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#B5BFCD] bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100"
                >
                  <option value="">All districts / cities</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </label> : null}
              {onAgencyChange ? (
                <label>
                  <span className="sr-only">Filter by implementing agency</span>
                  <select
                    value={agencyValue}
                    onChange={(event) => onAgencyChange(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[#B5BFCD] bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100 sm:w-52"
                  >
                    <option value="">All agencies</option>
                    {agencies.map((agency) => (
                      <option key={agency} value={agency}>{agency}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              {onStatusChange ? (
                <label>
                  <span className="sr-only">Filter by monitoring status</span>
                  <select
                    value={statusValue}
                    onChange={(event) => onStatusChange(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[#B5BFCD] bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100 sm:w-44"
                  >
                    <option value="">All statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>{readableStatus(status)}</option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        {projects.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[#E6EEF4] text-[#285497]">
              <Search className="size-5" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-slate-900">
              {hasActiveFilters ? 'No matching SETUP projects' : `No active ${isGia ? 'GIA' : 'SETUP'} projects`}
            </h3>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
              {hasActiveFilters
                ? 'Try a different search term or select another district or city.'
                : 'Approved projects will appear automatically when they become active.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange?.('')
                  onDistrictChange?.('')
                  onAgencyChange?.('')
                  onStatusChange?.('')
                }}
                className="mt-4 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : viewMode === 'box' ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const Icon = project.program === 'GIA' ? FileSpreadsheet : Store

              return (
                <article
                  key={project.id}
                  className="flex min-w-0 flex-col rounded-2xl border border-[#B5BFCD]/65 bg-white p-4 transition hover:border-[#0f53b7]/60 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
                      <Icon className="size-4.5" />
                    </span>
                    <ProjectStatus project={project} />
                  </div>

                  <h3 className="mt-4 truncate text-base font-bold text-slate-950">
                    {project.enterprise || project.title}
                  </h3>
                  <p className="mt-0.5 truncate text-xs font-semibold text-[#285497]">
                    {project.referenceNumber || project.id}
                  </p>
                  <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{project.location || 'Location not recorded'}</span>
                  </p>

                  <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
                    <div className="min-w-0">
                      <dt className="text-[11px] text-slate-400">Assigned monitor</dt>
                      <dd className="mt-0.5 truncate font-bold text-slate-800">{project.manager}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] text-slate-400">Monitoring status</dt>
                      <dd className="mt-0.5 truncate font-bold text-slate-800">
                        {readableStatus(project.monitoringStatus)}
                      </dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="text-[11px] text-slate-400">Last monitored</dt>
                      <dd className="mt-0.5 font-bold text-slate-800">
                        {formatDate(project.lastMonitoredAt)}
                      </dd>
                    </div>
                  </dl>

                  {project.program === 'GIA' ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Milestone progress</span>
                        <span className="font-black text-[#0f53b7]">{project.progress}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#0f53b7]"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onSelectProject(project)}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0f53b7] text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3f8b] active:scale-[0.99]"
                  >
                    Open quarterly monitoring
                    <ArrowRight className="size-3.5" />
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="divide-y divide-[#B5BFCD]/40">
            {projects.map((project) => (
              <article
                key={project.id}
                className="grid gap-3 px-5 py-4 transition hover:bg-[#E6EEF4]/35 md:grid-cols-[minmax(220px,1.4fr)_minmax(160px,0.8fr)_minmax(150px,0.7fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-slate-950">
                      {project.enterprise || project.title}
                    </h3>
                    <ProjectStatus project={project} />
                  </div>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                    <MapPin className="size-3 shrink-0" />
                    {project.location || 'Location not recorded'}
                  </p>
                </div>
                <div className="min-w-0 text-xs">
                  <p className="flex items-center gap-1 text-[11px] text-slate-400">
                    <UserRound className="size-3" /> Assigned monitor
                  </p>
                  <p className="mt-0.5 truncate font-bold text-slate-800">{project.manager}</p>
                </div>
                <div className="text-xs">
                  <p className="flex items-center gap-1 text-[11px] text-slate-400">
                    <CalendarClock className="size-3" /> Last monitored
                  </p>
                  <p className="mt-0.5 font-bold text-slate-800">{formatDate(project.lastMonitoredAt)}</p>
                  {project.program === 'GIA' ? (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#0f53b7]" style={{ width: `${project.progress}%` }} />
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectProject(project)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#0f53b7] px-3 text-xs font-bold text-[#0f53b7] transition hover:bg-[#0f53b7] hover:text-white"
                >
                  Open
                  <ArrowRight className="size-3.5" />
                </button>
              </article>
            ))}
          </div>
        )}

        {pagination && pagination.total > 0 ? (
          <footer className="flex flex-col gap-3 border-t border-[#B5BFCD]/50 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing <strong className="text-slate-800">{pagination.from}-{pagination.to}</strong> of{' '}
              <strong className="text-slate-800">{pagination.total}</strong> projects · 6 per page
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous page"
                disabled={pagination.currentPage <= 1 || isFiltering}
                onClick={() => onPageChange?.(pagination.currentPage - 1)}
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
                      disabled={isFiltering}
                      onClick={() => onPageChange?.(page)}
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
                disabled={pagination.currentPage >= pagination.lastPage || isFiltering}
                onClick={() => onPageChange?.(pagination.currentPage + 1)}
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
