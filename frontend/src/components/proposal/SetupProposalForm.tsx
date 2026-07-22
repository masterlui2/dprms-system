import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Building2,
  Check,
  ChevronDown,
  LoaderCircle,
  Save,
  Send,
  Target,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { emptySetupProposal, setupIndustryCategories } from '../../data/setupProposal'
import { getMockUser } from '../../lib/mockAuth'
import { getSetupDraft, saveSetupDraft, submitSetupProposal } from '../../services/setupProposalStore'
import type {
  BusinessRegistrationOffice,
  SetupProposalData,
  SetupProposalErrors,
  SetupProposalField,
} from '../../types/setupProposal'
import { cn } from '../../utils/cn'
import { Button } from '../ui/button'

const sectionClass = 'scroll-mt-32 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm'
const inputClass = 'min-h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100'

const requiredFields: Array<keyof SetupProposalData> = [
  'projectTitle', 'generalObjective', 'specificObjectives', 'projectBackground',
  'businessName', 'businessAddress', 'contactPerson', 'contactNumber', 'emailAddress',
  'yearEstablished', 'organizationType', 'businessSize', 'numberOfEmployees',
  'businessRegistrations', 'businessIndustry', 'productsServices', 'enterpriseBackground',
]

const fieldLabels: Partial<Record<keyof SetupProposalData, string>> = {
  projectTitle: 'Project title', generalObjective: 'General objective',
  specificObjectives: 'Specific objectives', projectBackground: 'Project background',
  businessName: 'Business name', businessAddress: 'Business address',
  contactPerson: 'Contact person', contactNumber: 'Contact number', emailAddress: 'Email address',
  yearEstablished: 'Year established', organizationType: 'Organization type',
  businessSize: 'Business size', numberOfEmployees: 'Number of employees',
  businessRegistrations: 'Business registration', businessIndustry: 'Business industry',
  productsServices: 'Products / services', enterpriseBackground: 'Enterprise background',
}

function validate(data: SetupProposalData) {
  const errors: SetupProposalErrors = {}
  for (const field of requiredFields) {
    if (field === 'businessRegistrations') continue

    const value = data[field]
    if (Array.isArray(value) ? value.length === 0 : !String(value).trim()) {
      errors[field] = `${fieldLabels[field] ?? 'This field'} is required.`
    }
  }
  const selectedRegistrations = data.businessRegistrations.filter((registration) => registration.selected)
  const incompleteRegistration = selectedRegistrations.some((registration) =>
    !registration.registrationNumber.trim()
    || !registration.dateOfRegistration
    || (registration.office === 'Others' && !registration.otherOfficeName.trim()),
  )
  if (!selectedRegistrations.length) {
    errors.businessRegistrations = 'Select at least one registration office.'
  } else if (incompleteRegistration) {
    errors.businessRegistrations = 'Complete the registration number and date for every selected office.'
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
  description,
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
    <details className={cn(sectionClass, 'group')} id={id} open>
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0f53b7]"><Icon className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-black text-[#073b82] sm:text-lg">{title}</span>
          <span className="mt-0.5 block text-xs font-medium text-slate-500 sm:text-sm">{description}</span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-100 px-5 py-6 sm:px-6">{children}</div>
    </details>
  )
}

function OfficialRow({
  children,
  error,
  help,
  id,
  label,
  required = true,
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
        {required ? <span className="ml-1 text-red-600">*</span> : null}
        {help ? <span className="mt-1 block text-xs font-medium leading-4 text-slate-500">{help}</span> : null}
      </label>
      <div className="px-3 py-3">
        {children}
        {error ? <p className="mt-1.5 text-xs font-semibold text-red-600" id={`${id}-error`} role="alert">{error}</p> : null}
      </div>
    </div>
  )
}

