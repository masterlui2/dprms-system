import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  MapPin,
  Power,
  ShieldCheck,
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

const conditionOptions: Array<{
  description: string
  icon: typeof CheckCircle2
  label: string
  tone: string
  value: InspectionCondition
}> = [
  {
    value: 'good',
    label: 'Good',
    description: 'Fully operational with no visible issues.',
    icon: CheckCircle2,
    tone: 'border-emerald-500 bg-emerald-50 text-emerald-800',
  },
  {
    value: 'fair',
    label: 'Fair',
    description: 'Operational but showing wear or minor concerns.',
    icon: ShieldCheck,
    tone: 'border-sky-500 bg-sky-50 text-sky-800',
  },
  {
    value: 'poor',
    label: 'Poor',
    description: 'Operational issues require repair or intervention.',
    icon: Wrench,
    tone: 'border-amber-500 bg-amber-50 text-amber-900',
  },
  {
    value: 'non-functional',
    label: 'Non-functional',
    description: 'Unable to operate during the inspection.',
    icon: Power,
    tone: 'border-rose-500 bg-rose-50 text-rose-800',
  },
]

function initialCondition(condition: EquipmentRecord['condition']): InspectionCondition {
  if (condition === 'Fair') return 'fair'
  if (condition === 'Poor') return 'poor'
  if (condition === 'Non-functional') return 'non-functional'
  return 'good'
}

export function InspectionLogModal({ asset, onClose, onSaved }: Props) {
  const [condition, setCondition] = useState<InspectionCondition>(() => initialCondition(asset.condition))
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const remarksRequired = condition === 'poor' || condition === 'non-functional'
  const canSubmit = !isSubmitting && (!remarksRequired || remarks.trim().length > 0)

  const selectedLabel = useMemo(
    () => conditionOptions.find((option) => option.value === condition)?.label ?? 'Good',
    [condition],
  )

  async function handleSubmit() {
    if (!canSubmit) return
    setError(null)
    setIsSubmitting(true)

    try {
      const updated = await submitEquipmentInspection({ asset, condition, remarks })
      onSaved(updated)
    } catch (submitError) {
      setError(equipmentErrorMessage(submitError))
      setIsSubmitting(false)
    }
  }

  return (
    <ModalShell
      description="Confirm the physical condition observed during this on-site inspection."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Saving will update the asset condition and last inspection time.
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="h-10 rounded-xl px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSubmit}
              onClick={() => void handleSubmit()}
              type="button"
            >
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
              {isSubmitting ? 'Saving…' : 'Save inspection'}
            </button>
          </div>
        </div>
      }
      onClose={onClose}
      title="Record On-Site Inspection"
      width="lg"
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-[#f4f8ff] to-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#0f53b7] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                  {asset.program}
                </span>
                <span className="font-mono text-xs font-bold text-[#0f53b7]">{asset.id}</span>
              </div>
              <h3 className="mt-2 text-xl font-black text-slate-900">{asset.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Serial: {asset.serialNumber || 'Not recorded'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current condition</p>
              <p className="mt-1 text-sm font-black text-slate-800">{asset.condition}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Last: {asset.lastScanned}</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 border-t border-blue-100 pt-4 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Project</dt>
              <dd className="mt-1 text-sm font-bold text-slate-800">{asset.projectTitle}</dd>
              <dd className="font-mono text-xs text-slate-500">{asset.projectId}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Organization & location</dt>
              <dd className="mt-1 text-sm font-bold text-slate-800">{asset.assignedTo}</dd>
              <dd className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="size-3.5 shrink-0" /> {asset.location}
              </dd>
            </div>
          </dl>
        </section>

        <fieldset>
          <legend className="text-sm font-black text-slate-900">Observed condition</legend>
          <p className="mt-1 text-xs text-slate-500">Choose the condition verified during this visit.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {conditionOptions.map((option) => {
              const Icon = option.icon
              const selected = condition === option.value
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
                    selected ? option.tone : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                  )}
                  key={option.value}
                  onClick={() => setCondition(option.value)}
                  type="button"
                >
                  <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', selected ? 'bg-white/80' : 'bg-slate-100')}>
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-black">{option.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 opacity-75">{option.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <label className="block">
          <span className="flex items-center justify-between gap-3 text-sm font-black text-slate-900">
            <span>Inspection remarks {remarksRequired ? <span className="text-rose-600">*</span> : <span className="font-medium text-slate-400">(optional)</span>}</span>
            <span className="text-xs font-medium text-slate-400">{remarks.length}/2000</span>
          </span>
          <textarea
            className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
            maxLength={2000}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder={`Describe observations supporting the “${selectedLabel}” condition, actions taken, or recommended follow-up.`}
            value={remarks}
          />
          {remarksRequired && !remarks.trim() ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="size-3.5" /> Remarks are required for poor or non-functional equipment.
            </p>
          ) : null}
        </label>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800" role="alert">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        ) : null}
      </div>
    </ModalShell>
  )
}
