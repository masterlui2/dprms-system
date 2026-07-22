import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  LoaderCircle,
  Save,
  Send,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  emptyGiaProposal,
  giaProjectCategories,
  giaProjectTypes,
  giaProponentCategories,
} from '../../data/giaProposal'
import { getMockUser } from '../../lib/mockAuth'
import {
  getGiaDraft,
  saveGiaDraft,
  submitGiaProposal,
} from '../../services/giaProposalStore'
import type {
  GiaProposalData,
  GiaProposalErrors,
  GiaProposalField,
  GiaProponentCategory,
} from '../../types/giaProposal'
import { cn } from '../../utils/cn'
import { Button } from '../ui/button'

const inputClass = 'mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100'

const requiredFields: GiaProposalField[] = [
  'proponentCategory',
  'organizationName',
  'officeAddress',
  'projectLeader',
  'position',
  'contactNumber',
  'emailAddress',
  'projectTitle',
  'projectCategory',
  'projectType',
  'projectSummary',
  'projectRationale',
  'generalObjective',
  'specificObjectives',
  'siteOfImplementation',
  'targetBeneficiaries',
  'methodology',
  'expectedOutputs',
  'sustainabilityPlan',
]

const fieldLabels: Record<GiaProposalField, string> = {
  proponentCategory: 'Proponent category',
  organizationName: 'Organization name',
  officeAddress: 'Office address',
  projectLeader: 'Project leader',
  position: 'Position',
  contactNumber: 'Contact number',
  emailAddress: 'Email address',
  projectTitle: 'Project title',
  projectCategory: 'Project category',
  projectType: 'Project type',
  projectSummary: 'Project summary',
  projectRationale: 'Project rationale',
  generalObjective: 'General objective',
  specificObjectives: 'Specific objectives',
  siteOfImplementation: 'Site of implementation',
  targetBeneficiaries: 'Target beneficiaries',
  methodology: 'Implementation approach',
  expectedOutputs: 'Expected outputs',
  sustainabilityPlan: 'Sustainability plan',
}

function validate(data: GiaProposalData) {
  const errors: GiaProposalErrors = {}
  for (const field of requiredFields) {
    if (!String(data[field]).trim()) errors[field] = `${fieldLabels[field]} is required.`
  }
  if (data.emailAddress && !/^\S+@\S+\.\S+$/.test(data.emailAddress)) {
    errors.emailAddress = 'Enter a valid email address.'
  }
  if (data.contactNumber && !/^[+0-9][0-9\s()-]{7,18}$/.test(data.contactNumber)) {
    errors.contactNumber = 'Enter a valid contact number.'
  }
  return errors
}

function Section({
  children,
  icon: Icon,
  id,
  title,
}: {
  children: React.ReactNode
  icon: LucideIcon
  id: string
  title: string
}) {
  return (
    <details className="group scroll-mt-32 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" id={id} open>
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700"><Icon className="size-5" /></span>
        <span className="min-w-0 flex-1 text-base font-black text-[#073b82] sm:text-lg">{title}</span>
        <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-100 p-5 sm:p-6">{children}</div>
    </details>
  )
}

function Field({
  children,
  error,
  label,
  required = true,
}: {
  children: React.ReactNode
  error?: string
  label: string
  required?: boolean
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}{required ? <span className="ml-1 text-red-600">*</span> : null}
      {children}
      {error ? <span className="mt-1.5 block text-xs font-semibold text-red-600" role="alert">{error}</span> : null}
    </label>
  )
}

