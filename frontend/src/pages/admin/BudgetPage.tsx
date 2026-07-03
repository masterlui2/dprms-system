import { useState } from 'react'
import {
  AlertTriangle,
  Download,
  FileCheck2,
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

interface TransactionHistoryRecord {
  amount: number
  date: string
  id: string
  processedBy: string
  reference: string
  remarks: string
  status: 'Completed' | 'Pending validation'
  type: string
}

const transactionHistory: TransactionHistoryRecord[] = [
  { id: 'H-01', date: 'Jun 22, 2026', type: 'Equipment Downpayment', amount: 450000, reference: 'DV-2026-0618', processedBy: 'L. Mendoza', remarks: 'First supplier payment', status: 'Completed' },
  { id: 'H-02', date: 'Jun 15, 2026', type: 'Fund Release', amount: 320000, reference: 'OR-2026-1142', processedBy: 'Admin Reyes', remarks: 'Initial project release', status: 'Completed' },
  { id: 'H-03', date: 'May 28, 2026', type: 'Reimbursement', amount: 62500, reference: 'DV-2026-0521', processedBy: 'L. Mendoza', remarks: 'Site preparation materials', status: 'Completed' },
  { id: 'H-04', date: 'May 14, 2026', type: 'Billing Entry', amount: 180000, reference: 'BILL-2026-094', processedBy: 'M. Santos', remarks: 'Installation milestone', status: 'Pending validation' },
  { id: 'H-05', date: 'Apr 30, 2026', type: 'Fund Release', amount: 125000, reference: 'OR-2026-0873', processedBy: 'Admin Reyes', remarks: 'Mobilization cost', status: 'Completed' },
  { id: 'H-06', date: 'Apr 18, 2026', type: 'Adjustment', amount: 28000, reference: 'ADJ-2026-031', processedBy: 'L. Mendoza', remarks: 'Approved line-item adjustment', status: 'Completed' },
]

const transactionColumns: DataColumn<TransactionHistoryRecord>[] = [
  { id: 'date', header: 'Date', sortValue: (item) => item.date, render: (item) => item.date },
  { id: 'type', header: 'Transaction Type', sortValue: (item) => item.type, render: (item) => <span className="font-bold text-slate-900">{item.type}</span> },
  { id: 'amount', header: 'Amount', sortValue: (item) => item.amount, render: (item) => <span className="font-semibold">{formatCurrency(item.amount)}</span> },
  { id: 'reference', header: 'Reference Number', sortValue: (item) => item.reference, render: (item) => <span className="font-mono text-xs text-[#0f53b7]">{item.reference}</span> },
  { id: 'processed', header: 'Processed By', sortValue: (item) => item.processedBy, render: (item) => item.processedBy },
  { id: 'remarks', header: 'Remarks', render: (item) => <span className="text-slate-500">{item.remarks}</span> },
  {
    id: 'status',
    header: 'Status',
    sortValue: (item) => item.status,
    render: (item) => (
      <span className={item.status === 'Completed' ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
        {item.status}
      </span>
    ),
  },
]

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

export function BudgetPage() {
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null)
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
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8e1ee] bg-white px-4 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-[#0f53b7]"
            type="button"
          >
            <Download className="size-4" />
            Export
          </button>
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

      <div className="space-y-5">
        <AdminPanel title="Project allocations">
          <div className="divide-y divide-slate-100">
            {projectRecords.map((project) => {
              const percentage = Math.round((project.used / project.budget) * 100)
              return (
                <article className="px-5 py-4" key={project.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-black text-slate-900">
                        {project.title} - {project.enterprise}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {project.id} - Due {project.dueDate}
                      </p>
                    </div>
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
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-50">
                    <div
                      className={
                        percentage >= 95
                          ? 'h-full rounded-full bg-[#ff8a1f]'
                          : 'h-full rounded-full bg-[#0f53b7]'
                      }
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
                    <span>{formatCurrency(project.used)} used</span>
                    <span>
                      {percentage}% of {formatCurrency(project.budget)}
                    </span>
                  </div>
                  <button
                    className="mt-3 h-9 rounded-lg text-xs font-bold text-[#0f53b7] hover:underline"
                    onClick={() => setSelectedProject(project)}
                    type="button"
                  >
                    View Transaction History
                  </button>
                </article>
              )
            })}
          </div>
        </AdminPanel>

        <AdminPanel title="Recent transactions">
          <DataTable
            columns={recentTransactionColumns}
            data={transactions}
            emptyTitle="No recent transactions"
            getRowKey={(transaction) => transaction.id}
            searchPlaceholder="Search project or transaction..."
            searchText={(transaction) =>
              `${transaction.projectId} ${transaction.description} ${transaction.date}`
            }
          />
        </AdminPanel>
      </div>

      {selectedProject ? (
        <ModalShell
          description={`${selectedProject.id} - ${selectedProject.title} / ${selectedProject.enterprise}`}
          footer={
            <div className="flex justify-end">
              <button
                className="h-10 rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
                onClick={() => setSelectedProject(null)}
                type="button"
              >
                Close
              </button>
            </div>
          }
          onClose={() => setSelectedProject(null)}
          title="Transaction History"
          width="xl"
        >
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <DataTable
              columns={transactionColumns}
              data={transactionHistory}
              emptyTitle="No transactions recorded"
              getRowKey={(item) => item.id}
              searchPlaceholder="Search transaction, reference, processor, or remarks..."
              searchText={(item) =>
                `${item.date} ${item.type} ${item.reference} ${item.processedBy} ${item.remarks} ${item.status}`
              }
            />
          </div>
        </ModalShell>
      ) : null}
    </div>
  )
}
