import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  History,
  ImagePlus,
  LoaderCircle,
  Power,
  ShieldAlert,
  Trash2,
  Wrench,
} from 'lucide-react'

import type { EquipmentRecord } from '../../../data/admin'
import {
  equipmentErrorMessage,
  submitEquipmentInspection,
  type InspectionCondition,
} from '../../../services/equipmentStore'
import { cn } from '../../../utils/cn'
import { ModalShell } from '../ModalShell'

interface Props {
  asset: EquipmentRecord
  onClose: () => void
  onSaved: (asset: EquipmentRecord) => void
}

const conditionOptions = [
  { value: 'good' as const, label: 'Good', icon: CheckCircle2, tone: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
  { value: 'fair' as const, label: 'Fair', icon: Wrench, tone: 'border-sky-500 bg-sky-50 text-sky-800' },
  { value: 'poor' as const, label: 'Poor', icon: ShieldAlert, tone: 'border-amber-500 bg-amber-50 text-amber-900' },
  { value: 'non-functional' as const, label: 'Non-functional', icon: Power, tone: 'border-rose-500 bg-rose-50 text-rose-800' },
]

function initialCondition(condition: EquipmentRecord['condition']): InspectionCondition {
  if (condition === 'Fair') return 'fair'
  if (condition === 'Poor') return 'poor'
  if (condition === 'Non-functional') return 'non-functional'
  return 'good'
}

function localDate(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function displayDate(value?: string | null, fallback = 'Not recorded'): string {
  if (!value) return fallback
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMoney(value?: number): string {
  if (value === undefined) return 'Not recorded'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value)
}

function ReportField({ label, children }: { children: ReactNode; label: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <dt className="text-[11px] font-black uppercase tracking-wide text-[#0f53b7]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{children}</dd>
    </div>
  )
}

function SectionTitle({ children, number }: { children: ReactNode; number: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-blue-50 text-[11px] text-[#0f53b7]">{number}</span>
      {children}
    </h3>
  )
}

export function InspectionLogModal({ asset, onClose, onSaved }: Props) {
  const [condition, setCondition] = useState<InspectionCondition>(() => initialCondition(asset.condition))
  const [observations, setObservations] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [inspectionDate, setInspectionDate] = useState(localDate)
  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const observationsRequired = condition === 'poor' || condition === 'non-functional'
  const canSubmit = !isSubmitting && Boolean(asset.qrReference) && Boolean(inspectionDate) && (!observationsRequired || observations.trim().length > 0)
  const selectedCondition = conditionOptions.find((option) => option.value === condition)?.label ?? 'Good'
  const previews = useMemo(() => photos.map((file) => ({ file, url: URL.createObjectURL(file) })), [photos])

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews])

  async function handleSubmit() {
    if (!canSubmit) return
    setError(null)
    setIsSubmitting(true)
    try {
      const updated = await submitEquipmentInspection({ asset, condition, inspectionDate, photos, recommendations, remarks: observations })
      onSaved(updated)
    } catch (submitError) {
      setError(equipmentErrorMessage(submitError))
      setIsSubmitting(false)
    }
  }

  function addPhotos(files: FileList | null) {
    if (!files) return
    const incoming = Array.from(files)
    if (photos.length + incoming.length > 5) {
      setError('You can attach up to five inspection photos.')
      return
    }
    setError(null)
    setPhotos((current) => [...current, ...incoming])
  }

  return (
    <ModalShell
      description={`${asset.program} · ${asset.propertyNumber || asset.id}`}
      footer={
        <div className="flex justify-end gap-2">
          <button className="h-10 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100" disabled={isSubmitting} onClick={onClose} type="button">Cancel</button>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50" disabled={!canSubmit} onClick={() => void handleSubmit()} type="button">
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
            {isSubmitting ? 'Saving…' : 'Save report'}
          </button>
        </div>
      }
      onClose={onClose}
      title="Equipment Inspection Report"
      width="xl"
    >
      <div className="space-y-5">
        <dl className="grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
          <div className="bg-white"><ReportField label="I. Project Title"><span className="block">{asset.projectTitle}</span><span className="mt-0.5 block font-mono text-xs font-normal text-slate-500">{asset.projectId}</span></ReportField></div>
          <div className="bg-white"><ReportField label="II. Project Cooperator"><span className="block">{asset.assignedTo}</span><span className="mt-0.5 block text-xs font-normal text-slate-500">{asset.location}</span></ReportField></div>
          <div className="mt-px bg-white"><ReportField label="III. Date Installed">{displayDate(asset.installationDate)}</ReportField></div>
          <div className="mt-px bg-white"><ReportField label="IV. Date Inspected"><input aria-label="Date inspected" className="h-9 w-full max-w-52 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100" max={localDate()} onChange={(event) => setInspectionDate(event.target.value)} required type="date" value={inspectionDate} /></ReportField></div>
        </dl>

        <section>
          <SectionTitle number="V">List of Equipment Inspected / Installed</SectionTitle>
          <div className="mt-3 hidden overflow-hidden rounded-xl border border-slate-200 lg:block">
            <table className="w-full table-fixed border-collapse text-left text-xs">
              <colgroup><col className="w-[7%]" /><col className="w-[29%]" /><col className="w-[7%]" /><col className="w-[9%]" /><col className="w-[15%]" /><col className="w-[18%]" /><col className="w-[15%]" /></colgroup>
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr>{['Item No.', 'Equipment Name / Description', 'Qty', 'Unit', 'Amount', 'Property Number', 'Remarks'].map((header) => <th className="border-r border-slate-200 px-3 py-2.5 font-black last:border-r-0" key={header}>{header}</th>)}</tr></thead>
              <tbody><tr className="border-t border-slate-200 text-slate-700"><td className="border-r border-slate-200 px-3 py-3">1</td><td className="border-r border-slate-200 px-3 py-3"><span className="block font-bold text-slate-900">{asset.name}</span><span className="mt-0.5 block text-[11px] text-slate-500">{[asset.brand, asset.model, asset.serialNumber ? `SN ${asset.serialNumber}` : null].filter(Boolean).join(' · ')}</span></td><td className="border-r border-slate-200 px-3 py-3">1</td><td className="border-r border-slate-200 px-3 py-3">{asset.unit || 'unit'}</td><td className="border-r border-slate-200 px-3 py-3 font-semibold">{formatMoney(asset.acquisitionCost)}</td><td className="break-words border-r border-slate-200 px-3 py-3 font-mono text-[11px]">{asset.propertyNumber || asset.id}</td><td className="px-3 py-3 font-semibold">{selectedCondition}</td></tr></tbody>
            </table>
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 p-4 lg:hidden">
            <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{asset.name}</p><p className="mt-1 text-xs text-slate-500">SN: {asset.serialNumber || 'Not recorded'}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0f53b7]">{selectedCondition}</span></div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">Quantity</dt><dd className="font-semibold">1 {asset.unit || 'unit'}</dd></div><div><dt className="text-slate-400">Amount</dt><dd className="font-semibold">{formatMoney(asset.acquisitionCost)}</dd></div><div className="col-span-2"><dt className="text-slate-400">Property number</dt><dd className="font-mono font-semibold">{asset.propertyNumber || asset.id}</dd></div></dl>
          </div>

          <fieldset className="mt-4">
            <legend className="text-xs font-bold text-slate-600">Condition observed</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {conditionOptions.map((option) => {
                const Icon = option.icon
                const selected = condition === option.value
                return <button aria-pressed={selected} className={cn('flex h-11 items-center justify-center gap-2 rounded-xl border-2 px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100', selected ? option.tone : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')} key={option.value} onClick={() => setCondition(option.value)} type="button"><Icon className="size-4" />{option.label}</button>
              })}
            </div>
          </fieldset>
        </section>

        <section>
          <SectionTitle number="VI">Observations / Problems Encountered {observationsRequired ? <span className="text-rose-600">*</span> : null}</SectionTitle>
          <textarea aria-label="Observations or problems encountered" className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100" maxLength={3000} onChange={(event) => setObservations(event.target.value)} placeholder="Enter observations or problems found." value={observations} />
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle number="VII">Pictures</SectionTitle>
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#0f53b7] px-3 text-xs font-bold text-[#0f53b7] hover:bg-blue-50"><ImagePlus className="size-4" />Add pictures<input accept="image/jpeg,image/png,image/webp" className="sr-only" multiple onChange={(event) => { addPhotos(event.target.files); event.target.value = '' }} type="file" /></label>
          </div>
          {previews.length ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{previews.map((preview, index) => <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100" key={`${preview.file.name}-${index}`}><img alt={`Inspection upload ${index + 1}`} className="size-full object-cover" src={preview.url} /><button aria-label={`Remove ${preview.file.name}`} className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-white/95 text-rose-600 shadow-sm hover:bg-rose-50" onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button"><Trash2 className="size-4" /></button></div>)}</div> : <p className="mt-2 text-xs text-slate-400">No pictures added.</p>}
        </section>

        <section>
          <SectionTitle number="VIII">Recommendations</SectionTitle>
          <textarea aria-label="Recommendations" className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100" maxLength={3000} onChange={(event) => setRecommendations(event.target.value)} placeholder="Enter recommended action, if any." value={recommendations} />
        </section>

        <details className="group rounded-xl border border-slate-200 bg-slate-50/60">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-bold text-slate-600"><History className="size-4 text-[#0f53b7]" />Previous inspections <span className="rounded-full bg-white px-2 py-0.5 text-[10px] ring-1 ring-slate-200">{asset.inspectionHistory?.length ?? 0}</span><ChevronDown className="ml-auto size-4 transition group-open:rotate-180" /></summary>
          <div className="border-t border-slate-200 p-4">
            {asset.inspectionHistory?.length ? <div className="space-y-3">{asset.inspectionHistory.map((entry) => <article className="rounded-xl bg-white p-3 ring-1 ring-slate-200" key={entry.id}><p className="text-xs font-black text-slate-800">{displayDate(entry.inspectedAt)} · {entry.condition}</p><p className="mt-0.5 text-[11px] text-slate-500">{entry.inspector}</p>{entry.observations ? <p className="mt-2 text-xs leading-5 text-slate-700">{entry.observations}</p> : null}{entry.recommendations ? <p className="mt-1 text-xs leading-5 text-slate-500">Recommendation: {entry.recommendations}</p> : null}{entry.photos.length ? <div className="mt-2 flex flex-wrap gap-2">{entry.photos.map((photo, index) => <a href={photo} key={photo} rel="noreferrer" target="_blank"><img alt={`Inspection ${entry.id} photo ${index + 1}`} className="size-14 rounded-lg border border-slate-200 object-cover" src={photo} /></a>)}</div> : null}</article>)}</div> : <p className="text-center text-xs text-slate-500">No previous inspections.</p>}
          </div>
        </details>

        {!asset.qrReference ? <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" />This asset needs an active QR code before an inspection can be saved.</div> : null}
        {error ? <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800" role="alert"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div> : null}
      </div>
    </ModalShell>
  )
}
