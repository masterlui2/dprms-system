import type {
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
} from "../../../types/proposal";
import { ProposalSectionHeading } from "../ProposalSectionHeading";
import { ContactDetailsSection } from "./proposal-information/ContactDetailsSection";
import { OrganizationSection } from "./proposal-information/OrganizationSection";
import { ProjectDetailsSection } from "./proposal-information/ProjectDetailsSection";

interface ProposalInformationStepProps {
  data: ProposalFormData;
  errors: ProposalFormErrors;
  onFieldChange: <K extends ProposalFieldName>(
    field: K,
    value: ProposalFormData[K],
  ) => void;
}

export function ProposalInformationStep({
  data,
  errors,
  onFieldChange,
}: ProposalInformationStepProps) {
  const isGia = data.proposalType === "GIA";
  const sectionProps = { data, errors, isGia, onFieldChange };

  return (
    <div className="space-y-8">
      <ProposalSectionHeading
        description="Complete the essential information DOST needs to screen your proposal. You can edit these details before final submission."
        divided={false}
        title="Proposal Information"
      />

      <ContactDetailsSection {...sectionProps} />
      <OrganizationSection {...sectionProps} />
      <ProjectDetailsSection {...sectionProps} />
    </div>
  );
}
