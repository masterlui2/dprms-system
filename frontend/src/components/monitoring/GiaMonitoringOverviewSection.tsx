import {
  ArrowRight,
  CircleAlert,
  FileCheck2,
  FolderKanban,
  Landmark,
  MapPin,
} from 'lucide-react'

import { formatCurrency, type ProjectRecord } from '../../data/admin'
import type { GiaMonitoringStatistics } from '../../services/giaMonitoringStore'

interface Props {
  projects: ProjectRecord[]
  statistics: GiaMonitoringStatistics
  onSelectProject: (project: ProjectRecord) => void
  period?: string
}

export function GiaMonitoringOverviewSection({
  projects,
  statistics,
  onSelectProject,
  period = 'Current semester',
}: Props) {
  const monitoredCoverage = statistics.activeGrants > 0
    ? Math.round((statistics.monitoredProjects / statistics.activeGrants) * 100)
    : 0

  const cards = [
    {
      label: 'Active GIA grants',
      value: statistics.activeGrants.toLocaleString(),
      detail: 'Active Grants-in-Aid projects',
      icon: FolderKanban,
      iconClass: 'bg-blue-50 text-[#0f53b7]',
    },
    {
      label: 'Grant allocation',
      value: formatCurrency(statistics.totalGrantAmount),
      detail: 'Active GIA portfolio funding',
      icon: Landmark,
      iconClass: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'Milestone progress',
      value: `${statistics.averageMilestoneProgress}%`,
      detail: 'Average completion across recorded deliverables',
      icon: FileCheck2,
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Pending milestones',
      value: statistics.pendingMilestones.toLocaleString(),
      detail: `${statistics.delayedMilestones} currently delayed`,
      icon: CircleAlert,
      iconClass: 'bg-amber-50 text-amber-700',
    },
  ]

  return (
    <div className="space-y-5 font-sans">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <article key={card.label} className="rounded-2xl border border-[#B5BFCD]/70 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
                  <p className="mt-2 truncate text-2xl font-black tracking-tight text-slate-950">{card.value}</p>
                </div>
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${card.iconClass}`}>
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{card.detail}</p>
            </article>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#B5BFCD]/70 bg-white shadow-sm">
          <div className="border-b border-[#B5BFCD]/50 px-5 py-4">
            <h2 className="text-base font-bold text-slate-950">Project milestone progress</h2>
            <p className="mt-0.5 text-xs text-slate-500">Live deliverable completion for {period}.</p>
          </div>

          {projects.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <FolderKanban className="size-7 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">No active GIA projects</h3>
              <p className="mt-1 text-xs text-slate-500">Approved active grants will appear here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#B5BFCD]/40">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onSelectProject(project)}
                  className="group block w-full px-5 py-4 text-left transition hover:bg-[#E6EEF4]/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">{project.title}</p>
                          <p className="mt-0.5 truncate text-xs font-semibold text-[#285497]">
                            {project.enterprise}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-black text-[#0f53b7]">{project.progress}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#0f53b7] transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                        <span className="flex min-w-0 items-center gap-1 truncate">
                          <MapPin className="size-3 shrink-0" />
                          {project.location || 'Location not recorded'}
                        </span>
                        <span className="shrink-0 font-semibold">{project.monitoringStatus?.replaceAll('_', ' ')}</span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0f53b7]" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-[#B5BFCD]/70 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Portfolio monitoring</p>
          <div className="mt-6 flex justify-center">
            <div
              className="grid size-40 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#0f53b7 ${monitoredCoverage * 3.6}deg, #e6eef4 0deg)`,
              }}
            >
              <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner">
                <div>
                  <p className="text-3xl font-black text-slate-950">{monitoredCoverage}%</p>
                  <p className="text-[11px] font-semibold text-slate-500">monitored</p>
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-6 space-y-2.5 rounded-xl bg-[#E6EEF4]/55 p-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Monitored projects</dt>
              <dd className="font-black text-slate-900">{statistics.monitoredProjects}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Pending milestones</dt>
              <dd className="font-black text-amber-700">{statistics.pendingMilestones}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Delayed milestones</dt>
              <dd className="font-black text-rose-700">{statistics.delayedMilestones}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
