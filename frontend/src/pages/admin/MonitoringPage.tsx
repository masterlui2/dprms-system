import { useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  MapPin,
} from 'lucide-react'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import {
  DataTable,
  type DataColumn,
} from '../../components/admin/DataTable'
import { MetricCard } from '../../components/admin/MetricCard'
import { ModalShell } from '../../components/admin/ModalShell'
import {
  formatCurrency,
  projectRecords,
  type ProjectRecord,
} from '../../data/admin'
import { cn } from '../../utils/cn'

interface FinancialTransaction {
  amount: number
  date: string
  id: string
  reference: string
  status: 'Completed' | 'For validation'
  type: string
}

interface ReportRecord {
  id: string
  period: string
  project: string
  status: 'Approved' | 'Under review' | 'Pending'
  submitted: string
}

const reminders = [
  {
    title: 'Quarterly compliance report due',
    project: 'GreenHarvest',
    when: 'In 3 days',
    tone: 'bg-red-500',
  },
  {
    title: 'Site visit scheduled',
    project: 'Highland Coffee',
    when: 'Jul 5',
    tone: 'bg-[#0f53b7]',
  },
  {
    title: 'Equipment turnover activity',
    project: 'Bright Foods',
    when: 'Jul 12',
    tone: 'bg-amber-500',
  },
]

const visits = [
  {
    id: 'VIS-024',
    project: 'Highland Coffee',
    site: 'Manay, Davao Oriental',
    date: 'Jul 5, 2026',
    lead: 'Ana Reyes',
    status: 'Scheduled',
  },
  {
    id: 'VIS-025',
    project: 'Bright Foods',
    site: 'Mati City',
    date: 'Jul 8, 2026',
    lead: 'Maria Santos',
    status: 'Scheduled',
  },
  {
    id: 'VIS-026',
    project: 'DOrSU Research Center',
    site: 'Baganga',
    date: 'Jul 12, 2026',
    lead: 'Kevin Lim',
    status: 'Scheduled',
  },
  {
    id: 'VIS-027',
    project: 'Cateel Bamboo Association',
    site: 'Cateel',
    date: 'Jul 18, 2026',
    lead: 'Kevin Lim',
    status: 'Planned',
  },
]

const reportRecords: ReportRecord[] = [
  {
    id: 'REP-101',
    project: 'Bright Foods',
    period: 'Q2 2026',
    submitted: 'Jun 22',
    status: 'Approved',
  },
  {
    id: 'REP-102',
    project: 'GreenHarvest',
    period: 'Q2 2026',
    submitted: 'Jun 18',
    status: 'Under review',
  },
  {
    id: 'REP-103',
    project: 'Highland Coffee',
    period: 'Q2 2026',
    submitted: 'Not submitted',
    status: 'Pending',
  },
  {
    id: 'REP-104',
    project: 'DOrSU Research Center',
    period: 'Q1 2026',
    submitted: 'Mar 30',
    status: 'Approved',
  },
  {
    id: 'REP-105',
    project: 'CarpenTech',
    period: 'Final',
    submitted: 'May 28',
    status: 'Approved',
  },
]

function projectStatus(project: ProjectRecord): string {
  if (project.status === 'At risk') return 'At Risk'
  if (project.status === 'Completed') return 'Completed'
  return 'On Track'
}

function projectStatusClass(project: ProjectRecord): string {
  if (project.status === 'At risk') return 'text-red-600'
  if (project.status === 'Completed') return 'text-emerald-700'
  return 'text-[#0f53b7]'
}

function createTransactions(project: ProjectRecord): FinancialTransaction[] {
  const factors = [0.28, 0.18, 0.15, 0.12, 0.1, 0.09, 0.08]
  const types = [
    'Equipment Downpayment',
    'Fund Release',
    'Installation Payment',
    'Materials Reimbursement',
    'Training Expense',
    'Site Preparation',
    'Final Adjustment',
  ]
  const dates = [
    'Jun 22, 2026',
    'Jun 10, 2026',
    'May 28, 2026',
    'May 14, 2026',
    'Apr 30, 2026',
    'Apr 18, 2026',
    'Apr 5, 2026',
  ]

  return factors.map((factor, index) => ({
    id: `${project.id}-TX-${index + 1}`,
    date: dates[index],
    type: types[index],
    amount: Math.round(project.used * factor),
    reference: `DV-2026-${project.id.slice(2)}${String(index + 1).padStart(2, '0')}`,
    status: index === 2 ? 'For validation' : 'Completed',
  }))
}

