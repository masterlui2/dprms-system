import { FileCheck2 } from 'lucide-react'

import { getDocumentRequirements } from '../../../data/proposal'
import type {
  ProposalDocumentKey,
  ProposalFormData,
  ProposalFormErrors,
} from '../../../types/proposal'
import { FileUploadField } from '../FileUploadField'
import { ProposalSectionHeading } from '../ProposalSectionHeading'

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

  return (
    <div className="space-y-6">
      <ProposalSectionHeading
        description="Accepted formats: PDF, DOCX, XLSX, JPG, PNG. Maximum 10 MB per file."
        divided={false}
        title="Upload supporting documents"
      />

      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <FileCheck2 className="mt-0.5 size-5 shrink-0 text-amber-700" />
        <p>
          Only documents required for your selected program are listed below. You can replace
          a file any time before submitting.
        </p>
      </div>

      <div className="space-y-3">
        {requirements.map((requirement) => (
          <FileUploadField
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
