import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ReceiptText,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { AdminSearch } from '../../components/admin/AdminFilters'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { RepaymentLedgerView } from '../../components/admin/RepaymentLedgerView'
import { ROLES } from '../../config/permissions'
import type { ProjectRecord } from '../../data/admin'
import { getMockUser } from '../../lib/mockAuth'
import { fetchSetupMonitoringProjects } from '../../services/setupMonitoringStore'
import type { ProjectPagination } from '../../types/monitoring'
import type { Quarter } from '../../types/setupMonitoring'

const emptyPagination: ProjectPagination = {
  currentPage: 1,
  from: null,
  lastPage: 1,
  perPage: 6,
  to: null,
  total: 0,
}

function currentQuarter(): Quarter {
  return `Q${Math.ceil((new Date().getMonth() + 1) / 3)}` as Quarter
}

function formatFunding(value: number): string {
  if (value <= 0) return 'Not recorded'

  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value)
}

function formatReleaseDate(value?: string | null): string | null {
  if (!value) return null

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-PH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
}

export function BudgetPage() {
  const navigate = useNavigate()
  const { projectId: projectIdParam } = useParams()
  const user = getMockUser()
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [pagination, setPagination] = useState<ProjectPagination>(emptyPagination)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDirector = user?.role === ROLES.PROVINCIAL_DIRECTOR
  const hasSetupAccess = isDirector || (user?.role === ROLES.FOCAL && user.program === 'SETUP')
  const projectId = Number(projectIdParam)

  useEffect(() => {
    if (!hasSetupAccess || projectIdParam) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchSetupMonitoringProjects({
        page,
        quarter: currentQuarter(),
        search,
        year: new Date().getFullYear(),
      })
        .then((result) => {
          if (cancelled) return
          setProjects(result.projects)
          setPagination(result.pagination)
        })
        .catch((loadError: unknown) => {
          if (cancelled) return
          setError(loadError instanceof Error ? loadError.message : 'Could not load SETUP projects.')
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [hasSetupAccess, page, projectIdParam, search])

  if (!hasSetupAccess) {
    return (
      <div className="space-y-6">
        <AdminPageHeader description="" eyebrow="Financial Records" title="SETUP Repayment Ledger" />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertTriangle className="mx-auto size-7 text-amber-700" />
          <p className="mt-3 font-black text-amber-900">SETUP access required</p>
          <p className="mt-1 text-sm text-amber-700">This ledger is available to the SSCP Focal and Provincial Director.</p>
        </div>
      </div>
    )
  }

  if (projectIdParam) {
    return Number.isInteger(projectId) && projectId > 0
      ? <RepaymentLedgerView onBack={() => navigate('/dashboard/repayment-monitoring')} projectId={projectId} />
      : <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center font-bold text-rose-800">Invalid project ledger.</div>
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        action={isDirector ? <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-black text-slate-600">Read only</span> : null}
        description=""
        eyebrow="Financial Records"
        title="SETUP Repayment Ledger"
      />

      <AdminPanel
        action={<span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0f53b7]"><ReceiptText className="size-3.5" />{pagination.total} active</span>}
        title="Active SETUP Projects"
      >
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <AdminSearch onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Search project or beneficiary…" value={search} />
        </div>

        {error ? <div className="border-b border-rose-100 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">{error}</div> : null}

        {isLoading ? (
          <div className="grid min-h-56 place-items-center"><LoaderCircle className="size-7 animate-spin text-[#0f53b7]" /></div>
        ) : projects.length ? (
          <>
            <div className="hidden lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-slate-200 bg-[#f8fbff] text-xs font-black uppercase tracking-wide text-[#5c7394]">
                  <tr>
                    <th className="w-[26%] px-5 py-4">Project Title</th>
                    <th className="w-[20%] px-4 py-4">Project Beneficiary</th>
                    <th className="w-[15%] px-4 py-4">Contact No.</th>
                    <th className="w-[16%] px-4 py-4">SETUP Funding</th>
                    <th className="w-[12%] px-4 py-4">Full Release</th>
                    <th className="w-[11%] px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((project) => {
                    const id = project.backendId ?? project.id
                    return (
                      <tr className="transition hover:bg-blue-50/40" key={id}>
                        <td className="px-5 py-4">
                          <p className="truncate font-black text-slate-900">{project.title}</p>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-700">{project.enterprise}</td>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          {project.contactNumber || <span className="font-normal text-slate-400">Not recorded</span>}
                        </td>
                        <td className="px-4 py-4 font-black text-[#073b82]">{formatFunding(project.budget)}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                          {project.fullRelease || <span className="font-normal text-slate-400">Not recorded</span>}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#0f53b7] px-3 text-xs font-bold text-white hover:bg-[#0b3f8b]" onClick={() => navigate(`/dashboard/repayment-monitoring/${id}`)} type="button">Open<ArrowRight className="size-3.5" /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {projects.map((project) => {
                const id = project.backendId ?? project.id
                return (
                  <article className="space-y-3 px-5 py-4" key={id}>
                    <div>
                      <h2 className="font-black text-slate-900">{project.title}</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{project.enterprise}</p>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-slate-50 p-3 text-xs">
                      <div><dt className="font-bold text-slate-400">Contact No.</dt><dd className="mt-1 font-semibold text-slate-700">{project.contactNumber || 'Not recorded'}</dd></div>
                      <div><dt className="font-bold text-slate-400">SETUP Funding</dt><dd className="mt-1 font-black text-[#073b82]">{formatFunding(project.budget)}</dd></div>
                      <div className="col-span-2"><dt className="font-bold text-slate-400">Full Release</dt><dd className="mt-1 font-semibold text-slate-700">{project.fullRelease || 'Not recorded'}</dd></div>
                    </dl>
                    <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white hover:bg-[#0b3f8b]" onClick={() => navigate(`/dashboard/repayment-monitoring/${id}`)} type="button">Open ledger<ArrowRight className="size-4" /></button>
                  </article>
                )
              })}
            </div>
          </>
        ) : (
          <div className="px-6 py-14 text-center"><ReceiptText className="mx-auto size-7 text-slate-300" /><p className="mt-3 font-bold text-slate-800">No active SETUP projects found</p></div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500">{pagination.from ?? 0}-{pagination.to ?? 0} of {pagination.total}</p>
          <nav aria-label="Project pagination" className="flex items-center gap-2">
            <button aria-label="Previous project page" className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button"><ChevronLeft className="size-4" /></button>
            <span className="min-w-20 text-center text-xs font-bold text-slate-600">Page {pagination.currentPage} of {pagination.lastPage}</span>
            <button aria-label="Next project page" className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40" disabled={page >= pagination.lastPage || isLoading} onClick={() => setPage((current) => Math.min(pagination.lastPage, current + 1))} type="button"><ChevronRight className="size-4" /></button>
          </nav>
        </div>
      </AdminPanel>
    </div>
  )
}
