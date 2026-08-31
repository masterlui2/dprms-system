import { useEffect, useState } from 'react'
import {
  FileSpreadsheet,
  MapPin,
  Store,
} from 'lucide-react'

import {
  fetchProjects,
  type ProjectRecord,
  type SetupProposalRecord,
} from '../../services/projectStore'

interface Props {
  onSelectProject: (project: ProjectRecord) => void
  viewMode?: 'box' | 'list'
}

function formatLocation(setup?: SetupProposalRecord): string {
  if (!setup) return 'Location not specified'
  return [setup.business_address, setup.city_municipality, setup.province]
    .filter(Boolean)
    .join(', ')
}

function formatQuarter(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const q = Math.floor(d.getMonth() / 3) + 1
  return `Q${q} ${d.getFullYear()}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not yet monitored'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getProjectDisplayData(p: ProjectRecord) {
  const isGiaItem = p.program_type === 'GIA'
  const setup = p.proposal.setup_proposal?.[0]
  const gia = p.proposal.gia_proposal?.[0]

  const workforceRaw = setup?.form_snapshot?.numberOfEmployees
  const workforce = workforceRaw ? Number(workforceRaw) : null

  return {
    title: setup?.business_name || p.proposal.title,
    code: p.proposal.reference_number,
    location: isGiaItem ? (gia?.location || 'Location not specified') : formatLocation(setup),
    manager: p.user.name,
    quarter: formatQuarter(p.approved_at),
    workforce,
    netMargin: null as number | null,
    assetValue: p.budget ?? null,
    lastMonitoring: formatDate(p.approved_at),
    agency: gia?.agency,
    reportingPeriod: gia?.reporting_period,
  }
}

export function MonitoredProjectsSection({
  onSelectProject,
  viewMode = 'box',
}: Props) {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchProjects()
      .then((data) => {
        if (!cancelled) setProjects(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Failed to load projects')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const isGia = projects.some((p) => p.program_type === 'GIA')

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-slate-400">Loading projects…</div>
  }

  if (error) {
    return <div className="py-10 text-center text-sm text-red-500">{error}</div>
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-[#B5BFCD]/50 pb-2.5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 leading-snug">
            {isGia ? 'Grants-In-Aid (GIA) Monitoring Active Projects' : 'SETUP Monitoring Active Projects'}
          </h2>
          <p className="text-xs text-slate-400 font-normal">
            {isGia
              ? 'Showing monitored records for DOST-assisted projects.'
              : 'Showing monitored records for DOST-assisted enterprises.'}
          </p>
        </div>
        <span className="rounded-lg bg-[#E6EEF4] px-3 py-1 text-xs font-semibold text-[#285497]">
          {projects.length} active projects
        </span>
      </div>

      {viewMode === 'box' && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const meta = getProjectDisplayData(p)
            const isGiaItem = p.program_type === 'GIA'

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm transition hover:border-[#285497] hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
                      {isGiaItem ? <FileSpreadsheet className="size-5" /> : <Store className="size-5" />}
                    </div>
                    <span className="rounded-full bg-[#E6EEF4] px-2.5 py-0.5 text-xs font-semibold text-[#285497]">
                      {p.status === 'active' ? 'Active' : p.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-slate-900 truncate">
                    {meta.title}
                  </h3>
                  <p className="text-xs font-normal text-slate-400">{meta.code}</p>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-normal">
                    <MapPin className="size-3.5 text-[#285497] shrink-0" />
                    <span className="truncate">{meta.location}</span>
                  </div>

                  <hr className="my-3.5 border-[#B5BFCD]/40" />

                  <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {isGiaItem ? 'Project Leader' : 'Assigned manager'}
                      </span>
                      <span className="font-semibold text-slate-900 truncate block">{meta.manager}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {isGiaItem ? 'Program Type' : 'Reporting quarter'}
                      </span>
                      <span className="font-semibold text-slate-900 block">
                        {isGiaItem ? 'Grants-In-Aid (GIA)' : meta.quarter}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {isGiaItem ? 'Implementing Agency' : 'Workforce'}
                      </span>
                      <span className="font-semibold text-slate-900 block truncate">
                        {isGiaItem
                          ? (meta.agency || meta.title || 'LGU / Community')
                          : (meta.workforce !== null ? `${meta.workforce} employees` : 'Not specified')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {isGiaItem ? 'Total Grant / Budget' : 'Net profit margin'}
                      </span>
                      <span className="font-semibold text-[#285497] block">
                        {isGiaItem
                          ? (p.budget ? `₱${(p.budget / 1000000).toFixed(2)}M` : 'Not specified')
                          : (meta.netMargin !== null ? `${meta.netMargin}%` : 'Not yet available')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {isGiaItem ? 'Reporting Period' : 'Asset book value'}
                      </span>
                      <span className="font-semibold text-slate-900 block">
                        {isGiaItem
                          ? (meta.reportingPeriod || 'Not specified')
                          : (meta.assetValue !== null ? `₱${(meta.assetValue / 1000000).toFixed(2)}M` : 'Not yet available')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">Last monitoring</span>
                      <span className="font-semibold text-slate-900 block">{meta.lastMonitoring}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectProject(p)}
                  className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0f53b7] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0b3f8b] active:scale-[0.99]"
                >
                  <span>Open report</span>
                  <span className="text-xs">↗</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="overflow-hidden rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#B5BFCD]/80 bg-[#E6EEF4] text-[11px] font-semibold uppercase tracking-wider text-[#285497]">
                <tr>
                  <th className="py-3.5 pl-5 pr-3">{isGia ? 'Project / Organization ↕' : 'Enterprise Name ↕'}</th>
                  <th className="px-3 py-3.5">Code ↕</th>
                  <th className="px-3 py-3.5">Address / Location</th>
                  <th className="px-3 py-3.5">{isGia ? 'Project Leader' : 'Assigned Manager'}</th>
                  <th className="px-3 py-3.5">{isGia ? 'Period' : 'Quarter'}</th>
                  <th className="px-3 py-3.5">{isGia ? 'Grant Budget' : 'Workforce'}</th>
                  <th className="px-3 py-3.5">{isGia ? 'Status' : 'Net Margin'}</th>
                  <th className="px-3 py-3.5">Last Monitoring</th>
                  <th className="py-3.5 pl-3 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-700">
                {projects.map((p) => {
                  const meta = getProjectDisplayData(p)
                  const isGiaItem = p.program_type === 'GIA'

                  return (
                    <tr key={p.id} className="hover:bg-[#E6EEF4]/30 transition">
                      <td className="py-3.5 pl-5 pr-3 font-semibold text-slate-900 whitespace-nowrap">
                        {meta.title}
                      </td>
                      <td className="px-3 py-3.5 font-mono text-slate-500 whitespace-nowrap font-normal">
                        {meta.code}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap font-normal">{meta.location}</td>
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap font-normal">{meta.manager}</td>
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap font-normal">
                        {isGiaItem ? (meta.reportingPeriod || 'Not specified') : meta.quarter}
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {isGiaItem
                          ? (p.budget ? `₱${(p.budget / 1000000).toFixed(2)}M` : 'Not specified')
                          : (meta.workforce !== null ? `${meta.workforce} employees` : 'Not specified')}
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-[#285497] whitespace-nowrap">
                        {isGiaItem ? (p.status || 'Active') : (meta.netMargin !== null ? `${meta.netMargin}%` : 'Not yet available')}
                      </td>
                      <td className="px-3 py-3.5 text-slate-500 whitespace-nowrap font-normal">
                        {meta.lastMonitoring}
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectProject(p)}
                          className="font-semibold text-[#0f53b7] hover:underline"
                        >
                          Open report
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#B5BFCD]/40 px-5 py-2.5 text-xs text-slate-500 bg-[#E6EEF4]/30">
            <span>Showing 1-{projects.length} of {projects.length} monitored {isGia ? 'community projects' : 'enterprises'}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="size-6 rounded bg-[#0f53b7] font-semibold text-white shadow-sm text-xs"
              >
                1
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}