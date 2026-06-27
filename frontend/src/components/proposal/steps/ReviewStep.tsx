import { MailCheck, ShieldCheck } from 'lucide-react'

import { getDocumentRequirements } from '../../../data/proposal'
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-between gap-1 border-b border-slate-200 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="break-words text-sm font-bold text-slate-900 sm:text-right">
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
  const requirements = getDocumentRequirements(data.proposalType).filter(
    (requirement) => requirement.required,
  )
  const uploadedCount = requirements.filter(
    (requirement) => data.documents[requirement.key],
  ).length

  return (
    <div className="space-y-6">
      <ProposalSectionHeading
        description="Double-check your entries. Once submitted, your application enters the DOST review queue."
        divided={false}
        title="Review and submit"
      />

      <dl className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-1">
        <SummaryRow label="Enterprise" value={data.organizationName} />
        <SummaryRow label="Program" value={data.proposalType} />
        <SummaryRow label="Project Title" value={data.projectTitle} />
        <SummaryRow label="Notification Email" value={data.emailAddress} />
        <SummaryRow
          label="Required Documents Uploaded"
          value={`${uploadedCount} of ${requirements.length}`}
        />
      </dl>

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
            I certify that all information provided is true and correct. I understand that
            false statements may result in disqualification.
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

      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-[#0f53b7]" />
        <p>
          Submission confirmation and proposal status updates will be sent to your registered
          email address.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-slate-700">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
        <p>Your submission is protected and routed directly to authorized DOST evaluators.</p>
      </div>
    </div>
  )
}
