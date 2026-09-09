import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  FileCheck2,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { DataTable, type DataColumn } from '../../components/admin/DataTable'
import { AnimatedTabs } from '../../components/common/AnimatedTabs'
import { RepaymentLedgerView } from '../../components/admin/RepaymentLedgerView'
import { ROLES } from '../../config/permissions'
import type { ProjectRecord } from '../../data/admin'
import { getMockUser } from '../../lib/mockAuth'
import { fetchSetupMonitoringProjects } from '../../services/setupMonitoringStore'

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
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'needs_schedule'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDirector = user?.role === ROLES.PROVINCIAL_DIRECTOR
  const hasSetupAccess = isDirector || (user?.role === ROLES.FOCAL && user.program === 'SETUP')
  const projectId = Number(projectIdParam)

  useEffect(() => {
    if (!hasSetupAccess || projectIdParam) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchSetupMonitoringProjects({
      perPage: 100,
    })
      .then((result) => {
        if (cancelled) return
        setProjects(result.projects)
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Could not load SETUP projects.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [hasSetupAccess, projectIdParam])

  if (!hasSetupAccess) {
    return (
      <div className="space-y-6 font-sans">
        <div className="flex items-center gap-3">
          <span className="h-9 sm:h-10 w-1.5 rounded-full bg-[#0f53b7]" />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-slate-400">
              <span>Repayment Monitoring</span>
              <span>&gt;</span>
              <span className="font-bold text-[#285497]">SETUP Program</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
              Repayment Ledger
            </h1>
          </div>
        </div>
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

  const allCount = projects.length
  const needsScheduleCount = projects.filter((p) => p.budget <= 0 || !p.fullRelease).length
  const activeCount = allCount - needsScheduleCount

  const filteredProjects = projects.filter((p) => {
    const needsInit = p.budget <= 0 || !p.fullRelease
    if (filterTab === 'needs_schedule') return needsInit
    if (filterTab === 'active') return !needsInit
    return true
  })

  const columns: DataColumn<ProjectRecord>[] = [
    {
      className: 'w-[11%] min-w-[120px]',
      header: 'Reference',
      id: 'reference',
      render: (project) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200/80 font-mono text-xs font-bold text-slate-700 whitespace-nowrap shadow-2xs">
          {project.referenceNumber ?? project.id}
        </span>
      ),
      sortValue: (project) => project.referenceNumber ?? project.id,
    },
    {
      className: 'w-[20%] min-w-[180px]',
      header: 'Project Title',
      id: 'title',
      render: (project) => (
        <p className="font-bold leading-snug text-slate-900 text-sm line-clamp-2 hover:text-[#0f53b7] transition-colors" title={project.title}>
          {project.title}
        </p>
      ),
      sortValue: (project) => project.title,
    },
    {
      className: 'w-[16%] min-w-[150px]',
      header: 'Project Beneficiary',
      id: 'enterprise',
      render: (project) => (
        <div className="space-y-0.5">
          <p className="font-bold text-sm text-slate-900 leading-snug">{project.enterprise}</p>
          <p className="text-[11px] font-medium text-slate-500">
            {project.proponentName || project.manager || 'Cooperator'}
          </p>
        </div>
      ),
      sortValue: (project) => project.enterprise,
    },
    {
      className: 'w-[11%] min-w-[110px]',
      header: 'Contact No.',
      id: 'contactNumber',
      render: (project) => (
        <span className="text-xs font-medium text-slate-700">
          {project.contactNumber || <span className="text-slate-400 font-normal">Not recorded</span>}
        </span>
      ),
      sortValue: (project) => project.contactNumber || '',
    },
    {
      className: 'w-[13%] min-w-[120px]',
      header: 'SETUP Funding',
      id: 'funding',
      render: (project) => {
        const needsInit = project.budget <= 0 || !project.fullRelease
        return needsInit ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            Needs Terms
          </span>
        ) : (
          <span className="font-bold text-sm text-[#073b82] leading-snug">
            {formatFunding(project.budget)}
          </span>
        )
      },
      sortValue: (project) => project.budget,
    },
    {
      className: 'w-[11%] min-w-[110px]',
      header: 'Full Release',
      id: 'fullRelease',
      render: (project) => (
        <span className="text-xs font-medium text-slate-700 whitespace-nowrap block">
          {formatReleaseDate(project.fullRelease) || <span className="text-slate-400 font-normal">Not recorded</span>}
        </span>
      ),
      sortValue: (project) => project.fullRelease || '',
    },
    {
      className: 'w-[8%] min-w-[90px]',
      header: 'Status',
      id: 'status',
      render: (project) => {
        const needsInit = project.budget <= 0 || !project.fullRelease
        return needsInit ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200 w-fit whitespace-nowrap shadow-2xs">
            <Clock className="size-3" />
            Needs Schedule
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 w-fit whitespace-nowrap shadow-2xs">
            <Check className="size-3" />
            Active
          </span>
        )
      },
      sortValue: (project) => (project.budget <= 0 || !project.fullRelease ? 'Needs Schedule' : 'Active'),
    },
    {
      className: 'w-[10%] min-w-[100px] text-right',
      header: 'ACTION',
      id: 'action',
      render: (project) => {
        const id = project.backendId ?? project.id
        const needsInit = project.budget <= 0 || !project.fullRelease
        return (
          <div className="flex items-center justify-end gap-1.5">
            {project.proposalId ? (
              <button
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-100 hover:text-[#0f53b7] transition shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/dashboard/document-checklist?proposalId=${project.proposalId}&program=SETUP`)
                }}
                title="Open Document Checklist"
                type="button"
              >
                <FileCheck2 className="size-4" />
              </button>
            ) : null}
            <button
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-white shadow-xs transition ${
                needsInit && !isDirector
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/dashboard/repayment-monitoring/${id}`)
              }}
              title={needsInit && !isDirector ? 'Initialize Repayment Schedule' : 'Open Repayment Ledger'}
              type="button"
            >
              <span>{isDirector ? 'View' : needsInit ? 'Initialize' : 'Ledger'}</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-9 sm:h-10 w-1.5 rounded-full bg-[#0f53b7]" />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold leading-none text-slate-400">
              <span>Repayment Monitoring</span>
              <span>&gt;</span>
              <span className="font-bold text-[#285497]">SETUP Program</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900">
              Repayment Ledger
            </h1>
          </div>
        </div>
        {isDirector ? (
          <span className="self-start sm:self-auto rounded-full bg-slate-200 px-3 py-1.5 text-xs font-black text-slate-600">
            Read only
          </span>
        ) : null}
      </div>

      {/* Modern Segmented Filter Tabs */}
      <div>
        <AnimatedTabs
          activeTab={filterTab}
          layoutId="repayment-overview-tabs"
          onChange={(id) => setFilterTab(id as 'all' | 'active' | 'needs_schedule')}
          tabs={[
            { id: 'all', label: 'All', count: allCount },
            { id: 'active', label: 'Active Repayment', count: activeCount },
            { id: 'needs_schedule', label: 'Needs Schedule', count: needsScheduleCount },
          ]}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]">
        {error ? (
          <p className="p-6 text-sm text-rose-600">{error}</p>
        ) : (
          <DataTable
            columns={columns}
            data={filteredProjects}
            emptyDescription="There are no active SETUP projects matching your filter criteria."
            emptyTitle="No repayment projects found"
            getRowKey={(project) => String(project.backendId ?? project.id)}
            initialRowsPerPage={10}
            isLoading={isLoading}
            mobileRender={(project) => {
              const id = project.backendId ?? project.id
              const needsInit = project.budget <= 0 || !project.fullRelease
              return (
                <div className="space-y-3 font-sans">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200/80 font-mono text-xs font-bold text-slate-700 whitespace-nowrap shadow-2xs">
                      {project.referenceNumber ?? project.id}
                    </span>
                    {needsInit ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200 shadow-2xs">
                        <Clock className="size-3" /> Needs Schedule
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
                        <Check className="size-3" /> Active
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold leading-snug text-slate-900 text-sm">{project.title}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-800">{project.enterprise}</p>
                    <p className="text-[11px] font-medium text-slate-500">{project.proponentName || project.manager || 'Cooperator'}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-slate-50 p-3 text-xs">
                    <div>
                      <dt className="font-bold text-slate-400">Contact No.</dt>
                      <dd className="mt-1 font-semibold text-slate-700">{project.contactNumber || 'Not recorded'}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-slate-400">SETUP Funding</dt>
                      <dd className="mt-1 font-bold text-[#073b82]">
                        {needsInit ? 'Needs Terms' : formatFunding(project.budget)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="font-bold text-slate-400">Full Release</dt>
                      <dd className="mt-1 font-semibold text-slate-700">{formatReleaseDate(project.fullRelease) || 'Not recorded'}</dd>
                    </div>
                  </dl>
                  <button
                    className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-white transition ${
                      needsInit && !isDirector ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-700 hover:bg-emerald-800'
                    }`}
                    onClick={() => navigate(`/dashboard/repayment-monitoring/${id}`)}
                    type="button"
                  >
                    <span>{isDirector ? 'View Ledger' : needsInit ? 'Initialize Ledger' : 'Open Ledger'}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              )
            }}
            searchPlaceholder="Search projects by reference, title, or beneficiary..."
            searchText={(project) =>
              `${project.referenceNumber ?? project.id} ${project.title} ${project.enterprise} ${project.contactNumber ?? ''} ${project.fullRelease ?? ''}`
            }
          />
        )}
      </section>
    </div>
  )
}
