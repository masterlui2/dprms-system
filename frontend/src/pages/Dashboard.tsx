import { StatusBadge } from '../components/StatusBadge'
import { useApiConnection } from '../hooks/useApiConnection'

const metrics = [
  { label: 'Active Projects', value: '12', detail: 'Across monitoring units' },
  { label: 'Allocated Resources', value: '84%', detail: 'Current utilization' },
  { label: 'Reports Due', value: '5', detail: 'This review cycle' },
]

export function Dashboard() {
  const { error, isLoading, message } = useApiConnection()

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <StatusBadge tone={error ? 'warning' : 'success'}>
              {isLoading ? 'Checking API' : error ? 'API Offline' : 'API Online'}
            </StatusBadge>
            <h1 className="mt-4 text-2xl font-bold text-slate-950">
              Project Operations Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Use this dashboard shell to build DPRMS project tracking, resource
              planning, reports, and future prediction workflows.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-[#f6f8fb] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Laravel API
            </p>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {isLoading ? 'Loading...' : message ?? error}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            key={metric.label}
          >
            <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm text-slate-600">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Project Pipeline</h2>
              <p className="mt-1 text-sm text-slate-600">UI-ready placeholder for capstone modules.</p>
            </div>
            <StatusBadge>Scaffold</StatusBadge>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>Project</span>
              <span>Status</span>
              <span>Owner</span>
            </div>
            {['Research Grants Portal', 'Regional Lab Upgrade', 'Scholarship Tracker'].map(
              (project, index) => (
                <div
                  className="grid grid-cols-3 border-t border-slate-200 px-4 py-3 text-sm"
                  key={project}
                >
                  <span className="font-semibold text-slate-800">{project}</span>
                  <span className="text-slate-600">{index === 1 ? 'Review' : 'Active'}</span>
                  <span className="text-slate-600">DOST Unit {index + 1}</span>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Resource Snapshot</h2>
          <div className="mt-5 space-y-4">
            {['Budget', 'Personnel', 'Equipment'].map((item, index) => (
              <div key={item}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">{item}</span>
                  <span className="text-slate-500">{70 + index * 8}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-[#105c4a]"
                    style={{ width: `${70 + index * 8}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