const reportColumns: DataColumn<ReportRecord>[] = [
  {
    id: 'project',
    header: 'Project',
    sortValue: (report) => report.project,
    render: (report) => (
      <span className="font-bold text-slate-900">{report.project}</span>
    ),
  },
  {
    id: 'period',
    header: 'Period',
    sortValue: (report) => report.period,
    render: (report) => report.period,
  },
  {
    id: 'submitted',
    header: 'Submitted',
    sortValue: (report) => report.submitted,
    render: (report) => (
      <span className="text-slate-600">{report.submitted}</span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortValue: (report) => report.status,
    render: (report) => (
      <span
        className={cn(
          'font-bold',
          report.status === 'Approved'
            ? 'text-emerald-700'
            : report.status === 'Pending'
              ? 'text-amber-700'
              : 'text-[#0f53b7]',
        )}
      >
        {report.status}
      </span>
    ),
  },
]

function FinancialHistoryModal({
  onClose,
  project,
}: {
  onClose: () => void
  project: ProjectRecord
}) {
  const transactionRecords = createTransactions(project)
  const remaining = project.budget - project.used
  const transactionColumns: DataColumn<FinancialTransaction>[] = [
    {
      id: 'date',
      header: 'Date',
      sortValue: (item) => item.date,
      render: (item) => item.date,
    },
    {
      id: 'type',
      header: 'Transaction',
      sortValue: (item) => item.type,
      render: (item) => (
        <span className="font-bold text-slate-900">{item.type}</span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      sortValue: (item) => item.amount,
      render: (item) => (
        <span className="font-semibold">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      id: 'reference',
      header: 'Reference',
      sortValue: (item) => item.reference,
      render: (item) => (
        <span className="font-mono text-xs text-[#0f53b7]">
          {item.reference}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (item) => item.status,
      render: (item) => (
        <span
          className={
            item.status === 'Completed'
              ? 'font-bold text-emerald-700'
              : 'font-bold text-amber-700'
          }
        >
          {item.status}
        </span>
      ),
    },
  ]

  return (
    <ModalShell
      description={`${project.id} - ${project.title} / ${project.enterprise}`}
      footer={
        <div className="flex justify-end">
          <button
            className="h-10 rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      }
      onClose={onClose}
      title="Project Transaction History"
      width="xl"
    >
      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          ['Total Allocation', formatCurrency(project.budget), 'text-[#073b82]'],
          ['Amount Utilized', formatCurrency(project.used), 'text-red-600'],
          ['Remaining Balance', formatCurrency(remaining), 'text-emerald-700'],
        ].map(([label, value, color]) => (
          <div className="rounded-xl bg-slate-50 p-4" key={label}>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className={cn('mt-2 text-2xl font-black', color)}>{value}</p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <DataTable
          columns={transactionColumns}
          data={transactionRecords}
          getRowKey={(item) => item.id}
          initialRowsPerPage={5}
          searchPlaceholder="Search transaction or reference..."
          searchText={(item) =>
            `${item.date} ${item.type} ${item.reference} ${item.status}`
          }
        />
      </div>
    </ModalShell>
  )
}

export function MonitoringPage() {
  const [selectedProject, setSelectedProject] =
    useState<ProjectRecord | null>(null)
  const activeCount = projectRecords.filter(
    (project) => project.status === 'Active',
  ).length
  const onTrackCount = projectRecords.filter(
    (project) => project.status === 'Active',
  ).length
  const atRiskCount = projectRecords.filter(
    (project) => project.status === 'At risk',
  ).length

  const projectColumns: DataColumn<ProjectRecord>[] = [
    {
      id: 'project',
      header: 'Project',
      sortValue: (project) => project.title,
      render: (project) => (
        <div>
          <p className="font-bold text-slate-900">
            {project.title} - {project.enterprise}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Lead: {project.manager}
          </p>
        </div>
      ),
    },
    {
      id: 'progress',
      header: 'Progress',
      sortValue: (project) => project.progress,
      render: (project) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={
                  project.status === 'At risk'
                    ? 'h-full bg-red-500'
                    : 'h-full bg-[#0f53b7]'
                }
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="w-9 text-right text-xs font-black text-slate-600">
              {project.progress}%
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'milestone',
      header: 'Next Milestone',
      render: (project) => (
        <div>
          <p className="font-semibold text-slate-700">
            {project.status === 'Completed'
              ? 'Project closeout'
              : project.progress > 70
                ? 'Final validation'
                : project.progress > 40
                  ? 'Trial production'
                  : 'Site preparation'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Due {project.dueDate}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (project) => project.status,
      render: (project) => (
        <span className={cn('font-bold', projectStatusClass(project))}>
          {projectStatus(project)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-7">
      <AdminPageHeader
        description="Track project progress, accomplishment reports, compliance requirements, financial activity, and site visits."
        eyebrow="Project Operations"
        title="Project Monitoring"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Currently under implementation"
          icon={Activity}
          label="Active Projects"
          value={String(activeCount)}
        />
        <MetricCard
          detail={`${Math.round((onTrackCount / projectRecords.length) * 100)}% of portfolio`}
          icon={CheckCircle2}
          label="On Track"
          tone="green"
          value={String(onTrackCount)}
        />
        <MetricCard
          detail="Action required"
          icon={AlertTriangle}
          label="At Risk"
          tone="red"
          value={String(atRiskCount)}
        />
        <MetricCard
          detail="Next 14 days"
          icon={Bell}
          label="Reminders"
          tone="gold"
          value={String(reminders.length)}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.8fr)]">
        <AdminPanel
          description="Select any project row to view transactions and remaining balance."
          title="Project progress"
        >
          <DataTable
            columns={projectColumns}
            data={projectRecords}
            getRowKey={(project) => project.id}
            initialRowsPerPage={5}
            onRowClick={setSelectedProject}
            searchPlaceholder="Search project, enterprise, or lead..."
            searchText={(project) =>
              `${project.id} ${project.title} ${project.enterprise} ${project.manager} ${project.status}`
            }
          />
        </AdminPanel>

        <div className="space-y-5">
          <AdminPanel title="Upcoming reminders">
            <ul className="divide-y divide-slate-100">
              {reminders.map((reminder) => (
                <li className="flex items-start gap-3 px-5 py-4" key={reminder.title}>
                  <span
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      reminder.tone,
                    )}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {reminder.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {reminder.project} - {reminder.when}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </AdminPanel>

          <AdminPanel title="Compliance score">
            <div className="p-5">
              <p className="text-3xl font-black text-[#073b82]">
                92
                <span className="text-base font-normal text-slate-400">/100</span>
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Reporting, financial, and milestone compliance.
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[92%] bg-[#0f53b7]" />
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminPanel title="Accomplishment reports">
          <DataTable
            columns={reportColumns}
            data={reportRecords}
            getRowKey={(report) => report.id}
            initialRowsPerPage={5}
            searchPlaceholder="Search project or reporting period..."
            searchText={(report) =>
              `${report.project} ${report.period} ${report.submitted} ${report.status}`
            }
          />
        </AdminPanel>

        <AdminPanel
          description="Upcoming field validation activities"
          title="Site visit schedule"
        >
          <ul className="divide-y divide-slate-100">
            {visits.map((visit) => (
              <li
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center"
                key={visit.id}
              >
                <MapPin className="size-4 shrink-0 text-[#0f53b7]" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{visit.project}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {visit.site} - Lead: {visit.lead}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    {visit.date}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#0f53b7]">
                    {visit.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>

      {selectedProject ? (
        <FinancialHistoryModal
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      ) : null}
    </div>
  )
}
