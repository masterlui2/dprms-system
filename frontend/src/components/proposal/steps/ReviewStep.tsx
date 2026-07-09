import { CheckCircle2, FileCheck2, MailCheck } from 'lucide-react'

import { getVisibleDocumentRequirements } from '../../../data/proposal'
import type {
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
} from '../../../types/proposal'
import { ProposalSectionHeading } from '../ProposalSectionHeading'

interface ReviewStepProps {
  data: ProposalFormData
  errors: ProposalFormErrors
  onFieldChange: <K extends ProposalFieldName>(
    field: K,
    value: ProposalFormData[K],
  ) => void
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <dt className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-bold text-slate-900">
        {value || 'Not provided'}
      </dd>
    </div>
  )
}

export function ReviewStep({
  data,
  errors,
  onFieldChange,
}: ReviewStepProps) {
  const requirements = getVisibleDocumentRequirements(data)
  const uploadedCount = requirements.filter(
    (requirement) => data.documents[requirement.key],
  ).length
  const isGia = data.proposalType === 'GIA'

  return (
    <div className="space-y-6">
      <ProposalSectionHeading
        description="Confirm the key details below before submitting."
        divided={false}
        title="Final Review"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryItem label="Program" value={data.proposalType} />
        <SummaryItem
          label={isGia ? 'Project Leader' : 'Owner / Representative'}
          value={data.applicantFullName}
        />
        <SummaryItem
          label={isGia ? 'Implementing Agency' : 'Business Name'}
          value={data.organizationName}
        />
        <SummaryItem
          label={isGia ? 'Project Title' : 'Proposed Project Title'}
          value={data.projectTitle}
        />
        <SummaryItem
          label={isGia ? 'Project Type' : 'TNA Status'}
          value={isGia ? data.projectType : data.tnaStatus}
        />
        <SummaryItem
          label={isGia ? 'Budget Requested' : 'Quotation Amount'}
          value={
            isGia
              ? data.requestedAmount
                ? `PHP ${data.requestedAmount}`
                : ''
              : data.equipmentQuotationAmount
                ? `PHP ${data.equipmentQuotationAmount}`
                : ''
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-[#0f53b7]" />
          <div>
            <p className="text-xs font-black uppercase text-[#073b82]">
              Notification Email
            </p>
            <p className="mt-1 break-words text-sm font-bold text-slate-800">
              {data.emailAddress}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <FileCheck2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />
          <div>
            <p className="text-xs font-black uppercase text-emerald-800">
              Documents
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {uploadedCount} of {requirements.length} uploaded
            </p>
          </div>
        </div>
      </div>

      <div>
        <label
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-[#0f53b7]"
          htmlFor="certified"
        >
          <input
            checked={data.certified}
            className="mt-1 size-4 shrink-0 accent-[#0f53b7]"
            id="certified"
            onChange={(event) => onFieldChange('certified', event.target.checked)}
            type="checkbox"
          />
          <span className="text-sm leading-6 text-slate-600">
            I reviewed this submission and certify that the information and
            uploaded documents are true and complete.
            <span aria-hidden="true" className="ml-1 font-bold text-red-600">
              *
            </span>
          </span>
        </label>
        {errors.certified ? (
          <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
            {errors.certified}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        <CheckCircle2 className="size-5 text-[#0f53b7]" />
        Submitting will create a reference number and route the request for DOST validation.
      </div>
    </div>
  )
}
