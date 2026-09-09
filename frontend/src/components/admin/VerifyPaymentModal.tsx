import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  LoaderCircle,
  XCircle,
} from 'lucide-react'

import {
  fetchSetupRepaymentProof,
  repaymentErrorMessage,
  verifySetupRepaymentPayment,
  type PaymentReviewStatus,
  type RepaymentInstallment,
  type RepaymentTransaction,
  type SetupRepaymentLedger,
} from '../../services/repaymentLedgerStore'
import { cn } from '../../utils/cn'
import { ModalShell } from './ModalShell'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value)
}

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-PH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
}

function reviewLabel(status: PaymentReviewStatus): string {
  if (status === 'verified') return 'Verified'
  if (status === 'rejected') return 'Rejected'
  return 'For review'
}

export function VerifyPaymentModal({
  canVerify,
  installment,
  onClose,
  onReviewed,
  projectId,
  transaction,
}: {
  canVerify: boolean
  installment: RepaymentInstallment
  onClose: () => void
  onReviewed: (ledger: SetupRepaymentLedger, decision: 'verified' | 'rejected') => void
  projectId: number
  transaction: RepaymentTransaction
}) {
  const [remarks, setRemarks] = useState(transaction.remarks ?? '')
  const [error, setError] = useState<string | null>(null)
  const [proofError, setProofError] = useState<string | null>(null)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [isProofLoading, setIsProofLoading] = useState(transaction.hasProof)
  const [pendingDecision, setPendingDecision] = useState<'verified' | 'rejected' | null>(null)
  const canDecide = canVerify && transaction.status === 'pending'
  const isPdf = transaction.proofMimeType === 'application/pdf'

  useEffect(() => {
    if (!transaction.hasProof) return

    let active = true
    let objectUrl: string | null = null

    fetchSetupRepaymentProof(projectId, installment.id, transaction.id)
      .then((proof) => {
        if (!active) return
        objectUrl = URL.createObjectURL(proof)
        setProofUrl(objectUrl)
      })
      .catch((proofLoadError) => {
        if (active) setProofError(repaymentErrorMessage(proofLoadError))
      })
      .finally(() => {
        if (active) setIsProofLoading(false)
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [installment.id, projectId, transaction.hasProof, transaction.id])

  async function handleDecision(decision: 'verified' | 'rejected') {
    if (decision === 'rejected' && !remarks.trim()) {
      setError('Add a short reason before rejecting this payment.')
      return
    }

    setError(null)
    setPendingDecision(decision)
    try {
      const ledger = await verifySetupRepaymentPayment(
        projectId,
        installment.id,
        transaction.id,
        { decision, remarks },
      )
      onReviewed(ledger, decision)
    } catch (reviewError) {
      setError(repaymentErrorMessage(reviewError))
      setPendingDecision(null)
    }
  }

  return (
    <ModalShell
      description={`${installment.period} · Due ${formatDate(installment.dueDate)}`}
      footer={canDecide ? (
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            disabled={pendingDecision !== null}
            onClick={() => void handleDecision('rejected')}
            type="button"
          >
            {pendingDecision === 'rejected' ? <LoaderCircle className="size-4 animate-spin" /> : <XCircle className="size-4" />}
            Reject
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            disabled={pendingDecision !== null}
            onClick={() => void handleDecision('verified')}
            type="button"
          >
            {pendingDecision === 'verified' ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Verify payment
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button className="h-10 rounded-xl px-5 text-sm font-bold text-slate-700 hover:bg-slate-100" onClick={onClose} type="button">Close</button>
        </div>
      )}
      onClose={onClose}
      title="Payment Review"
      width="lg"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-black text-slate-900">Official receipt</h3>
            {proofUrl ? (
              <a className="inline-flex items-center gap-1 text-xs font-bold text-[#0f53b7] hover:underline" href={proofUrl} rel="noreferrer" target="_blank">
                Open <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>
          <div className="grid min-h-72 place-items-center overflow-hidden rounded-xl bg-slate-100">
            {isProofLoading ? (
              <LoaderCircle className="size-7 animate-spin text-[#0f53b7]" />
            ) : proofUrl && isPdf ? (
              <iframe className="h-[420px] w-full bg-white" src={proofUrl} title="Official receipt" />
            ) : proofUrl ? (
              <img alt="Official receipt" className="max-h-[520px] w-full object-contain" src={proofUrl} />
            ) : (
              <div className="px-5 text-center text-sm text-slate-500">
                <FileText className="mx-auto mb-2 size-7" />
                {proofError ?? 'No receipt file attached.'}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Amount submitted</p>
              <p className="mt-1 text-2xl font-black text-[#073b82]">{formatCurrency(transaction.amountPaid)}</p>
            </div>
            <span className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-black',
              transaction.status === 'pending' && 'bg-amber-50 text-amber-800',
              transaction.status === 'verified' && 'bg-emerald-50 text-emerald-700',
              transaction.status === 'rejected' && 'bg-rose-50 text-rose-700',
            )}>{reviewLabel(transaction.status)}</span>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div className="col-span-2"><dt className="text-xs text-slate-500">OR number</dt><dd className="mt-0.5 font-bold text-slate-900">{transaction.orNumber}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-slate-500">Bank branch</dt><dd className="mt-0.5 font-semibold text-slate-800">{transaction.bankBranch}</dd></div>
            <div><dt className="text-xs text-slate-500">Check number</dt><dd className="mt-0.5 font-semibold text-slate-800">{transaction.checkNumber}</dd></div>
            <div><dt className="text-xs text-slate-500">Check date</dt><dd className="mt-0.5 font-semibold text-slate-800">{formatDate(transaction.checkDate)}</dd></div>
            <div><dt className="text-xs text-slate-500">Payment date</dt><dd className="mt-0.5 font-semibold text-slate-800">{formatDate(transaction.paymentDate)}</dd></div>
            <div><dt className="text-xs text-slate-500">Submitted by</dt><dd className="mt-0.5 font-semibold text-slate-800">{transaction.recordedBy}</dd></div>
          </dl>

          {canDecide ? (
            <label className="block text-sm font-bold text-slate-800">
              Remarks <span className="font-normal text-slate-400">(required to reject)</span>
              <textarea
                className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-slate-300 p-3 font-normal outline-none placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                maxLength={1000}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Short review note"
                value={remarks}
              />
            </label>
          ) : transaction.remarks ? (
            <div className="border-t border-slate-200 pt-3 text-sm text-slate-600">
              <p className="text-xs font-bold text-slate-500">Review note</p>
              <p className="mt-1">{transaction.remarks}</p>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800" role="alert">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}
            </div>
          ) : null}
        </section>
      </div>
    </ModalShell>
  )
}
