import type { ProposalFormData } from "../../../../types/proposal";
import { ReviewSection } from "./ReviewSection";
import { SummaryItem } from "./SummaryItem";

interface ProjectReviewSectionProps {
  data: ProposalFormData;
  isGia: boolean;
  onEdit: () => void;
}

export function ProjectReviewSection({
  data,
  isGia,
  onEdit,
}: ProjectReviewSectionProps) {
  return (
    <ReviewSection
      description="Project scope, location, need, and expected outputs."
      onEdit={onEdit}
      title="Project Details"
    >
      <SummaryItem label="Project Title" value={data.projectTitle} wide />
      {isGia ? (
        <>
          <SummaryItem label="Project Category" value={data.projectCategory} />
          <SummaryItem label="Project Type" value={data.projectType} />
        </>
      ) : (
        <SummaryItem
          label="Type of Assistance Needed"
          value={data.scopeOfAssistance}
        />
      )}
      <SummaryItem
        label="Site of Implementation"
        value={data.siteOfImplementation}
      />
      <SummaryItem
        label={isGia ? "Project Summary / Need" : "Business Problem or Need"}
        value={isGia ? data.projectDescription : data.currentOperationalProblem}
        wide
      />
      <SummaryItem label="Objectives" value={data.projectObjectives} wide />
      {isGia ? (
        <SummaryItem
          label="Target Beneficiaries"
          value={data.targetBeneficiary}
        />
      ) : (
        <SummaryItem
          label="Technology or Equipment Requested"
          value={data.proposedTechnologyAssistance}
          wide
        />
      )}
      <SummaryItem
        label={isGia ? "Expected Outputs" : "Expected Results"}
        value={data.expectedOutputs}
        wide
      />
    </ReviewSection>
  );
}
