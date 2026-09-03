import {
  ArrowRight,
  CheckCircle2,
  ClipboardClock,
  FolderKanban,
  MapPin,
  Store,
} from 'lucide-react'

import type { ProjectRecord } from '../../data/admin'
import type { SetupMonitoringStatistics } from '../../services/setupMonitoringStore'

interface Props {
  projects: ProjectRecord[]
  statistics: SetupMonitoringStatistics
  onSelectProject: (project: ProjectRecord) => void
  period?: string
}

function formatLastMonitored(value?: string | null): string {
  if (!value) return 'Not yet monitored'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not yet monitored'

  return date.toLocaleDateString('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function MonitoringOverviewSection({
  projects,
  statistics,
  onSelectProject,
  period = 'Current quarter',
}: Props) {
  const coverage = statistics.activeProjects > 0
    ? Math.round((statistics.monitoredCount / statistics.activeProjects) * 100)
    : 0
  const needsAttention = projects
    .filter((project) => !project.monitored || (project.pendingReports ?? 0) > 0)
    .slice(0, 5)

  const cards = [
    {
      label: 'Active SETUP projects',
      value: statistics.activeProjects,
      detail: 'Approved projects currently under implementation',
      icon: FolderKanban,
      iconClass: 'bg-blue-50 text-[#0f53b7]',
    },
    {
      label: 'Monitored count',
      value: statistics.monitoredCount,
      detail: `${coverage}% of active projects have monitoring activity`,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Pending reports',
      value: statistics.pendingReports,
      detail: statistics.pendingReports === 0
        ? 'No draft or returned reports require action'
        : 'Draft or returned reports requiring action',
      icon: ClipboardClock,
      iconClass: 'bg-amber-50 text-amber-700',
    },
  ]

  return (
    <div className="space-y-5 font-sans">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.label}
              className="rounded-2xl border border-[#B5BFCD]/70 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    {card.value}
                  </p>
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
          <div className="flex items-center justify-between gap-4 border-b border-[#B5BFCD]/50 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Projects requiring attention</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Unmonitored projects and projects with pending reports for {period}.
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              {needsAttention.length} shown
            </span>
          </div>

          {needsAttention.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="size-6" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-slate-900">Monitoring is up to date</h3>
              <p className="mt-1 text-xs text-slate-500">No active SETUP projects currently need attention.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#B5BFCD]/40">
              {needsAttention.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onSelectProject(project)}
                  className="group flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[#E6EEF4]/45"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E6EEF4] text-[#285497]">
                    <Store className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {project.enterprise || project.title}
                    </span>
                    <span className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                      <MapPin className="size-3 shrink-0" />
                      {project.location || 'Location not recorded'}
                    </span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="block text-xs font-bold text-slate-700">
                      {(project.pendingReports ?? 0) > 0
                        ? `${project.pendingReports} pending`
                        : 'Monitoring needed'}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {formatLastMonitored(project.lastMonitoredAt)}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0f53b7]" />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-[#B5BFCD]/70 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Monitoring coverage</p>
          <div className="mt-6 flex justify-center">
            <div
              className="grid size-40 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#0f53b7 ${coverage * 3.6}deg, #e6eef4 0deg)`,
              }}
            >
              <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner">
                <div>
                  <p className="text-3xl font-black text-slate-950">{coverage}%</p>
                  <p className="text-[11px] font-semibold text-slate-500">covered</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-xl bg-[#E6EEF4]/60 px-4 py-3 text-center">
            <p className="text-sm font-bold text-slate-900">
              {statistics.monitoredCount} of {statistics.activeProjects}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">active projects monitored</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
