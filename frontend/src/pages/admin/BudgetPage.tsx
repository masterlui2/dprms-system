import { useState } from 'react'
import {
  AlertTriangle,
  Download,
  FileCheck2,
  History,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminPanel } from '../../components/admin/AdminPanel'
import { MetricCard } from '../../components/admin/MetricCard'
import { ModalShell } from '../../components/admin/ModalShell'
import {
  DataTable,
  type DataColumn,
} from '../../components/admin/DataTable'
import { StatusPill } from '../../components/admin/StatusPill'
import {
  formatCurrency,
  projectRecords,
  transactions,
  type ProjectRecord,
} from '../../data/admin'

interface FinancialTransaction {
  amount: number
  date: string
  id: string
  reference: string
  status: 'Completed' | 'For validation'
  type: string
}

type RecentTransaction = (typeof transactions)[number]

const recentTransactionColumns: DataColumn<RecentTransaction>[] = [
  {
    id: 'date',
    header: 'Date',
    sortValue: (transaction) => transaction.date,
    render: (transaction) => transaction.date,
  },
  {
    id: 'project',
    header: 'Project',
    sortValue: (transaction) => transaction.projectId,
    render: (transaction) => (
      <span className="font-mono text-xs text-[#0f53b7]">
        {transaction.projectId}
      </span>
    ),
  },
  {
    id: 'description',
    header: 'Transaction',
    sortValue: (transaction) => transaction.description,
    render: (transaction) => (
      <span className="font-bold text-slate-900">
        {transaction.description}
      </span>
    ),
  },
  {
    id: 'amount',
    header: 'Amount',
    sortValue: (transaction) => transaction.amount,
    render: (transaction) => (
      <span className="font-black text-red-600">
        -{formatCurrency(transaction.amount)}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    render: () => <span className="font-bold text-emerald-700">Recorded</span>,
  },
]

const allocationColumns: DataColumn<ProjectRecord>[] = [
  {
    id: 'project',
    header: 'Project',
    sortValue: (project) => project.enterprise,
    render: (project) => (
      <div>
        <p className="font-black text-slate-900">
          {project.title} - {project.enterprise}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {project.id} - Due {project.dueDate}
        </p>
      </div>
    ),
  },
  {
    id: 'program',
    header: 'Program',
    sortValue: (project) => project.program,
    render: (project) => (
      <span
        className={
          project.program === 'GIA'
            ? 'font-black text-[#0f53b7]'
            : 'font-black text-emerald-700'
        }
      >
        {project.program}
      </span>
    ),
  },
  {
    id: 'utilization',
    header: 'Utilization',
    sortValue: (project) => Math.round((project.used / project.budget) * 100),
    render: (project) => {
      const percentage = Math.round((project.used / project.budget) * 100)

      return (
        <div>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-blue-50">
              <div
                className={
                  percentage >= 95
                    ? 'h-full rounded-full bg-red-600'
                    : 'h-full rounded-full bg-[#0f53b7]'
                }
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs font-black text-slate-600">
              {percentage}%
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {formatCurrency(project.used)} of {formatCurrency(project.budget)}
          </p>
        </div>
      )
    },
  },
  {
    id: 'used',
    header: 'Used',
    sortValue: (project) => project.used,
    render: (project) => (
      <span className="font-bold text-slate-900">
        {formatCurrency(project.used)}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortValue: (project) => project.status,
    render: (project) => (
      <StatusPill
        tone={
          project.status === 'At risk'
            ? 'danger'
            : project.status === 'Completed'
              ? 'success'
              : 'info'
        }
      >
        {project.status}
      </StatusPill>
    ),
  },
]

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

function ProjectTransactionModal({
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
            <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
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

function RecentTransactionsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell
      description="Recorded disbursements and recent payment activities"
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
      title="Recent transactions"
      width="xl"
    >
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <DataTable
          columns={recentTransactionColumns}
          data={transactions}
          emptyTitle="No recent transactions"
          getRowKey={(transaction) => transaction.id}
          initialRowsPerPage={5}
          searchPlaceholder="Search project or transaction..."
          searchText={(transaction) =>
            `${transaction.projectId} ${transaction.description} ${transaction.date}`
          }
          variant="clean"
        />
      </div>
    </ModalShell>
  )
}

export function BudgetPage() {
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null)
  const [recentTransactionsOpen, setRecentTransactionsOpen] = useState(false)
  const totalAllocated = projectRecords.reduce(
    (total, project) => total + project.budget,
    0,
  )
  const totalUsed = projectRecords.reduce(
    (total, project) => total + project.used,
    0,
  )
  const utilization = Math.round((totalUsed / totalAllocated) * 100)

  return (
    <div className="space-y-7">
      <AdminPageHeader
        action={
          <div className="flex items-center gap-2">
            <button
              aria-label="Open recent transactions"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-[#d8e1ee] bg-white text-[#073b82] transition hover:border-blue-300 hover:bg-blue-50"
              onClick={() => setRecentTransactionsOpen(true)}
              title="Recent transactions"
              type="button"
            >
              <History className="size-5" />
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8e1ee] bg-white px-4 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-[#0f53b7]"
              type="button"
            >
              <Download className="size-4" />
              Export
            </button>
          </div>
        }
        description="Monitor disbursements, billing compliance, payment schedules, and auditable financial records."
        eyebrow="Financial Management"
        title="Budget Management"
      />

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          detail="Across active funded projects"
          icon={Wallet}
          label="Total Allocated"
          value={formatCurrency(totalAllocated)}
        />
        <MetricCard
          detail={`${utilization}% utilization`}
          icon={TrendingUp}
          label="Disbursed YTD"
          tone="orange"
          value={formatCurrency(totalUsed)}
        />
        <MetricCard
          detail="Official receipts validated"
          icon={FileCheck2}
          label="Billing Compliance"
          tone="sky"
          value="94%"
        />
        <MetricCard
          detail="Schedule or compliance issues"
          icon={AlertTriangle}
          label="Alerts"
          tone="red"
          value="3"
        />
      </section>

      <AdminPanel
        action={
          <button
            aria-label="Open recent transactions"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#0f53b7] transition hover:border-blue-300 hover:bg-blue-50"
            onClick={() => setRecentTransactionsOpen(true)}
            title="Recent transactions"
            type="button"
          >
            <History className="size-4" />
          </button>
        }
        title="Project allocations"
      >
        <DataTable
          columns={allocationColumns}
          data={projectRecords}
          getRowKey={(project) => project.id}
          initialRowsPerPage={5}
          onRowClick={setSelectedProject}
          searchPlaceholder="Search project, enterprise, or status..."
          searchText={(project) =>
            `${project.id} ${project.title} ${project.enterprise} ${project.status} ${project.dueDate}`
          }
          variant="clean"
        />
      </AdminPanel>

      {selectedProject ? (
        <ProjectTransactionModal
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      ) : null}

      {recentTransactionsOpen ? (
        <RecentTransactionsModal
          onClose={() => setRecentTransactionsOpen(false)}
        />
      ) : null}
    </div>
  )
}
