import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react'
import {
  Building2,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { emptySetupProposal, setupIndustryCategories } from '../../data/setupProposal'
import { getMockUser } from '../../lib/mockAuth'
import { getSetupDraft, saveSetupDraft } from '../../services/setupProposalStore'
import type {
  SetupProposalData,
  SetupProposalErrors,
  SetupProposalField,
} from '../../types/setupProposal'
import { cn } from '../../utils/cn'

const sectionClass = 'scroll-mt-32 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm'
const inputClass = 'min-h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100'

const requiredFields: Array<keyof SetupProposalData> = [
  'projectTitle', 'generalObjective', 'specificObjectives', 'projectBackground',
  'businessName', 'businessAddress', 'contactPerson', 'contactNumber', 'emailAddress',
  'yearEstablished', 'organizationType', 'businessSize', 'numberOfEmployees',
  'businessIndustry', 'productsServices', 'enterpriseBackground',
]

const fieldLabels: Partial<Record<keyof SetupProposalData, string>> = {
  projectTitle: 'Project title', generalObjective: 'General objective',
  specificObjectives: 'Specific objectives', projectBackground: 'Project background',
  businessName: 'Business name', businessAddress: 'Business address',
  contactPerson: 'Contact person', contactNumber: 'Contact number', emailAddress: 'Email address',
  yearEstablished: 'Year established', organizationType: 'Organization type',
  businessSize: 'Business size', numberOfEmployees: 'Number of employees',
  businessIndustry: 'Business industry',
  productsServices: 'Products / services', enterpriseBackground: 'Enterprise background',
}

function validate(data: SetupProposalData) {
  const errors: SetupProposalErrors = {}
  for (const field of requiredFields) {
    const value = data[field]
    if (Array.isArray(value) ? value.length === 0 : !String(value).trim()) {
      errors[field] = `${fieldLabels[field] ?? 'This field'} is required.`
    }
  }
  if (data.emailAddress && !/^\S+@\S+\.\S+$/.test(data.emailAddress)) {
    errors.emailAddress = 'Enter a valid email address.'
  }
  if (data.contactNumber && !/^[+0-9][0-9\s()-]{7,18}$/.test(data.contactNumber)) {
    errors.contactNumber = 'Enter a valid contact number.'
  }
  const year = Number(data.yearEstablished)
  if (data.yearEstablished && (year < 1800 || year > new Date().getFullYear())) {
    errors.yearEstablished = 'Enter a valid year.'
  }
  if (data.numberOfEmployees && Number(data.numberOfEmployees) < 1) {
    errors.numberOfEmployees = 'Enter at least 1 employee.'
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
  description: string
  icon: LucideIcon
  id: string
  title: string
}) {
  return (
    <div className={sectionClass} id={id}>
      <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0f53b7]">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-black text-[#073b82] sm:text-lg">{title}</span>
        </span>
      </div>
      <div className="border-t border-slate-100 px-5 py-6 sm:px-6">{children}</div>
    </div>
  )
}

function OfficialRow({
  children,
  error,
  help,
  id,
  label,
}: {
  children: React.ReactNode
  error?: string
  help?: string
  id: string
  label: string
  required?: boolean
}) {
  return (
    <div className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[190px_minmax(0,1fr)]">
      <label
        className="bg-slate-50 px-3 py-3 text-sm font-bold leading-5 text-slate-800 sm:border-r sm:border-slate-200"
        htmlFor={id}
      >
        {label}
        {error ? <span className="ml-1 text-red-600 font-bold">*</span> : null}
        {help ? <span className="mt-1 block text-xs font-medium leading-4 text-slate-500">{help}</span> : null}
      </label>
      <div className="px-3 py-3">
        {children}
        {error ? <p className="mt-1.5 text-xs font-semibold text-red-600" id={`${id}-error`} role="alert">{error}</p> : null}
      </div>
    </div>
  )
}

interface SetupProposalFormProps {
  onDraftChange?: (draft: SetupProposalData) => void
}

/**
 * Imperative handle exposed to the parent page. The parent drives the
 * actual submit-to-backend flow (proposal creation + document uploads, in
 * that order) — this component's job is only to own its own field state
 * and validation. `validate()` runs the same checks the form used to run
 * on its own onSubmit, surfaces errors/scrolls exactly as before, and
 * returns the current data if valid or `null` if not (caller should stop).
 */
