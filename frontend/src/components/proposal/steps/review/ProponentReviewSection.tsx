import type { ProposalFormData } from "../../../../types/proposal";
import { ReviewSection } from "./ReviewSection";
import { SummaryItem } from "./SummaryItem";

interface ProponentReviewSectionProps {
  data: ProposalFormData;
  isGia: boolean;
  onEdit: () => void;
}

export function ProponentReviewSection({
  data,
  isGia,
  onEdit,
}: ProponentReviewSectionProps) {
  return (
    <ReviewSection
      description="Contact and organization information for DOST notifications."
      onEdit={onEdit}
      title={isGia ? "Proponent and Agency" : "Proponent and Business"}
    >
      <SummaryItem label="Program" value={data.proposalType} />
      <SummaryItem
        label={
          isGia ? "Project Leader / Contact Person" : "Owner / Representative"
        }
        value={data.applicantFullName}
      />
      <SummaryItem label="Position / Designation" value={data.applicantPosition} />
      <SummaryItem label="Email Address" value={data.emailAddress} />
      <SummaryItem label="Contact Number" value={data.contactNumber} />
      <SummaryItem
        label={isGia ? "Implementing Agency / Organization" : "Business Name"}
        value={data.organizationName}
      />
      <SummaryItem
        label={isGia ? "Organization Type" : "Business Type"}
        value={isGia ? data.organizationType : data.businessType}
      />
      <SummaryItem label="Municipality / City" value={data.municipality} />
      <SummaryItem
        label={isGia ? "Office Address" : "Business Address"}
        value={data.businessAddress}
        wide
      />
      {isGia ? null : (
        <>
          <SummaryItem label="Line of Business" value={data.lineOfBusiness} />
          <SummaryItem label="Enterprise Size" value={data.enterpriseSize} />
          <SummaryItem label="Industry Sector" value={data.industryCategory} />
          <SummaryItem label="Years in Operation" value={data.yearEstablished} />
        </>
      )}
    </ReviewSection>
  );
}
