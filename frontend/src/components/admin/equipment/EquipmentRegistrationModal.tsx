import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, LoaderCircle, PackagePlus, Plus } from 'lucide-react'

import type { EquipmentRecord, Program } from '../../../data/admin'
import {
  equipmentErrorMessage,
  registerEquipment,
  type EquipmentRegistrationOptions,
  type EquipmentRegistrationPayload,
} from '../../../services/equipmentStore'
import { ModalShell } from '../ModalShell'

interface Props {
  onClose: () => void
  onSaved: (equipment: EquipmentRecord, keepOpen?: boolean) => void
  options: EquipmentRegistrationOptions
  program: Program
}

type FormState = {
  acquisitionCost: string
  brand: string
  condition: EquipmentRegistrationPayload['current_condition']
  equipmentName: string
  location: string
  model: string
  projectId: string
  serialNumber: string
  specifications: string
  supplierName: string
}

const fieldClass = 'mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100'
const textareaClass = 'mt-1.5 min-h-24 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100'

function Field({ children, label, required = false }: { children: ReactNode; label: string; required?: boolean }) {
  return (
    <label className="block text-sm font-bold text-slate-800">
      {label} {required ? <span className="text-rose-600">*</span> : null}
      {children}
    </label>
  )
}

function localDate(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function EquipmentRegistrationModal({ onClose, onSaved, options, program }: Props) {
  const projects = useMemo(() => options.projects.filter((project) => project.program_type === program), [options.projects, program])
  const defaultCategoryId = useMemo(() => options.categories.find((category) => category.category_code.toUpperCase() === 'OTHER')?.id, [options.categories])
  const [form, setForm] = useState<FormState>({
    acquisitionCost: '',
    brand: '',
    condition: 'GOOD',
    equipmentName: '',
    location: '',
    model: '',
    projectId: '',
    serialNumber: '',
    specifications: '',
    supplierName: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const equipmentNameRef = useRef<HTMLInputElement>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function selectProject(value: string) {
    const project = projects.find((item) => String(item.id) === value)
    setForm((current) => ({
      ...current,
      projectId: value,
      location: project?.location || '',
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const keepOpen = submitter?.value === 'add-another'
    setError(null)
    setIsSubmitting(true)

    try {
      const saved = await registerEquipment({
        acquisition_cost: Number(form.acquisitionCost),
        acquisition_date: localDate(),
        brand: form.brand.trim(),
        category_id: Number(defaultCategoryId),
        current_condition: form.condition,
        equipment_name: form.equipmentName.trim(),
        location: form.location.trim(),
        model: form.model.trim(),
        program_type: program,
        project_id: Number(form.projectId),
        serial_number: form.serialNumber.trim(),
        specifications: form.specifications.trim() || undefined,
        supplier_name: form.supplierName.trim(),
        unit: 'unit',
      })
      onSaved(saved, keepOpen)

      if (keepOpen) {
        setSavedCount((count) => count + 1)
        setForm((current) => ({
          ...current,
          acquisitionCost: '',
          brand: '',
          equipmentName: '',
          model: '',
          serialNumber: '',
          specifications: '',
        }))
        setIsSubmitting(false)
        window.requestAnimationFrame(() => equipmentNameRef.current?.focus())
      }
    } catch (submitError) {
      setError(equipmentErrorMessage(submitError))
      setIsSubmitting(false)
    }
  }

  const unavailable = projects.length === 0 || !defaultCategoryId

  return (
    <ModalShell
      description={`Add equipment to the ${program} inventory and generate its QR code.`}
      footer={
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500">Registration date and asset number are generated automatically.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <button className="h-10 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100" disabled={isSubmitting} onClick={onClose} type="button">
              Cancel
            </button>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#0f53b7] bg-white px-4 text-sm font-bold text-[#0f53b7] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting || unavailable} form="equipment-registration-form" name="registration-action" type="submit" value="add-another">
              <Plus className="size-4" />
              Save &amp; add another
            </button>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting || unavailable} form="equipment-registration-form" name="registration-action" type="submit" value="finish">
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <PackagePlus className="size-4" />}
              {isSubmitting ? 'Registering…' : 'Register & finish'}
            </button>
          </div>
        </div>
      }
      onClose={onClose}
      title="Register Equipment"
      width="lg"
    >
      <form className="space-y-6" id="equipment-registration-form" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <span className="rounded-lg bg-[#0f53b7] px-2.5 py-1 text-xs font-black tracking-wide text-white">{program}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800">Registering under the {program} inventory</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">Choose the project once, then use “Save &amp; add another” to register its equipment one after another.</p>
          </div>
          {savedCount > 0 ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700"><CheckCircle2 className="size-3.5" />{savedCount} saved</span> : null}
        </div>

        <section>
          <h3 className="text-sm font-black text-slate-900">Project</h3>
          <div className="mt-3">
            <Field label="Active project" required>
              <select className={fieldClass} onChange={(event) => selectProject(event.target.value)} required value={form.projectId}>
                <option value="">Select a {program} project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.reference_number} — {project.title}</option>)}
              </select>
            </Field>
          </div>
          {unavailable ? (
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              <AlertTriangle className="size-4 shrink-0" />
              {projects.length === 0 ? `No active ${program} projects are available for registration.` : 'Equipment registration is not configured yet.'}
            </p>
          ) : null}
        </section>

        <section className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-black text-slate-900">Equipment identity</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Equipment name" required><input className={fieldClass} onChange={(event) => update('equipmentName', event.target.value)} placeholder="e.g. Vacuum Packaging Machine" ref={equipmentNameRef} required value={form.equipmentName} /></Field>
            <Field label="Serial number" required><input className={fieldClass} onChange={(event) => update('serialNumber', event.target.value)} placeholder="Manufacturer serial number" required value={form.serialNumber} /></Field>
            <Field label="Brand" required><input className={fieldClass} onChange={(event) => update('brand', event.target.value)} placeholder="Manufacturer or brand" required value={form.brand} /></Field>
            <Field label="Model" required><input className={fieldClass} onChange={(event) => update('model', event.target.value)} placeholder="Model name or number" required value={form.model} /></Field>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-black text-slate-900">Cost and assignment</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Procurement cost" required><input className={fieldClass} min="0" onChange={(event) => update('acquisitionCost', event.target.value)} placeholder="0.00" required step="0.01" type="number" value={form.acquisitionCost} /></Field>
            <Field label="Supplier" required><input className={fieldClass} onChange={(event) => update('supplierName', event.target.value)} placeholder="Supplier or vendor" required value={form.supplierName} /></Field>
            <Field label="Current location" required><input className={fieldClass} onChange={(event) => update('location', event.target.value)} placeholder="Installation or site address" required value={form.location} /></Field>
            <Field label="Initial condition" required>
              <select className={fieldClass} onChange={(event) => update('condition', event.target.value as FormState['condition'])} value={form.condition}>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="NON_FUNCTIONAL">Non-functional</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="border-t border-slate-200 pt-5">
          <Field label="Technical specifications (optional)"><textarea className={textareaClass} maxLength={3000} onChange={(event) => update('specifications', event.target.value)} placeholder="Capacity, dimensions, power requirements, or other useful specifications" value={form.specifications} /></Field>
        </section>

        {error ? <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800" role="alert"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div> : null}
      </form>
    </ModalShell>
  )
}
