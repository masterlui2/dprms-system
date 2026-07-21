import type {
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
} from "../../../../types/proposal";

export interface ProposalInformationSectionProps {
  data: ProposalFormData;
  errors: ProposalFormErrors;
  isGia: boolean;
  onFieldChange: <K extends ProposalFieldName>(
    field: K,
    value: ProposalFormData[K],
  ) => void;
}
