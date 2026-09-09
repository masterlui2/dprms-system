import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  LoaderCircle,
  LockKeyhole,
  PencilLine,
  ReceiptText,
  Wallet,
} from 'lucide-react'
import Swal from 'sweetalert2'

import {
  fetchSetupRepaymentLedger,
  repaymentErrorMessage,
  type RepaymentInstallment,
  type RepaymentTransaction,
  type SetupRepaymentLedger,
} from '../../services/repaymentLedgerStore'
import { cn } from '../../utils/cn'
import { AdminPageHeader } from './AdminPageHeader'
import { AdminPanel } from './AdminPanel'
import { DataTable, type DataColumn } from './DataTable'
import { LogPaymentModal } from './LogPaymentModal'
import { MetricCard } from './MetricCard'
import { RepaymentScheduleBuilder } from './RepaymentScheduleBuilder'
import { VerifyPaymentModal } from './VerifyPaymentModal'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value)
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-PH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
}

function formatMonthYear(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date
        .toLocaleDateString('en-PH', { month: 'short', year: '2-digit' })
        .replace(' ', '-')
}

function statusLabel(
  installment: RepaymentInstallment,
  transaction?: RepaymentTransaction,
): string {
  if (transaction?.status === 'pending') return 'For review'
  if (transaction?.status === 'rejected') return 'Rejected'
  if (installment.status === 'paid') return 'Paid'
  if (installment.status === 'overdue') return 'Overdue'
  return 'Pending'
}

function PaymentStatus({
  installment,
  transaction,
}: {
  installment: RepaymentInstallment
  transaction?: RepaymentTransaction
}) {
  const label = statusLabel(installment, transaction)

  return (
    <span
      className={cn(
        'text-xs font-black',
        label === 'Paid' && 'text-emerald-700',
        (label === 'Pending' || label === 'For review') && 'text-amber-700',
        (label === 'Overdue' || label === 'Rejected') && 'text-rose-700',
      )}
    >
      {label}
    </span>
  )
}

