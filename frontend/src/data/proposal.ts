import type {
  ProposalDocumentKey,
  ProposalFormData,
  ProposalType,
} from "../types/proposal";

export interface SelectOption {
  label: string;
  value: string;
}

export interface DocumentRequirement {
  accept: string;
  description: string;
  key: ProposalDocumentKey;
  label: string;
  required: boolean;
  validationMessage: string;
}

export const initialProposalFormData: ProposalFormData = {
  applicantFullName: "",
  applicantPosition: "",
  emailAddress: "",
  contactNumber: "",
  organizationName: "",
  organizationType: "",
  industryCategory: "",
  yearEstablished: "",
  employeeCount: "",
  municipality: "",
  businessAddress: "",
  proposalType: "",
  projectTitle: "",
  projectCategory: "",
  projectType: "",
  projectDescription: "",
  projectObjectives: "",
  technologyInnovation: "",
  targetBeneficiary: "",
  expectedOutputs: "",
  equipmentNeeds: "",
  totalBusinessAssets: "",
  annualNetProfit: "",
  documents: {
    registrationCertificate: null,
    businessPermit: null,
    birCertificate: null,
    projectProposal: null,
    lineItemBudget: null,
    incomeTaxReturn: null,
    equipmentQuotations: null,
    supportingDocuments: null,
    setupProposal: null,
    businessProfile: null,
  },
  certified: false,
};

export const proposalTypeOptions: SelectOption[] = [
  {
    value: "GIA",
    label: "GIA - Grants-in-Aid Program",
  },
  {
    value: "SETUP",
    label: "SETUP - Small Enterprise Technology Upgrading Program",
  },
];

export const projectCategoryOptions: SelectOption[] = [
  { value: "Agriculture", label: "Agriculture" },
  { value: "Food Processing", label: "Food Processing" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "ICT / Software", label: "ICT / Software" },
  { value: "Health", label: "Health" },
  { value: "Education", label: "Education" },
  { value: "Environment", label: "Environment" },
  { value: "Energy", label: "Energy" },
  { value: "Fisheries", label: "Fisheries" },
  { value: "Others", label: "Others" },
];

export const giaProjectTypeOptions: SelectOption[] = [
  { value: "Research and Development", label: "Research and Development" },
  { value: "Community-Based Project", label: "Community-Based Project" },
  {
    value: "Science and Technology Intervention",
    label: "Science and Technology Intervention",
  },
  { value: "Capability Building", label: "Capability Building" },
  {
    value: "Training / Extension Project",
    label: "Training / Extension Project",
  },
  { value: "Others", label: "Others" },
];

export const setupProjectTypeOptions: SelectOption[] = [
  { value: "Equipment Upgrading", label: "Equipment Upgrading" },
  { value: "Process Improvement", label: "Process Improvement" },
  { value: "Product Development", label: "Product Development" },
  { value: "Packaging and Labeling", label: "Packaging and Labeling" },
  { value: "Productivity Improvement", label: "Productivity Improvement" },
  { value: "Others", label: "Others" },
];

export const giaTargetBeneficiaryOptions: SelectOption[] = [
  { value: "Community Organization", label: "Community Organization" },
  { value: "Farmers", label: "Farmers" },
  { value: "Fisherfolk", label: "Fisherfolk" },
  { value: "Cooperatives", label: "Cooperatives" },
  { value: "LGU", label: "LGU" },
  { value: "Students", label: "Students" },
  { value: "Others", label: "Others" },
];

export const setupTargetBeneficiaryOptions: SelectOption[] = [
  { value: "MSME", label: "MSME" },
  { value: "Sole Proprietorship", label: "Sole Proprietorship" },
  { value: "Cooperative", label: "Cooperative" },
  { value: "Partnership", label: "Partnership" },
  { value: "Corporation", label: "Corporation" },
  { value: "Others", label: "Others" },
];

export const organizationTypeOptions: SelectOption[] = [
  { value: "Sole Proprietorship", label: "Sole Proprietorship" },
  { value: "Partnership", label: "Partnership" },
  { value: "Corporation", label: "Corporation" },
  { value: "Cooperative", label: "Cooperative" },
  { value: "Nonprofit Organization", label: "Nonprofit Organization" },
  { value: "Local Government Unit", label: "Local Government Unit" },
  {
    value: "State University or College",
    label: "State University or College",
  },
];

