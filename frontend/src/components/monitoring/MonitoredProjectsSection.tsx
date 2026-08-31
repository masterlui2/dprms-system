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
      lastMonitoring: string
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
      lastMonitoring: '30 Sep 2024',
    },
    'P-203': {
      code: 'DOST-DVO-2024-014',
      location: 'Calinan, Davao City',
      manager: 'Jonas Villanueva',
      quarter: 'Q3 2024',
      workforce: 34,
      netMargin: 16.8,
      assetValue: 3260000,
      lastMonitoring: '24 Sep 2024',
    },
    'P-187': {
      code: 'DOST-MAT-2024-006',
      location: 'Mati City, Davao Oriental',
      manager: 'Ana Mae Flores',
      quarter: 'Q3 2024',
      workforce: 12,
      netMargin: 19.2,
      assetValue: 980000,
      lastMonitoring: '18 Sep 2024',
    },
    'P-208': {
      code: 'DOST-TAG-2024-009',
      location: 'Apokon, Tagum City',
      manager: 'Rogelio Santos',
      quarter: 'Q3 2024',
      workforce: 27,
      netMargin: 11.6,
      assetValue: 2120000,
      lastMonitoring: '06 Aug 2024',
    },
    'P-211': {
      code: 'DOST-MAT-2024-011',
      location: 'Dahican, Mati City',
      manager: 'Leah Manalo',
      quarter: 'Q3 2024',
      workforce: 21,
      netMargin: 24.1,
      assetValue: 1470000,
      lastMonitoring: '12 Sep 2024',
    },
  }

  const getEnterpriseData = (p: ProjectRecord) => {
    return (
      enterpriseMetadata[p.id] || {
        code: `DOST-MAT-2024-0${p.id.slice(-2)}`,
        location: p.gia?.location || 'Mati City, Davao Oriental',
        manager: p.manager || 'Maria Dela Cruz',
        quarter: 'Q3 2024',
        workforce: 16,
        netMargin: 18.5,
        assetValue: p.budget || 1200000,
        lastMonitoring: '15 Sep 2024',
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


      {/* VIEW MODE: BOX (GRID) */}
      {viewMode === 'box' && (
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
                      {isGiaItem ? 'In Progress' : 'Compliant'}
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
                        {isGiaItem ? (p.gia?.agency || p.enterprise || 'LGU / Community') : `${meta.workforce} employees`}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {isGiaItem ? 'Total Grant / Budget' : 'Net profit margin'}
                      </span>
                      <span className="font-semibold text-[#285497] block">
                        {isGiaItem ? `₱${(p.budget / 1000000).toFixed(2)}M` : `${meta.netMargin}%`}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {isGiaItem ? 'Reporting Period' : 'Asset book value'}
                      </span>
                      <span className="font-semibold text-slate-900 block">
                        {isGiaItem ? (p.gia?.reportingPeriod || 'CY 2026') : `₱${(meta.assetValue / 1000000).toFixed(2)}M`}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 font-normal">Last monitoring</span>
                      <span className="font-semibold text-slate-900 block">{meta.lastMonitoring}</span>
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
                  const meta = getEnterpriseData(p)
                  const isGiaItem = p.program === 'GIA'

                  return (
                    <tr key={p.id} className="hover:bg-[#E6EEF4]/30 transition">
                      <td className="py-3.5 pl-5 pr-3 font-semibold text-slate-900 whitespace-nowrap">
                        {p.enterprise || p.title}
                      </td>
                      <td className="px-3 py-3.5 font-mono text-slate-500 whitespace-nowrap font-normal">
                        {meta.code}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap font-normal">{meta.location}</td>
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap font-normal">{meta.manager}</td>
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap font-normal">
                        {isGiaItem ? (p.gia?.reportingPeriod || 'CY 2026') : meta.quarter}
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {isGiaItem ? `₱${(p.budget / 1000000).toFixed(2)}M` : `${meta.workforce} employees`}
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-[#285497] whitespace-nowrap">
                        {isGiaItem ? (p.status || 'Active') : `${meta.netMargin}%`}
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