export function SetupProposalForm() {
  const navigate = useNavigate()
  const user = getMockUser()
  const [data, setData] = useState<SetupProposalData>(() => {
    const draft = getSetupDraft()
    return draft ?? { ...emptySetupProposal, emailAddress: user?.email ?? '', contactPerson: user?.name ?? '' }
  })
  const [errors, setErrors] = useState<SetupProposalErrors>({})
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
      saveSetupDraft(data)
      setLastSaved(new Date())
      setSaveState('saved')
    }, 650)
    return () => {
      window.clearTimeout(timer)
      if (!submitted.current) saveSetupDraft(data)
    }
  }, [data])

  const completedRequired = useMemo(
    () => requiredFields.filter((field) => {
      if (field === 'businessRegistrations') {
        const selected = data.businessRegistrations.filter((registration) => registration.selected)
        return selected.length > 0 && selected.every((registration) =>
          registration.registrationNumber.trim()
          && registration.dateOfRegistration
          && (registration.office !== 'Others' || registration.otherOfficeName.trim()),
        )
      }

      const value = data[field]
      return Array.isArray(value) ? value.length > 0 : Boolean(String(value).trim())
    }).length,
    [data],
  )
  const completion = Math.round((completedRequired / requiredFields.length) * 100)

  function update<K extends SetupProposalField>(field: K, value: SetupProposalData[K]) {
    setData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function input(field: Exclude<SetupProposalField, 'businessRegistrations'>, options?: { type?: string; placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }) {
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

  function textarea(field: Exclude<SetupProposalField, 'businessRegistrations'>, placeholder: string) {
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

  function updateRegistration(
    office: BusinessRegistrationOffice,
    patch: Partial<SetupProposalData['businessRegistrations'][number]>,
  ) {
    update('businessRegistrations', data.businessRegistrations.map((registration) =>
      registration.office === office ? { ...registration, ...patch } : registration,
    ))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors = validate(data)
    setErrors(nextErrors)
    const firstError = requiredFields.find((field) => nextErrors[field])
    if (firstError) {
      window.setTimeout(() => document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
      return
    }
    setIsSubmitting(true)
    submitted.current = true
    const application = submitSetupProposal(data)
    navigate('/dashboard', { replace: true, state: { submittedReference: application.referenceNo } })
  }

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
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0f53b7]">SETUP Form 001 - Online Proposal Registration</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#073b82] sm:text-3xl">Register SETUP Proposal</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Complete the simplified online form based on the official SETUP proposal format. Supporting documents will be uploaded separately after submission.</p>
          </div>
          <div className="shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 sm:w-44">
            <div className="flex items-center justify-between text-xs font-bold"><span className="text-slate-500">Form progress</span><span className="text-[#0f53b7]">{completion}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0f53b7] transition-all" style={{ width: `${completion}%` }} /></div>
          </div>
        </div>
      </div>

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
          <OfficialRow error={errors.businessRegistrations} help="Select the office, then enter the registration number and date." id="businessRegistrations" label="Registration">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-[32%] border-b border-r border-slate-200 px-3 py-2 text-left font-black">Office</th>
                    <th className="w-[34%] border-b border-r border-slate-200 px-3 py-2 text-left font-black">Registration Number</th>
                    <th className="w-[34%] border-b border-slate-200 px-3 py-2 text-left font-black">Date of Registration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.businessRegistrations.map((registration) => (
                    <tr className={cn('border-b border-slate-200 last:border-b-0', registration.selected && 'bg-blue-50/40')} key={registration.office}>
                      <td className="border-r border-slate-200 px-3 py-2 align-top">
                        <label className="flex min-h-10 cursor-pointer items-center gap-3 font-semibold text-slate-800">
                          <input
                            checked={registration.selected}
                            className="size-4 accent-[#0f53b7]"
                            onChange={(event) => updateRegistration(registration.office, { selected: event.target.checked })}
                            type="checkbox"
                          />
                          <span>{registration.office === 'Others' ? 'Others, please specify' : registration.office}</span>
                        </label>
                        {registration.office === 'Others' ? (
                          <input
                            aria-label="Other registration office"
                            className={cn(inputClass, 'mt-2 min-h-10 disabled:bg-slate-100')}
                            disabled={!registration.selected}
                            onChange={(event) => updateRegistration('Others', { otherOfficeName: event.target.value })}
                            placeholder="Specify office"
                            value={registration.otherOfficeName}
                          />
                        ) : null}
                      </td>
                      <td className="border-r border-slate-200 px-3 py-2 align-top">
                        <input
                          aria-label={`${registration.office} registration number`}
                          className={cn(inputClass, 'min-h-10 disabled:bg-slate-100')}
                          disabled={!registration.selected}
                          onChange={(event) => updateRegistration(registration.office, { registrationNumber: event.target.value })}
                          placeholder={registration.selected ? 'Enter number' : 'Select office first'}
                          value={registration.registrationNumber}
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          aria-label={`${registration.office} date of registration`}
                          className={cn(inputClass, 'min-h-10 disabled:bg-slate-100')}
                          disabled={!registration.selected}
                          onChange={(event) => updateRegistration(registration.office, { dateOfRegistration: event.target.value })}
                          type="date"
                          value={registration.dateOfRegistration}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5">
        
          <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
            {saveState === 'saving' ? <LoaderCircle className="size-4 animate-spin text-[#0f53b7]" /> : lastSaved ? <Check className="size-4 text-emerald-600" /> : <Save className="size-4 text-slate-400" />}
            <span className="truncate">{saveState === 'saving' ? 'Saving draft…' : lastSaved ? `Draft saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Draft auto-save is on'}</span>
          </div>
          <Button className="h-12 shrink-0 rounded-lg px-5 sm:px-7" disabled={isSubmitting} type="submit"><Send className="size-4" /><span>{isSubmitting ? 'Submitting…' : 'Submit Proposal'}</span></Button>
      </div>
    </form>
  )
}
