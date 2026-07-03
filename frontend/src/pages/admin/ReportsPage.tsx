import {
  BarChart3,
  Download,
  FileBarChart,
  FileSpreadsheet,
  History,
  PackageSearch,
} from 'lucide-react'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { MetricCard } from '../../components/admin/MetricCard'
import { StatusPill } from '../../components/admin/StatusPill'
import {
  generatedReports,
  projectRecords,
  reportCatalog,
} from '../../data/admin'

const reportIcons = {
  Financial: FileSpreadsheet,
  Performance: BarChart3,
  Monitoring: FileBarChart,
  Inventory: PackageSearch,
}

export function ReportsPage() {
  return (
    <div className="space-y-7">
      <AdminPageHeader
        description="Prepare standardized financial, accomplishment, inventory, and MSME performance reports."
        eyebrow="Management Information"
        title="Reports & Analytics"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Generated this month"
          icon={FileBarChart}
          label="Reports Generated"
          value="18"
        />
        <MetricCard
          detail="GIA and SETUP combined"
          icon={BarChart3}
          label="Portfolio Completion"
          tone="sky"
          value={`${Math.round(
            projectRecords.reduce((sum, item) => sum + item.progress, 0) /
              projectRecords.length,
          )}%`}
        />
        <MetricCard
          detail="Reports submitted on schedule"
          icon={FileSpreadsheet}
          label="Compliance Rate"
          tone="green"
          value="94%"
        />
        <MetricCard
          detail="Available in report history"
          icon={History}
          label="Saved Reports"
          tone="gold"
          value={String(generatedReports.length)}
        />
      </section>

      <AdminPanel
        description="Choose a standardized template to prepare a mock report."
        title="Report library"
      >
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {reportCatalog.map((report) => {
            const Icon =
              reportIcons[report.category as keyof typeof reportIcons]
            return (
              <article
                className="flex flex-col gap-4 rounded-xl border border-slate-200 p-5 sm:flex-row sm:items-center"
                key={report.id}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0f53b7]">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <StatusPill tone="neutral">{report.category}</StatusPill>
                  <h3 className="mt-2 font-black text-slate-900">{report.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {report.description}
                  </p>
                </div>
                <button
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-bold text-[#073b82] transition hover:border-blue-300 hover:bg-blue-50"
                  type="button"
                >
                  Generate
                </button>
              </article>
            )
          })}
        </div>
      </AdminPanel>

      <AdminPanel title="Recent reports">
        <div className="divide-y divide-slate-100">
          {generatedReports.map((report) => (
            <article
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              key={report.id}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <FileBarChart className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{report.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {report.id} - Generated {report.generated} by {report.owner}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill tone="info">{report.format}</StatusPill>
                <button
                  aria-label={`Download ${report.title}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#0f53b7] transition hover:border-blue-300 hover:bg-blue-50"
                  type="button"
                >
                  <Download className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </AdminPanel>
    </div>
  )
}
