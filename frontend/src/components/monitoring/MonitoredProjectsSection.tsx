import {
  FileSpreadsheet,
  MapPin,
  Store,
} from 'lucide-react'

import type { ProjectRecord } from '../../data/admin'

interface Props {
  projects: ProjectRecord[]
  onSelectProject: (project: ProjectRecord) => void
  viewMode?: 'box' | 'list'
}

export function MonitoredProjectsSection({
  projects,
  onSelectProject,
  viewMode = 'box',
}: Props) {
  const enterpriseMetadata: Record<
    string,
    {
      code: string
      location: string
      manager: string
      quarter: string
      workforce: number
      netMargin: number
      assetValue: number
    }
  > = {
    'P-214': {
      code: 'DOST-MAT-2024-001',
      location: 'Lower Kapayas, Mati City',
      manager: 'Maria Dela Cruz',
      quarter: 'Q3 2024',
      workforce: 18,
      netMargin: 22.4,
      assetValue: 1840000,
    },
    'P-203': {
      code: 'DOST-DVO-2024-014',
      location: 'Calinan, Davao City',
      manager: 'Jonas Villanueva',
      quarter: 'Q3 2024',
      workforce: 34,
      netMargin: 16.8,
      assetValue: 3260000,
    },
    'P-187': {
      code: 'DOST-MAT-2024-006',
      location: 'Mati City, Davao Oriental',
      manager: 'Ana Mae Flores',
      quarter: 'Q3 2024',
      workforce: 12,
      netMargin: 19.2,
      assetValue: 980000,
    },
    'P-208': {
      code: 'DOST-TAG-2024-009',
      location: 'Apokon, Tagum City',
      manager: 'Rogelio Santos',
      quarter: 'Q3 2024',
      workforce: 27,
      netMargin: 11.6,
      assetValue: 2120000,
    },
    'P-211': {
      code: 'DOST-MAT-2024-011',
      location: 'Dahican, Mati City',
      manager: 'Leah Manalo',
      quarter: 'Q3 2024',
      workforce: 21,
      netMargin: 24.1,
      assetValue: 1470000,
    },
  }

  const getEnterpriseData = (p: ProjectRecord) => {
    return (
      enterpriseMetadata[p.id] || {
        code: p.referenceNumber || p.id,
        location: p.location || p.gia?.location || 'Location not recorded',
        manager: p.manager || 'Unassigned',
        quarter: 'Not yet reported',
        workforce: 0,
        netMargin: 0,
        assetValue: 0,
      }
    )
  }

  const isGia = projects.some((p) => p.program === 'GIA')

  return (
    <div className="space-y-4 font-sans">
      {/* Subheader */}

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

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#B5BFCD] bg-white px-6 py-14 text-center shadow-sm">
          <h3 className="text-sm font-bold text-slate-800">No approved {isGia ? 'GIA' : 'SETUP'} projects yet</h3>
          <p className="mt-1 text-xs text-slate-500">
            Projects will appear here automatically after provincial director approval.
          </p>
        </div>
      ) : null}


      {/* VIEW MODE: BOX (GRID) */}
      {viewMode === 'box' && projects.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const meta = getEnterpriseData(p)
            const isGiaItem = p.program === 'GIA'

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl border border-[#B5BFCD]/80 bg-white p-5 shadow-sm transition hover:border-[#285497] hover:shadow-md"
              >
                <div>
                  {/* Icon + Pill */}
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
                      {isGiaItem ? <FileSpreadsheet className="size-5" /> : <Store className="size-5" />}
                    </div>
                    <span className="rounded-full bg-[#E6EEF4] px-2.5 py-0.5 text-xs font-semibold text-[#285497]">
                      {isGiaItem ? p.status : p.compliance}
                    </span>
                  </div>


                  {/* Title & Code */}
                  <h3 className="mt-3 text-base font-semibold text-slate-900 truncate">
                    {p.enterprise || p.title}
                  </h3>
                  <p className="text-xs font-normal text-slate-400">{meta.code}</p>

                  {/* Location */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-normal">
                    <MapPin className="size-3.5 text-[#285497] shrink-0" />
                    <span className="truncate">{meta.location}</span>
                  </div>

                  <hr className="my-3.5 border-[#B5BFCD]/40" />

                  {/* 2-Column Info Grid */}
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
                          ? (p.gia?.agency || p.enterprise || 'LGU / Community')
                          : meta.workforce > 0 ? `${meta.workforce} employees` : 'Not reported'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {isGiaItem ? 'Total Grant / Budget' : 'Net profit margin'}
                      </span>
                      <span className="font-semibold text-[#285497] block">
                        {isGiaItem
                          ? p.budget > 0 ? `₱${(p.budget / 1000000).toFixed(2)}M` : 'Not recorded'
                          : meta.netMargin > 0 ? `${meta.netMargin}%` : 'Not reported'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {isGiaItem ? 'Reporting Period' : 'Asset book value'}
                      </span>
                      <span className="font-semibold text-slate-900 block">
                        {isGiaItem
                          ? (p.gia?.reportingPeriod || 'For monitoring setup')
                          : meta.assetValue > 0 ? `₱${(meta.assetValue / 1000000).toFixed(2)}M` : 'Not reported'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Open Report Button */}
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

      {/* VIEW MODE: LIST (TABLE) */}
      {viewMode === 'list' && projects.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm">
          <div className="w-full">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="border-b border-[#B5BFCD]/80 bg-[#E6EEF4] text-[11px] font-semibold uppercase tracking-wider text-[#285497]">
                <tr>
                  <th className="w-[17%] py-3.5 pl-5 pr-2">{isGia ? 'Project / Organization ↕' : 'Enterprise Name ↕'}</th>
                  <th className="w-[13%] px-2 py-3.5">Code ↕</th>
                  <th className="hidden w-[19%] px-2 py-3.5 lg:table-cell">Address / Location</th>
                  <th className="hidden w-[14%] px-2 py-3.5 xl:table-cell">{isGia ? 'Project Leader' : 'Assigned Manager'}</th>
                  <th className="hidden w-[11%] px-2 py-3.5 lg:table-cell">{isGia ? 'Period' : 'Quarter'}</th>
                  <th className="hidden w-[11%] px-2 py-3.5 xl:table-cell">{isGia ? 'Grant Budget' : 'Workforce'}</th>
                  <th className="w-[7%] px-2 py-3.5">{isGia ? 'Status' : 'Net Margin'}</th>
                  <th className="w-[8%] py-3.5 pl-2 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-700">
                {projects.map((p) => {
                  const meta = getEnterpriseData(p)
                  const isGiaItem = p.program === 'GIA'

                  return (
                    <tr key={p.id} className="hover:bg-[#E6EEF4]/30 transition">
                      <td className="py-3.5 pl-5 pr-2 font-semibold text-slate-900">
                        <span className="block truncate" title={p.enterprise || p.title}>
                          {p.enterprise || p.title}
                        </span>
                      </td>
                      <td className="px-2 py-3.5 font-mono text-slate-500 font-normal">
                        <span className="block truncate" title={meta.code}>{meta.code}</span>
                      </td>
                      <td className="hidden px-2 py-3.5 text-slate-600 font-normal lg:table-cell">
                        <span className="block truncate" title={meta.location}>{meta.location}</span>
                      </td>
                      <td className="hidden px-2 py-3.5 text-slate-600 font-normal xl:table-cell">
                        <span className="block truncate" title={meta.manager}>{meta.manager}</span>
                      </td>
                      <td className="hidden px-2 py-3.5 text-slate-600 font-normal lg:table-cell">
                        <span
                          className="block truncate"
                          title={isGiaItem ? (p.gia?.reportingPeriod || 'For monitoring setup') : meta.quarter}
                        >
                          {isGiaItem ? (p.gia?.reportingPeriod || 'For monitoring setup') : meta.quarter}
                        </span>
                      </td>
                      <td className="hidden px-2 py-3.5 font-semibold text-slate-900 xl:table-cell">
                        <span className="block truncate">
                          {isGiaItem
                            ? p.budget > 0 ? `₱${(p.budget / 1000000).toFixed(2)}M` : 'Not recorded'
                            : meta.workforce > 0 ? `${meta.workforce} employees` : 'Not reported'}
                        </span>
                      </td>
                      <td className="px-2 py-3.5 font-semibold text-[#285497]">
                        <span className="block truncate">
                          {isGiaItem
                            ? p.status
                            : meta.netMargin > 0 ? `${meta.netMargin}%` : 'Not reported'}
                        </span>
                      </td>
                      <td className="py-3.5 pl-2 pr-5 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectProject(p)}
                          className="whitespace-nowrap font-semibold text-[#0f53b7] hover:underline"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  )
                })}

              </tbody>
            </table>
          </div>


          {/* Table Pagination */}
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