export function RepaymentLedgerView({
  onBack,
  projectId,
}: {
  onBack?: () => void
  projectId: number
}) {
  const [ledger, setLedger] = useState<SetupRepaymentLedger | null>(null)
  const [paymentInstallment, setPaymentInstallment] =
    useState<RepaymentInstallment | null>(null)
  const [reviewSelection, setReviewSelection] = useState<{
    installment: RepaymentInstallment
    transaction: RepaymentTransaction
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLedger = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const loadedLedger = await fetchSetupRepaymentLedger(projectId)
      setLedger(loadedLedger)
      setIsEditingSchedule(
        !loadedLedger.schedule.initialized
          && loadedLedger.permissions.canManageSchedule,
      )
    } catch (loadError) {
      setError(repaymentErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadLedger()
  }, [loadLedger])

  if (isLoading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-8 animate-spin text-[#0f53b7]" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Loading ledger…</p>
        </div>
      </div>
    )
  }

  if (error || !ledger) {
    return (
      <div className="space-y-5">
        {onBack ? (
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#0f53b7] ring-1 ring-slate-200 hover:bg-blue-50"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="size-4" /> Back to projects
          </button>
        ) : null}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertTriangle className="mx-auto size-6 text-rose-600" />
          <p className="mt-3 font-bold text-rose-900">Could not load this ledger</p>
          <p className="mt-1 text-sm text-rose-700">{error}</p>
          <button
            className="mt-4 h-9 rounded-lg bg-white px-4 text-xs font-bold text-rose-700 ring-1 ring-rose-200"
            onClick={() => void loadLedger()}
            type="button"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  function actionFor(item: RepaymentInstallment) {
    if (!ledger) return null
    const pendingTransaction = item.transactions.find(
      (transaction) => transaction.status === 'pending',
    )
    const latestTransaction = item.transactions[0]

    if (pendingTransaction) {
      return (
        <button
          className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700 hover:underline"
          onClick={() =>
            setReviewSelection({
              installment: item,
              transaction: pendingTransaction,
            })
          }
          type="button"
        >
          <Eye className="size-3.5" />
          {ledger.permissions.canVerifyPayment ? 'Review' : 'View'}
        </button>
      )
    }

    if (ledger.permissions.canRecordPayment && item.remainingAmount > 0) {
      return (
        <button
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0f53b7] px-2.5 text-xs font-bold text-white hover:bg-[#0b3f8b]"
          onClick={() => setPaymentInstallment(item)}
          type="button"
        >
          <ReceiptText className="size-3.5" />
          {latestTransaction?.status === 'rejected' ? 'Resubmit' : 'Pay'}
        </button>
      )
    }

    return latestTransaction ? (
      <button
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f53b7] hover:underline"
        onClick={() =>
          setReviewSelection({ installment: item, transaction: latestTransaction })
        }
        type="button"
      >
        <Eye className="size-3.5" /> View
      </button>
    ) : (
      <span className="text-slate-300">—</span>
    )
  }

  const columns: DataColumn<RepaymentInstallment>[] = [
    {
      className: 'w-[11%] !text-[11px]',
      header: 'Month-Year',
      id: 'monthYear',
      render: (item) => (
        <span className="font-black text-slate-900" title={item.period}>
          {formatMonthYear(item.dueDate)}
        </span>
      ),
      sortValue: (item) => item.dueDate,
    },
    {
      className: 'w-[14%] !text-[11px] text-right',
      header: 'Amount',
      id: 'scheduledAmount',
      render: (item) => (
        <span className="font-bold text-slate-700">{formatCurrency(item.amount)}</span>
      ),
      sortValue: (item) => item.amount,
    },
    {
      className: 'w-[16%] !text-[11px]',
      header: 'Bank / Branch',
      id: 'bank',
      render: (item) => (
        <span className="text-xs leading-4 text-slate-600">
          {item.transactions[0]?.bankBranch ?? '—'}
        </span>
      ),
    },
    {
      className: 'w-[12%] !text-[11px]',
      header: 'Check No.',
      id: 'checkNumber',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700">
          {item.transactions[0]?.checkNumber ?? '—'}
        </span>
      ),
    },
    {
      className: 'w-[15%] !text-[11px]',
      header: 'OR No.',
      id: 'orNumber',
      render: (item) => {
        const transaction = item.transactions[0]
        return transaction ? (
          <p className="truncate text-xs font-black text-slate-800">
            {transaction.orNumber}
          </p>
        ) : (
          <span className="text-slate-300">—</span>
        )
      },
    },
    {
      className: 'w-[12%] !text-[11px]',
      header: 'OR Date',
      id: 'orDate',
      render: (item) => (
        <span className="text-xs text-slate-600">
          {formatDate(item.transactions[0]?.paymentDate ?? null)}
        </span>
      ),
    },
    {
      className: 'w-[10%] !text-[11px]',
      header: 'Status',
      id: 'status',
      render: (item) => (
        <PaymentStatus installment={item} transaction={item.transactions[0]} />
      ),
      sortValue: (item) => statusLabel(item, item.transactions[0]),
    },
    {
      className: 'w-[10%] !text-[11px] text-right',
      header: 'Action',
      id: 'action',
      render: actionFor,
    },
  ]

  function handlePaymentSubmitted(updated: SetupRepaymentLedger) {
    setLedger(updated)
    setPaymentInstallment(null)
    void Swal.fire({
      icon: 'success',
      position: 'top-end',
      showConfirmButton: false,
      text: 'Ready for focal review.',
      timer: 2500,
      title: 'Payment submitted',
      toast: true,
    })
  }

  function handlePaymentReviewed(
    updated: SetupRepaymentLedger,
    decision: 'verified' | 'rejected',
  ) {
    setLedger(updated)
    setReviewSelection(null)
    void Swal.fire({
      icon: decision === 'verified' ? 'success' : 'info',
      position: 'top-end',
      showConfirmButton: false,
      timer: 2500,
      title: decision === 'verified' ? 'Payment verified' : 'Payment rejected',
      toast: true,
    })
  }

  function handleScheduleSaved(updated: SetupRepaymentLedger) {
    setLedger(updated)
    setIsEditingSchedule(false)
    void Swal.fire({
      icon: 'success',
      position: 'top-end',
      showConfirmButton: false,
      text: 'The funding terms and installment rows are now live.',
      timer: 2800,
      title: 'Repayment schedule saved',
      toast: true,
    })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        action={
          (onBack
            || ledger.permissions.readOnly
            || ledger.permissions.canManageSchedule
            || ledger.schedule.locked) ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {onBack ? (
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#0f53b7] ring-1 ring-slate-200 hover:bg-blue-50"
                  onClick={onBack}
                  type="button"
                >
                  <ArrowLeft className="size-4" /> Projects
                </button>
              ) : null}
              {ledger.permissions.readOnly ? (
                <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-black text-slate-600">
                  Read only
                </span>
              ) : null}
              {ledger.schedule.locked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800">
                  <LockKeyhole className="size-3.5" /> Schedule locked
                </span>
              ) : null}
              {ledger.permissions.canManageSchedule && !isEditingSchedule ? (
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#0b3f8b]"
                  onClick={() => setIsEditingSchedule(true)}
                  type="button"
                >
                  <PencilLine className="size-4" />
                  {ledger.schedule.initialized ? 'Edit schedule' : 'Initialize ledger'}
                </button>
              ) : null}
            </div>
          ) : undefined
        }
        description=""
        eyebrow={ledger.project.referenceNumber}
        title={ledger.project.title}
      />

      <p className="text-sm text-slate-500">
        <span className="font-bold text-slate-800">{ledger.project.cooperator}</span>
        <span className="mx-2 text-slate-300">·</span>
        {ledger.project.location}
      </p>

      {ledger.schedule.initialized ? (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Approved amount" icon={Wallet} label="Total Project Cost" value={formatCurrency(ledger.summary.totalProjectCost)} />
        <MetricCard detail="Verified payments" icon={CheckCircle2} label="Amount Refunded" tone="green" value={formatCurrency(ledger.summary.amountPaid)} />
        <MetricCard
          detail="Unpaid scheduled amount"
          icon={Clock3}
          label="Remaining Balance"
          tone="sky"
          value={formatCurrency(ledger.summary.outstandingBalance)}
        />
        <MetricCard
          detail={ledger.summary.overdueInstallments ? 'Needs follow-up' : 'Payments are on track'}
          icon={ledger.summary.overdueInstallments ? AlertTriangle : CheckCircle2}
          label="Overdue Count"
          tone={ledger.summary.overdueInstallments ? 'red' : 'green'}
          value={String(ledger.summary.overdueInstallments)}
        />
      </section>
      ) : null}

      {isEditingSchedule ? (
        <RepaymentScheduleBuilder
          ledger={ledger}
          onCancel={() => setIsEditingSchedule(false)}
          onSaved={handleScheduleSaved}
        />
      ) : !ledger.schedule.initialized ? (
        <AdminPanel
          description="Financial details and repayment activity will appear after initialization."
          title="Repayment Schedule Required"
        >
          <div className="px-6 py-12 text-center sm:px-10">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-[#0f53b7]">
              <Clock3 className="size-7" />
            </span>
            <p className="mt-4 font-black text-slate-900">
              {ledger.permissions.canManageSchedule
                ? 'Initialize this project’s repayment ledger'
                : 'Waiting for the SSCP Focal'}
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {ledger.permissions.canManageSchedule
                ? 'Enter the approved funding, release date, amortization start, and repayment term before financial records can be displayed.'
                : 'The funding summary, installment schedule, and payment controls will become available after the SSCP Focal saves the project’s repayment schedule.'}
            </p>
            {ledger.permissions.canManageSchedule ? (
              <button
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#0b3f8b]"
                onClick={() => setIsEditingSchedule(true)}
                type="button"
              >
                <PencilLine className="size-4" /> Initialize ledger
              </button>
            ) : null}
          </div>
        </AdminPanel>
      ) : (
        <AdminPanel
          description={`${ledger.installments.length} installment${ledger.installments.length === 1 ? '' : 's'} from the live ledger`}
          title="Repayment Schedule"
        >
          <DataTable
          columns={columns}
          data={ledger.installments}
          emptyDescription="No repayment schedule is available for this project."
          emptyTitle="No repayment schedule"
          fitColumns
          getRowKey={(item) => String(item.id)}
          groupedHeader={
            <tr className="border-b border-slate-200 text-center text-[11px] font-black uppercase tracking-wide">
              <th className="border-r border-blue-200 bg-blue-50 px-3 py-2.5 text-[#073b82]" colSpan={2}>Repayment Schedule</th>
              <th className="border-r border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900" colSpan={4}>Actual Repayment</th>
              <th className="bg-slate-100 px-3 py-2.5 text-slate-600" colSpan={2}>Review</th>
            </tr>
          }
          initialRowsPerPage={6}
          mobileRender={(item) => {
            const transaction = item.transactions[0]
            return (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{formatMonthYear(item.dueDate)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Due {formatDate(item.dueDate)}</p>
                  </div>
                  <PaymentStatus installment={item} transaction={transaction} />
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Amount</p>
                  <p className="mt-1 text-sm font-black text-slate-800">{formatCurrency(item.amount)}</p>
                </div>
                {transaction ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <p className="text-slate-500">OR <span className="font-bold text-slate-800">{transaction.orNumber}</span></p>
                    <p className="text-slate-500">OR date <span className="font-semibold text-slate-800">{formatDate(transaction.paymentDate)}</span></p>
                    <p className="col-span-2 text-slate-500">Bank <span className="font-semibold text-slate-800">{transaction.bankBranch}</span></p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No payment submitted.</p>
                )}
                <div className="flex justify-end">{actionFor(item)}</div>
              </div>
            )
          }}
          searchPlaceholder="Search month, OR, bank, or status…"
          searchText={(item) => {
            const transaction = item.transactions[0]
            return `${item.period} ${item.dueDate} ${item.status} ${transaction?.orNumber ?? ''} ${transaction?.bankBranch ?? ''} ${transaction?.checkNumber ?? ''} ${transaction?.remarks ?? ''}`
          }}
          variant="clean"
          />
        </AdminPanel>
      )}

      {paymentInstallment ? <LogPaymentModal installment={paymentInstallment} onClose={() => setPaymentInstallment(null)} onSubmitted={handlePaymentSubmitted} projectId={ledger.project.id} /> : null}
      {reviewSelection ? <VerifyPaymentModal canVerify={ledger.permissions.canVerifyPayment} installment={reviewSelection.installment} onClose={() => setReviewSelection(null)} onReviewed={handlePaymentReviewed} projectId={ledger.project.id} transaction={reviewSelection.transaction} /> : null}
    </div>
  )
}
