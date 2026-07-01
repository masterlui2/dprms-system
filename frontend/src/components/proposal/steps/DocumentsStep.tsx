import { CheckCircle2, Circle, FileCheck2 } from 'lucide-react'

import { getDocumentRequirements } from '../../../data/proposal'
import type {
  ProposalDocumentKey,
  ProposalFormData,
  ProposalFormErrors,
} from '../../../types/proposal'
import { ProposalSectionHeading } from '../ProposalSectionHeading'
import { UploadCard } from '../UploadCard'

interface DocumentsStepProps {
  data: ProposalFormData
  errors: ProposalFormErrors
  onDocumentChange: (documentKey: ProposalDocumentKey, file: File | null) => void
}

export function DocumentsStep({
  data,
  errors,
  onDocumentChange,
}: DocumentsStepProps) {
  const requirements = getDocumentRequirements(data.proposalType).filter(
    (requirement) => requirement.required,
  )
  const uploadedCount = requirements.filter(
    (requirement) => data.documents[requirement.key],
  ).length
  const remainingCount = requirements.length - uploadedCount
  const progress = requirements.length
    ? Math.round((uploadedCount / requirements.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      <ProposalSectionHeading
        description="Upload clear and complete copies of each required document."
        divided={false}
        title="Upload Supporting Documents"
      />

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:flex-row sm:gap-8">
        <p>
          <span className="font-bold text-slate-800">Accepted Formats:</span>{' '}
          PDF, DOCX, XLSX, JPG, PNG
        </p>
        <p>
          <span className="font-bold text-slate-800">Maximum Size:</span> 10 MB
          per file
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <FileCheck2 className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <p>
          The required documents below are based on the selected DOST program.
          Please upload all required files before submitting your proposal.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-black text-[#073b82]">
              Required Documents
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {data.proposalType
                ? `${requirements.length} documents required for ${data.proposalType}`
                : 'Select a program in Step 2 to view its requirements.'}
            </p>
          </div>

          <div className="flex items-center gap-5 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="size-4" />
              {uploadedCount} Uploaded
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <Circle className="size-4" />
              {remainingCount} Remaining
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div
            aria-label={`${progress}% of required documents uploaded`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs font-black text-slate-700">
            {progress}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {requirements.map((requirement) => (
          <UploadCard
            error={errors[`documents.${requirement.key}`]}
            file={data.documents[requirement.key]}
            key={requirement.key}
            onChange={(file) => onDocumentChange(requirement.key, file)}
            requirement={requirement}
          />
        ))}
      </div>
    </div>
  )
}