export function GiaProposalForm() {
  const navigate = useNavigate()
  const user = getMockUser()
  const [data, setData] = useState<GiaProposalData>(() => getGiaDraft() ?? {
    ...emptyGiaProposal,
    emailAddress: user?.email ?? '',
    projectLeader: user?.name ?? '',
  })
  const [errors, setErrors] = useState<GiaProposalErrors>({})
  const [saveState, setSaveState] = useState<'saving' | 'saved'>('saved')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const firstRender = useRef(true)
  const submitted = useRef(false)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    setSaveState('saving')
    const timer = window.setTimeout(() => {
      saveGiaDraft(data)
      setLastSaved(new Date())
      setSaveState('saved')
    }, 650)
    return () => {
      window.clearTimeout(timer)
      if (!submitted.current) saveGiaDraft(data)
    }
  }, [data])

  const completedRequired = useMemo(() => requiredFields.filter((field) => String(data[field]).trim()).length, [data])
  const completion = Math.round((completedRequired / requiredFields.length) * 100)

  function update<K extends GiaProposalField>(field: K, value: GiaProposalData[K]) {
    setData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function input(field: GiaProposalField, options?: { type?: string; placeholder?: string }) {
    return (
      <input
        aria-invalid={Boolean(errors[field])}
        className={cn(inputClass, errors[field] && 'border-red-500 focus:border-red-600 focus:ring-red-100')}
        name={field}
        onChange={(event) => update(field, event.target.value as GiaProposalData[typeof field])}
        placeholder={options?.placeholder}
        type={options?.type ?? 'text'}
        value={data[field]}
      />
    )
  }

  function textarea(field: GiaProposalField, placeholder: string) {
    return (
      <textarea
        aria-invalid={Boolean(errors[field])}
        className={cn(inputClass, 'min-h-28 resize-y', errors[field] && 'border-red-500 focus:border-red-600 focus:ring-red-100')}
        name={field}
        onChange={(event) => update(field, event.target.value as GiaProposalData[typeof field])}
        placeholder={placeholder}
        value={data[field]}
      />
    )
  }

  function select(field: 'projectCategory' | 'projectType', options: string[]) {
    return (
      <select
        className={cn(inputClass, errors[field] && 'border-red-500')}
        name={field}
        onChange={(event) => update(field, event.target.value)}
        value={data[field]}
      >
        <option value="">Select an option</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    )
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors = validate(data)
    setErrors(nextErrors)
    const firstError = requiredFields.find((field) => nextErrors[field])
    if (firstError) {
      window.setTimeout(() => document.querySelector(`[name="${firstError}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
      return
    }

    setIsSubmitting(true)
    submitted.current = true
    const application = submitGiaProposal(data)
    navigate('/dashboard', { replace: true, state: { submittedReference: application.referenceNo } })
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">GIA Online Proposal Registration</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#073b82] sm:text-3xl">Register GIA Proposal</h1>
          </div>
          <div className="shrink-0 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 sm:w-44">
            <div className="flex items-center justify-between text-xs font-bold"><span className="text-slate-500">Form progress</span><span className="text-amber-700">{completion}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${completion}%` }} /></div>
          </div>
        </div>
      </div>

      {Object.keys(errors).length ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">Please complete the highlighted fields.</div> : null}

      <Section icon={Building2} id="gia-proponent" title="1. Proponent Information">
        <div className="space-y-5">
          <fieldset>
            <legend className="text-sm font-bold text-slate-700">Proponent Category <span className="text-red-600">*</span></legend>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              {giaProponentCategories.map((category) => (
                <label className={cn('flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition', data.proponentCategory === category ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500' : 'border-slate-200 text-slate-700 hover:border-amber-300')} key={category}>
                  <input checked={data.proponentCategory === category} className="size-4 accent-amber-600" name="proponentCategory" onChange={() => update('proponentCategory', category as GiaProponentCategory)} type="radio" />
                  {category}
                </label>
              ))}
            </div>
            {errors.proponentCategory ? <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.proponentCategory}</p> : null}
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field error={errors.organizationName} label="Organization Name"><span>{input('organizationName', { placeholder: 'Implementing organization' })}</span></Field>
            <Field error={errors.projectLeader} label="Project Leader"><span>{input('projectLeader', { placeholder: 'Full name' })}</span></Field>
            <Field error={errors.position} label="Position / Designation"><span>{input('position', { placeholder: 'Official designation' })}</span></Field>
            <Field error={errors.contactNumber} label="Contact Number"><span>{input('contactNumber', { placeholder: '09XX XXX XXXX', type: 'tel' })}</span></Field>
            <Field error={errors.emailAddress} label="Email Address"><span>{input('emailAddress', { placeholder: 'name@example.com', type: 'email' })}</span></Field>
            <Field error={errors.officeAddress} label="Office Address"><span>{input('officeAddress', { placeholder: 'Complete office address' })}</span></Field>
          </div>
        </div>
      </Section>

      <Section icon={Target} id="gia-project" title="2. Project Information">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field error={errors.projectTitle} label="Project Title"><span>{input('projectTitle', { placeholder: 'Clear and concise project title' })}</span></Field></div>
          <Field error={errors.projectCategory} label="Project Category"><span>{select('projectCategory', giaProjectCategories)}</span></Field>
          <Field error={errors.projectType} label="Project Type"><span>{select('projectType', giaProjectTypes)}</span></Field>
          <div className="sm:col-span-2"><Field error={errors.projectSummary} label="Project Summary"><span>{textarea('projectSummary', 'Briefly describe the proposed project.')}</span></Field></div>
          <div className="sm:col-span-2"><Field error={errors.projectRationale} label="Project Rationale"><span>{textarea('projectRationale', 'Explain the problem or need the project will address.')}</span></Field></div>
          <Field error={errors.generalObjective} label="General Objective"><span>{textarea('generalObjective', 'State the overall objective.')}</span></Field>
          <Field error={errors.specificObjectives} label="Specific Objectives"><span>{textarea('specificObjectives', 'List the specific objectives.')}</span></Field>
        </div>
      </Section>

      <Section icon={ClipboardList} id="gia-implementation" title="3. Implementation and Results">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field error={errors.siteOfImplementation} label="Site of Implementation"><span>{input('siteOfImplementation', { placeholder: 'Municipality, barangay, or facility' })}</span></Field>
          <Field error={errors.targetBeneficiaries} label="Target Beneficiaries"><span>{input('targetBeneficiaries', { placeholder: 'Primary beneficiaries' })}</span></Field>
          <Field error={errors.methodology} label="Implementation Approach"><span>{textarea('methodology', 'Summarize the major activities and approach.')}</span></Field>
          <Field error={errors.expectedOutputs} label="Expected Outputs"><span>{textarea('expectedOutputs', 'List the expected results or deliverables.')}</span></Field>
          <div className="sm:col-span-2"><Field error={errors.sustainabilityPlan} label="Sustainability Plan"><span>{textarea('sustainabilityPlan', 'Explain how project benefits will continue after implementation.')}</span></Field></div>
        </div>
      </Section>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
          {saveState === 'saving' ? <LoaderCircle className="size-4 animate-spin text-amber-600" /> : lastSaved ? <Check className="size-4 text-emerald-600" /> : <Save className="size-4 text-slate-400" />}
          <span>{saveState === 'saving' ? 'Saving draft...' : lastSaved ? `Draft saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Draft auto-save is on'}</span>
        </div>
        <Button className="h-12 shrink-0 rounded-lg bg-amber-500 px-6 text-slate-950 hover:bg-amber-400" disabled={isSubmitting} type="submit"><Send className="size-4" />{isSubmitting ? 'Submitting...' : 'Submit Proposal'}</Button>
      </div>
    </form>
  )
}
