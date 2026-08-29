import { CheckCircle2 } from "lucide-react";

import type {
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
} from "../../../types/proposal";
import { ProposalSectionHeading } from "../ProposalSectionHeading";
import { CertificationPanel } from "./review/CertificationPanel";
import { DocumentsReviewSection } from "./review/DocumentsReviewSection";
import { ProjectReviewSection } from "./review/ProjectReviewSection";
import { ProponentReviewSection } from "./review/ProponentReviewSection";

interface ReviewStepProps {
  data: ProposalFormData;
  errors: ProposalFormErrors;
  onEditSection: (step: number) => void;
  onFieldChange: <K extends ProposalFieldName>(
    field: K,
    value: ProposalFormData[K],
  ) => void;
}

export function ReviewStep({
  data,
  errors,
  onEditSection,
  onFieldChange,
}: ReviewStepProps) {
  const isGia = data.proposalType === "GIA";

  return (
    <div className="space-y-6">
      <ProposalSectionHeading
        description="Review the complete proposal and uploaded documents before sending it to DOST."
        divided={false}
        title="Review and Submit"
      />

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-[#073b82]">
        This page summarizes the information that will be submitted. Use the
        Edit buttons to make changes before confirming.
      </div>

      <ProponentReviewSection
        data={data}
        isGia={isGia}
        onEdit={() => onEditSection(1)}
      />
      <ProjectReviewSection
        data={data}
        isGia={isGia}
        onEdit={() => onEditSection(1)}
      />
      <DocumentsReviewSection data={data} onEdit={() => onEditSection(2)} />
      <CertificationPanel
        certified={data.certified}
        error={errors.certified}
        onCertifiedChange={(certified) => onFieldChange("certified", certified)}
      />

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        <CheckCircle2 className="size-5 text-[#0f53b7]" />
        Submitting will create a reference number and route the proposal for
        DOST validation.
      </div>
    </div>
  );
}