export const industryCategoryOptions: SelectOption[] = [
  {
    value: "Agriculture and Aquaculture",
    label: "Agriculture and Aquaculture",
  },
  { value: "Food Processing", label: "Food Processing" },
  {
    value: "Furniture and Wood Products",
    label: "Furniture and Wood Products",
  },
  {
    value: "Gifts, Decor, and Handicrafts",
    label: "Gifts, Decor, and Handicrafts",
  },
  { value: "Information Technology", label: "Information Technology" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Metals and Engineering", label: "Metals and Engineering" },
  { value: "Health and Wellness", label: "Health and Wellness" },
  { value: "Other", label: "Other" },
];

export const municipalityOptions: SelectOption[] = [
  { value: "Baganga", label: "Baganga" },
  { value: "Banaybanay", label: "Banaybanay" },
  { value: "Boston", label: "Boston" },
  { value: "Caraga", label: "Caraga" },
  { value: "Cateel", label: "Cateel" },
  { value: "City of Mati", label: "City of Mati" },
  { value: "Governor Generoso", label: "Governor Generoso" },
  { value: "Lupon", label: "Lupon" },
  { value: "Manay", label: "Manay" },
  { value: "San Isidro", label: "San Isidro" },
  { value: "Tarragona", label: "Tarragona" },
];

const acceptedDocumentFormats = ".pdf,.docx,.xlsx,.jpg,.jpeg,.png";

export const giaDocumentRequirements: DocumentRequirement[] = [
  {
    key: "projectProposal",
    label: "Project Proposal",
    description: "Complete GIA project proposal document.",
    accept: acceptedDocumentFormats,
    required: true,
    validationMessage: "Please upload your Project Proposal.",
  },
  {
    key: "lineItemBudget",
    label: "Line-Item Budget (LIB)",
    description: "Detailed budget breakdown of the proposed project.",
    accept: acceptedDocumentFormats,
    required: true,
    validationMessage: "Please upload the Line-Item Budget.",
  },
  {
    key: "registrationCertificate",
    label: "DTI / SEC / CDA Registration",
    description: "Valid business or organization registration.",
    accept: acceptedDocumentFormats,
    required: true,
    validationMessage: "Registration document is required.",
  },
  {
    key: "businessPermit",
    label: "Business / Mayor's Permit",
    description: "Current permit to operate.",
    accept: acceptedDocumentFormats,
    required: true,
    validationMessage: "Business Permit is required.",
  },
  {
    key: "supportingDocuments",
    label: "Supporting Documents",
    description:
      "Technical drawings, quotations, feasibility study, or other supporting documents (if applicable).",
    accept: acceptedDocumentFormats,
    required: true,
    validationMessage: "Please upload the supporting documents.",
  },
];

export const setupDocumentRequirements: DocumentRequirement[] = [
  {
    key: "setupProposal",
    label: "SETUP Proposal",
    description: "Official SETUP proposal document.",
    accept: acceptedDocumentFormats,
    required: true,
    validationMessage: "Please upload the official SETUP Proposal.",
  },
  {
    key: "lineItemBudget",
    label: "Line-Item Budget (LIB)",
    description: "Detailed budget breakdown.",
    accept: acceptedDocumentFormats,
    required: true,
    validationMessage: "Please upload the Line-Item Budget.",
  },
  {
    key: "registrationCertificate",
    label: "DTI / SEC / CDA Registration",
    description: "Valid business registration.",
    accept: acceptedDocumentFormats,
    required: true,
    validationMessage: "Registration document is required.",
  },
  {
    key: "businessProfile",
    label: "Business Profile",
    description: "Brief profile of the enterprise.",
    accept: acceptedDocumentFormats,
    required: true,
    validationMessage: "Business Profile is required.",
  },
  {
    key: "equipmentQuotations",
    label: "Equipment Quotations",
    description: "Supplier quotations for the requested equipment.",
    accept: acceptedDocumentFormats,
    required: true,
    validationMessage:
      "Equipment Quotations are required for SETUP applications.",
  },
];

export function getDocumentRequirements(
  proposalType: ProposalType,
): DocumentRequirement[] {
  if (proposalType === "GIA") return giaDocumentRequirements;
  if (proposalType === "SETUP") return setupDocumentRequirements;
  return [];
}

export function areRequiredDocumentsComplete(
  data: ProposalFormData,
): boolean {
  const requirements = getDocumentRequirements(data.proposalType);

  return (
    requirements.length > 0 &&
    requirements.every((requirement) => data.documents[requirement.key])
  );
}