export interface SetupProposalFormHandle {
  validate: () => SetupProposalData | null
}

export const SetupProposalForm = forwardRef<SetupProposalFormHandle, SetupProposalFormProps>(
  function SetupProposalForm({ onDraftChange }, ref) {
  const user = getMockUser()
  const [data, setData] = useState<SetupProposalData>(() => {
    const draft = getSetupDraft()
    return draft ?? { ...emptySetupProposal, emailAddress: user?.email ?? '', contactPerson: user?.name ?? '' }
  })
  const [errors, setErrors] = useState<SetupProposalErrors>({})
  const submitted = useRef(false)
  // Always holds the latest keystroke, even between debounce ticks — used
  // so an unmount mid-typing doesn't lose anything, without forcing a save
  // on every single keystroke the way the old cleanup did.
  const latestData = useRef(data)
  latestData.current = data

  // Push the draft up to the parent (and persist it) only after typing
  // pauses, instead of on every keystroke. Doing this on every keystroke
  // was forcing the whole parent page (including the full documents list)
  // to re-render per character typed, which is what was making the form
  // feel like it hangs.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onDraftChange?.(data)
      saveSetupDraft(data)
    }, 400)
    return () => {
      window.clearTimeout(timer)
    }
  }, [data, onDraftChange])

  // Save whatever the user last typed if they navigate away before the
  // debounce above has a chance to fire. Runs once, only on unmount.
  useEffect(() => {
    return () => {
      if (!submitted.current) saveSetupDraft(latestData.current)
    }
  }, [])

  function update<K extends SetupProposalField>(field: K, value: SetupProposalData[K]) {
    setData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function input(field: SetupProposalField, options?: { type?: string; placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }) {
    const value = data[field] as string
    return (
      <input
        aria-describedby={errors[field] ? `${field}-error` : undefined}
        aria-invalid={Boolean(errors[field])}
        className={cn(inputClass, errors[field] && 'border-red-500 focus:border-red-600 focus:ring-red-100')}
        id={field}
        inputMode={options?.inputMode}
        onChange={(event) => update(field, event.target.value as SetupProposalData[typeof field])}
        placeholder={options?.placeholder}
        type={options?.type ?? 'text'}
        value={value}
      />
    )
  }

  function textarea(field: SetupProposalField, placeholder: string) {
    return (
      <textarea
        aria-describedby={errors[field] ? `${field}-error` : undefined}
        aria-invalid={Boolean(errors[field])}
        className={cn(inputClass, 'min-h-28 resize-y', errors[field] && 'border-red-500 focus:border-red-600 focus:ring-red-100')}
        id={field}
        onChange={(event) => update(field, event.target.value as SetupProposalData[typeof field])}
        placeholder={placeholder}
        value={data[field] as string}
      />
    )
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      const nextErrors = validate(data)
      setErrors(nextErrors)
      const firstError = requiredFields.find((field) => nextErrors[field])
      if (firstError) {
        window.setTimeout(() => document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
        return null
      }
      // Marks the draft as "handed off" so the unmount-save effect below
      // doesn't overwrite what the parent is about to submit with a stale
      // localStorage draft on the reload that follows a successful submit.
      submitted.current = true
      return data
    },
  }), [data])

  const radioGroup = (field: 'organizationType' | 'businessSize', values: string[]) => (
    <div className="grid gap-2 sm:grid-cols-2" id={field}>
      {values.map((value) => (
        <label className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5 text-sm font-semibold transition', data[field] === value ? 'border-[#0f53b7] bg-blue-50 text-[#073b82] ring-1 ring-[#0f53b7]' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300')} key={value}>
          <input checked={data[field] === value} className="size-4 accent-[#0f53b7]" name={field} onChange={() => update(field, value as never)} type="radio" />
          {value}
        </label>
      ))}
    </div>
  )

  return (
    <div className="space-y-5">

      {Object.keys(errors).length > 0 ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">Please complete the highlighted fields before submitting.</div> : null}

      <Section description="Define the goal and background of the proposed assistance." icon={Target} id="project-information" title="1. Project Information">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <OfficialRow error={errors.projectTitle} help="Must reflect the goal of the project." id="projectTitle" label="Project Title">
            {input('projectTitle', { placeholder: 'e.g., Modernization of Cacao Processing Operations' })}
          </OfficialRow>
          <OfficialRow error={errors.generalObjective} id="generalObjective" label="General Objective">
            {textarea('generalObjective', 'State the overall goal of the project.')}
          </OfficialRow>
          <OfficialRow error={errors.specificObjectives} id="specificObjectives" label="Specific Objectives">
            {textarea('specificObjectives', 'List measurable objectives, one per line.')}
          </OfficialRow>
          <OfficialRow error={errors.projectBackground} id="projectBackground" label="Project Background">
            {textarea('projectBackground', 'Briefly explain the need for the project and its context.')}
          </OfficialRow>
        </div>
      </Section>

      <Section description="Basic enterprise and contact details." icon={Building2} id="company-profile" title="2. Company Profile">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <OfficialRow error={errors.businessName} id="businessName" label="Name of Firm">
            {input('businessName', { placeholder: 'Registered business name' })}
          </OfficialRow>
          <OfficialRow error={errors.businessAddress} id="businessAddress" label="Address">
            {textarea('businessAddress', 'Complete operating address')}
          </OfficialRow>
          <OfficialRow error={errors.contactPerson} id="contactPerson" label="Contact Person">
            {input('contactPerson', { placeholder: 'Full name' })}
          </OfficialRow>
          <OfficialRow error={errors.contactNumber} id="contactNumber" label="Contact No.">
            {input('contactNumber', { placeholder: '+63 9XX XXX XXXX', inputMode: 'tel' })}
          </OfficialRow>
          <OfficialRow error={errors.emailAddress} id="emailAddress" label="E-mail Address">
            {input('emailAddress', { type: 'email', placeholder: 'name@company.com' })}
          </OfficialRow>
          <OfficialRow error={errors.yearEstablished} id="yearEstablished" label="Year Established">
            {input('yearEstablished', { type: 'number', placeholder: 'YYYY' })}
          </OfficialRow>
          <OfficialRow error={errors.organizationType} help="Select one." id="organizationType" label="Type of Organization">
            {radioGroup('organizationType', ['Sole Proprietorship', 'Partnership', 'Cooperative', 'Corporation'])}
          </OfficialRow>
          <OfficialRow error={errors.businessSize} help="Select MSME classification." id="businessSize" label="Business Size">
            <div className="grid gap-2 sm:grid-cols-3" id="businessSize">
              {[
                { label: 'Micro', note: 'P3M total asset value or less' },
                { label: 'Small', note: 'P3,000,001 to P15M total asset value' },
                { label: 'Medium', note: 'P15,000,001 to P100M total asset value' },
              ].map((item) => (
                <label className={cn('flex min-h-20 cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 text-sm font-semibold transition', data.businessSize === item.label ? 'border-[#0f53b7] bg-blue-50 text-[#073b82] ring-1 ring-[#0f53b7]' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300')} key={item.label}>
                  <input checked={data.businessSize === item.label} className="mt-0.5 size-4 accent-[#0f53b7]" name="businessSize" onChange={() => update('businessSize', item.label as SetupProposalData['businessSize'])} type="radio" />
                  <span><span className="block">{item.label}</span><span className="mt-1 block text-xs font-medium leading-4 text-slate-500">{item.note}</span></span>
                </label>
              ))}
            </div>
          </OfficialRow>
          <OfficialRow error={errors.numberOfEmployees} id="numberOfEmployees" label="Number of Employees">
            {input('numberOfEmployees', { type: 'number', placeholder: 'Total employees' })}
          </OfficialRow>
          <OfficialRow error={errors.businessIndustry} help="Search or choose the closest SETUP category." id="businessIndustry" label="Business Activities">
            <input className={cn(inputClass, errors.businessIndustry && 'border-red-500')} list="setup-industries" id="businessIndustry" onChange={(event) => update('businessIndustry', event.target.value)} placeholder="Search or select an industry" value={data.businessIndustry} />
            <datalist id="setup-industries">{setupIndustryCategories.map((category) => <option key={category} value={category} />)}</datalist>
          </OfficialRow>
          <OfficialRow error={errors.productsServices} id="productsServices" label="Products / Services">
            {textarea('productsServices', 'Main products or services offered')}
          </OfficialRow>
          <OfficialRow error={errors.enterpriseBackground} id="enterpriseBackground" label="Brief Enterprise Background">
            {textarea('enterpriseBackground', 'Brief history, milestones, and present operations')}
          </OfficialRow>
        </div>
      </Section>

    </div>
  )
})