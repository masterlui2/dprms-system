import { useMemo, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Wallet,
} from 'lucide-react'

import {
  repaymentErrorMessage,
  saveSetupRepaymentSchedule,
  type SetupRepaymentLedger,
} from '../../services/repaymentLedgerStore'
import { cn } from '../../utils/cn'
import { AdminPanel } from './AdminPanel'

interface DraftInstallment {
  amount: string
  dueDate: string
  key: string
  periodLabel: string
}

interface Props {
  ledger: SetupRepaymentLedger
  onCancel: () => void
  onSaved: (ledger: SetupRepaymentLedger) => void
}

function amountToCents(value: string): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0
}

function formatCurrencyFromCents(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value / 100)
}

function addMonthsToIsoDate(value: string, offset: number): string {
  const [year, month, day] = value.split('-').map(Number)
  const monthIndex = month - 1 + offset
  const targetYear = year + Math.floor(monthIndex / 12)
  const targetMonthIndex = ((monthIndex % 12) + 12) % 12
  const targetDay = Math.min(day, new Date(targetYear, targetMonthIndex + 1, 0).getDate())

  return `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
}

function periodLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? 'New installment'
    : date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
}

function nextRowKey(): string {
  return `schedule-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function RepaymentScheduleBuilder({ ledger, onCancel, onSaved }: Props) {
  const initialTerm = ledger.schedule.repaymentTermMonths
    ?? (ledger.installments.length || 12)
  const [fundingAmount, setFundingAmount] = useState(
    ledger.summary.totalProjectCost > 0
      ? ledger.summary.totalProjectCost.toFixed(2)
      : '',
  )
  const [fullReleaseDate, setFullReleaseDate] = useState(
    ledger.schedule.fullReleaseDate ?? '',
  )
  const [amortizationStartDate, setAmortizationStartDate] = useState(
    ledger.schedule.amortizationStartDate ?? '',
  )
  const [repaymentTerm, setRepaymentTerm] = useState(String(initialTerm))
  const [rows, setRows] = useState<DraftInstallment[]>(
    ledger.installments.map((installment) => ({
      amount: installment.amount.toFixed(2),
      dueDate: installment.dueDate,
      key: `ledger-${installment.id}`,
      periodLabel: installment.period,
    })),
  )
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fundingCents = amountToCents(fundingAmount)
  const scheduledCents = useMemo(
    () => rows.reduce((total, row) => total + amountToCents(row.amount), 0),
    [rows],
  )
  const varianceCents = fundingCents - scheduledCents

  function generateSchedule() {
    setError(null)
    const term = Number(repaymentTerm)

    if (fundingCents <= 0 || !fullReleaseDate) {
      setError('Enter the funding amount and full release date before generating the schedule.')
      return
    }
    if (!amortizationStartDate) {
      setError('Select the amortization start date.')
      return
    }
    if (!Number.isInteger(term) || term < 1 || term > 120) {
      setError('Repayment term must be between 1 and 120 months.')
      return
    }
    if (amortizationStartDate < fullReleaseDate) {
      setError('Amortization cannot start before the full release date.')
      return
    }
    if (fundingCents < term) {
      setError('Funding must allow at least ₱0.01 for every installment.')
      return
    }

    const baseCents = Math.floor(fundingCents / term)
    const remainderCents = fundingCents - baseCents * term
    setRows(Array.from({ length: term }, (_, index) => {
      const dueDate = addMonthsToIsoDate(amortizationStartDate, index)
      const amountCents = baseCents + (index < remainderCents ? 1 : 0)
      return {
        amount: (amountCents / 100).toFixed(2),
        dueDate,
        key: nextRowKey(),
        periodLabel: periodLabel(dueDate),
      }
    }))
  }

  function distributeEvenly() {
    if (fundingCents <= 0 || rows.length === 0 || fundingCents < rows.length) {
      setError('Enter a valid funding amount before distributing installments.')
      return
    }

    const baseCents = Math.floor(fundingCents / rows.length)
    const remainderCents = fundingCents - baseCents * rows.length
    setRows((current) => current.map((row, index) => ({
      ...row,
      amount: ((baseCents + (index < remainderCents ? 1 : 0)) / 100).toFixed(2),
    })))
    setError(null)
  }

  function addInstallment() {
    if (rows.length >= 120) return
    const previousDueDate = rows.at(-1)?.dueDate
    const dueDate = previousDueDate
      ? addMonthsToIsoDate(previousDueDate, 1)
      : amortizationStartDate
    const nextRows = [...rows, {
      amount: '0.00',
      dueDate,
      key: nextRowKey(),
      periodLabel: dueDate ? periodLabel(dueDate) : `Installment ${rows.length + 1}`,
    }]
    setRows(nextRows)
    setRepaymentTerm(String(nextRows.length))
    setError(null)
  }

  function removeInstallment(key: string) {
    const nextRows = rows.filter((row) => row.key !== key)
    setRows(nextRows)
    setRepaymentTerm(String(nextRows.length))
    setError(null)
  }

  function updateInstallment(key: string, changes: Partial<DraftInstallment>) {
    setRows((current) => current.map((row) => (
      row.key === key ? { ...row, ...changes } : row
    )))
    setError(null)
  }

  function validateSchedule(): string | null {
    const term = Number(repaymentTerm)
    if (fundingCents <= 0 || !fullReleaseDate || !amortizationStartDate) {
      return 'Complete all funding terms before saving.'
    }
    if (!Number.isInteger(term) || term !== rows.length || rows.length === 0) {
      return 'The installment count must match the repayment term.'
    }
    if (scheduledCents !== fundingCents) {
      return 'Installment amounts must exactly match the total project cost.'
    }
    if (rows.some((row) => !row.periodLabel.trim() || !row.dueDate || amountToCents(row.amount) <= 0)) {
      return 'Every installment needs a period label, due date, and positive amount.'
    }
    const labels = rows.map((row) => row.periodLabel.trim().toLowerCase())
    const dates = rows.map((row) => row.dueDate)
    if (new Set(labels).size !== labels.length || new Set(dates).size !== dates.length) {
      return 'Period labels and due dates must be unique.'
    }
    if (dates.some((date) => date < amortizationStartDate)) {
      return 'Installment dates cannot be earlier than the amortization start date.'
    }
    if (dates.some((date, index) => index > 0 && date < dates[index - 1])) {
      return 'Installment dates must be in chronological order.'
    }
    return null
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateSchedule()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const updated = await saveSetupRepaymentSchedule(ledger.project.id, {
        amortizationStartDate,
        fullReleaseDate,
        installments: rows.map((row) => ({
          amount: amountToCents(row.amount) / 100,
          dueDate: row.dueDate,
          periodLabel: row.periodLabel,
        })),
        repaymentTermMonths: Number(repaymentTerm),
        totalProjectCost: fundingCents / 100,
      })
      onSaved(updated)
    } catch (saveError) {
      setError(repaymentErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminPanel
      description="Set the funding terms, generate the monthly schedule, then adjust individual rows before saving."
      title={ledger.schedule.initialized ? 'Customize Repayment Schedule' : 'Initialize Repayment Ledger'}
    >
      <form className="space-y-6 p-5 sm:p-6" onSubmit={handleSave}>
        <section className="rounded-2xl border border-blue-100 bg-[#f7fbff] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#0f53b7]">Selected active SETUP project</p>
          <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div><dt className="text-xs font-bold text-slate-400">Project title</dt><dd className="mt-1 font-black text-slate-900">{ledger.project.title}</dd></div>
            <div><dt className="text-xs font-bold text-slate-400">Reference number</dt><dd className="mt-1 font-black text-[#073b82]">{ledger.project.referenceNumber}</dd></div>
            <div><dt className="text-xs font-bold text-slate-400">Cooperator</dt><dd className="mt-1 font-semibold text-slate-800">{ledger.project.cooperator}</dd></div>
            <div><dt className="text-xs font-bold text-slate-400">Location</dt><dd className="mt-1 font-semibold text-slate-800">{ledger.project.location}</dd></div>
          </dl>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Wallet className="size-4 text-[#0f53b7]" />
            <h3 className="font-black text-slate-900">Funding and repayment terms</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-bold text-slate-600">
              Total Approved Funding Amount <span className="text-rose-600">*</span>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">₱</span>
                <input className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-sm font-bold text-slate-900 outline-none focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100" min="0.01" onChange={(event) => { setFundingAmount(event.target.value); setError(null) }} placeholder="0.00" required step="0.01" type="number" value={fundingAmount} />
              </div>
            </label>
            <label className="text-xs font-bold text-slate-600">
              Full Release Date <span className="text-rose-600">*</span>
              <input className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100" onChange={(event) => { setFullReleaseDate(event.target.value); setError(null) }} required type="date" value={fullReleaseDate} />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Amortization Start Date <span className="text-rose-600">*</span>
              <input className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100" min={fullReleaseDate || undefined} onChange={(event) => { setAmortizationStartDate(event.target.value); setError(null) }} required type="date" value={amortizationStartDate} />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Repayment Term (months) <span className="text-rose-600">*</span>
              <input className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-[#0f53b7] focus:ring-3 focus:ring-blue-100" max="120" min="1" onChange={(event) => { setRepaymentTerm(event.target.value); setError(null) }} required type="number" value={repaymentTerm} />
            </label>
          </div>
          <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0f53b7] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50" disabled={isSaving} onClick={generateSchedule} type="button">
            <CalendarDays className="size-4" /> Generate monthly schedule
          </button>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-slate-900">Installment schedule</h3>
              <p className="mt-0.5 text-xs text-slate-500">Amounts, labels, and dates remain editable until payment activity begins.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-blue-50" onClick={distributeEvenly} type="button"><RefreshCw className="size-3.5" /> Distribute equally</button>
              <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-[#0f53b7] hover:bg-blue-100" onClick={addInstallment} type="button"><Plus className="size-3.5" /> Add installment</button>
            </div>
          </div>

          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-white text-[11px] font-black uppercase tracking-wide text-slate-500">
                  <tr><th className="w-16 px-4 py-3 text-center">No.</th><th className="px-3 py-3">Period label</th><th className="w-52 px-3 py-3">Due date</th><th className="w-56 px-3 py-3 text-right">Amount</th><th className="w-16 px-4 py-3" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, index) => (
                    <tr className="hover:bg-blue-50/30" key={row.key}>
                      <td className="px-4 py-3 text-center text-xs font-black text-slate-400">{index + 1}</td>
                      <td className="px-3 py-2"><input aria-label={`Installment ${index + 1} period label`} className="h-10 w-full rounded-lg border border-slate-300 px-3 font-semibold text-slate-800 outline-none focus:border-[#0f53b7]" maxLength={100} onChange={(event) => updateInstallment(row.key, { periodLabel: event.target.value })} required type="text" value={row.periodLabel} /></td>
                      <td className="px-3 py-2"><input aria-label={`Installment ${index + 1} due date`} className="h-10 w-full rounded-lg border border-slate-300 px-3 font-semibold text-slate-800 outline-none focus:border-[#0f53b7]" min={amortizationStartDate || undefined} onChange={(event) => updateInstallment(row.key, { dueDate: event.target.value })} required type="date" value={row.dueDate} /></td>
                      <td className="px-3 py-2"><input aria-label={`Installment ${index + 1} amount`} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-right font-black text-slate-900 outline-none focus:border-[#0f53b7]" min="0.01" onChange={(event) => updateInstallment(row.key, { amount: event.target.value })} required step="0.01" type="number" value={row.amount} /></td>
                      <td className="px-4 py-2 text-right"><button aria-label={`Remove installment ${index + 1}`} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30" disabled={rows.length <= 1} onClick={() => removeInstallment(row.key)} type="button"><Trash2 className="size-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center"><CalendarDays className="mx-auto size-7 text-slate-300" /><p className="mt-3 font-bold text-slate-700">No installments generated</p><p className="mt-1 text-sm text-slate-500">Complete the funding terms, then generate the schedule.</p></div>
          )}

          <div className="grid gap-3 border-t border-slate-200 bg-[#f8fbff] px-4 py-4 text-sm sm:grid-cols-3">
            <div><p className="text-xs font-bold text-slate-400">Project cost</p><p className="mt-1 font-black text-[#073b82]">{formatCurrencyFromCents(fundingCents)}</p></div>
            <div><p className="text-xs font-bold text-slate-400">Scheduled total</p><p className="mt-1 font-black text-slate-900">{formatCurrencyFromCents(scheduledCents)}</p></div>
            <div><p className="text-xs font-bold text-slate-400">Variance</p><p className={cn('mt-1 font-black', varianceCents === 0 ? 'text-emerald-700' : 'text-rose-700')}>{formatCurrencyFromCents(Math.abs(varianceCents))}{varianceCents === 0 ? ' · Balanced' : varianceCents > 0 ? ' under' : ' over'}</p></div>
          </div>
        </section>

        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800" role="alert">{error}</div> : null}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50" disabled={isSaving} onClick={onCancel} type="button">Cancel</button>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-black text-white shadow-sm hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50" disabled={isSaving || rows.length === 0 || varianceCents !== 0} type="submit">{isSaving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}{isSaving ? 'Saving schedule…' : 'Save repayment schedule'}</button>
        </div>
      </form>
    </AdminPanel>
  )
}
