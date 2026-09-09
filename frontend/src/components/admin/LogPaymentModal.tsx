import { useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, LoaderCircle, Send, Upload } from 'lucide-react'

import {
  repaymentErrorMessage,
  submitSetupRepaymentPayment,
  type RepaymentInstallment,
  type SetupRepaymentLedger,
} from '../../services/repaymentLedgerStore'
import { ModalShell } from './ModalShell'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value)
}

function formatDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-PH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
}

function localDate(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

const inputClassName =
  'mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100'

export function LogPaymentModal({
  installment,
  onClose,
  onSubmitted,
  projectId,
}: {
  installment: RepaymentInstallment
  onClose: () => void
  onSubmitted: (ledger: SetupRepaymentLedger) => void
  projectId: number
}) {
  const [amountPaid, setAmountPaid] = useState(
    installment.remainingAmount.toFixed(2),
  )
  const [orNumber, setOrNumber] = useState('')
  const [bankBranch, setBankBranch] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [checkDate, setCheckDate] = useState(localDate)
  const [paymentDate, setPaymentDate] = useState(localDate)
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!paymentProof) {
      setError('Attach a photo or PDF of the official receipt.')
      return
    }

    if (paymentProof.size > 5 * 1024 * 1024) {
      setError('The OR file must be 5 MB or smaller.')
      return
    }

    setIsSubmitting(true)

    try {
      const ledger = await submitSetupRepaymentPayment(
        projectId,
        installment.id,
        {
          amountPaid: Number(amountPaid),
          bankBranch: bankBranch.trim(),
          checkDate,
          checkNumber: checkNumber.trim(),
          orNumber: orNumber.trim(),
          paymentDate,
          paymentProof,
        },
      )
      onSubmitted(ledger)
    } catch (submitError) {
      setError(repaymentErrorMessage(submitError))
      setIsSubmitting(false)
    }
  }

  return (
    <ModalShell
      description={`${installment.period} · Due ${formatDate(installment.dueDate)}`}
      footer={
        <div className="flex justify-end gap-2">
          <button
            className="h-10 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white hover:bg-[#0b3f8b] disabled:opacity-50"
            disabled={isSubmitting}
            form="setup-payment-form"
            type="submit"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {isSubmitting ? 'Submitting…' : 'Submit payment'}
          </button>
        </div>
      }
      onClose={onClose}
      title="Log Payment"
      width="md"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
          <span className="text-sm font-semibold text-blue-700">Balance due</span>
          <span className="font-black text-[#073b82]">
            {formatCurrency(installment.remainingAmount)}
          </span>
        </div>

        <form
          className="grid gap-4 sm:grid-cols-2"
          id="setup-payment-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <label className="text-sm font-bold text-slate-800">
            Amount paid <span className="text-rose-600">*</span>
            <input
              className={inputClassName}
              inputMode="decimal"
              max={installment.remainingAmount}
              min="0.01"
              onChange={(event) => setAmountPaid(event.target.value)}
              required
              step="0.01"
              type="number"
              value={amountPaid}
            />
          </label>

          <label className="text-sm font-bold text-slate-800">
            Payment date <span className="text-rose-600">*</span>
            <input
              className={inputClassName}
              max={localDate()}
              onChange={(event) => setPaymentDate(event.target.value)}
              required
              type="date"
              value={paymentDate}
            />
          </label>

          <label className="text-sm font-bold text-slate-800">
            OR number <span className="text-rose-600">*</span>
            <input
              className={inputClassName}
              inputMode="numeric"
              maxLength={100}
              onChange={(event) =>
                setOrNumber(event.target.value.replace(/\D/g, ''))
              }
              pattern="[0-9]*"
              placeholder="Enter OR number"
              required
              value={orNumber}
            />
          </label>

          <label className="text-sm font-bold text-slate-800">
            Bank branch <span className="text-rose-600">*</span>
            <input
              className={inputClassName}
              maxLength={150}
              onChange={(event) => setBankBranch(event.target.value)}
              placeholder="Bank and branch"
              required
              value={bankBranch}
            />
          </label>

          <label className="text-sm font-bold text-slate-800">
            Check number <span className="text-rose-600">*</span>
            <input
              className={inputClassName}
              maxLength={100}
              onChange={(event) => setCheckNumber(event.target.value)}
              placeholder="Check number"
              required
              value={checkNumber}
            />
          </label>

          <label className="text-sm font-bold text-slate-800">
            Check date <span className="text-rose-600">*</span>
            <input
              className={inputClassName}
              onChange={(event) => setCheckDate(event.target.value)}
              required
              type="date"
              value={checkDate}
            />
          </label>

          <label className="text-sm font-bold text-slate-800 sm:col-span-2">
            Official receipt <span className="text-rose-600">*</span>
            <span className="mt-1.5 flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 transition hover:border-[#0f53b7] hover:bg-blue-50/50">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0f53b7]">
                {paymentProof ? <CheckCircle2 className="size-5" /> : <Upload className="size-5" />}
              </span>
              <span className="min-w-0 font-normal">
                <span className="block truncate font-bold text-slate-800">
                  {paymentProof?.name ?? 'Upload OR photo or PDF'}
                </span>
                <span className="block text-xs text-slate-500">JPG, PNG, or PDF · up to 5 MB</span>
              </span>
              <input
                accept="image/jpeg,image/png,application/pdf"
                className="sr-only"
                onChange={(event) => {
                  setPaymentProof(event.target.files?.[0] ?? null)
                  setError(null)
                }}
                required
                type="file"
              />
            </span>
          </label>
        </form>

        {error ? (
          <div
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : null}
      </div>
    </ModalShell>
  )
}
