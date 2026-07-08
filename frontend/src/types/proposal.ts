export type ProposalType = "" | "GIA" | "SETUP";

export type ProjectCategory =
  | ""
  | "Agriculture"
  | "Food Processing"
  | "Manufacturing"
  | "ICT / Software"
  | "Health"
  | "Education"
  | "Environment"
  | "Energy"
  | "Fisheries"
  | "Others";

export type ProjectType =
  | ""
  | "Research and Development"
  | "Community-Based Project"
  | "Science and Technology Intervention"
  | "Capability Building"
  | "Training / Extension Project"
  | "Equipment Upgrading"
  | "Process Improvement"
  | "Product Development"
  | "Packaging and Labeling"
  | "Productivity Improvement"
  | "Others";

export type TargetBeneficiary =
  | ""
  | "Community Organization"
  | "Farmers"
  | "Fisherfolk"
  | "Cooperatives"
  | "LGU"
  | "Students"
  | "MSME"
  | "Sole Proprietorship"
  | "Cooperative"
  | "Partnership"
  | "Corporation"
  | "Others";

export type ProposalDocumentKey =
  | "registrationCertificate"
  | "businessPermit"
  | "birCertificate"
  | "projectProposal"
  | "lineItemBudget"
  | "incomeTaxReturn"
  | "equipmentQuotations"
  | "supportingDocuments"
  | "setupProposal"
  | "businessProfile";

export type ProposalDocuments = Record<ProposalDocumentKey, File | null>;

export interface ProposalFormData {
  applicantFullName: string;
  applicantPosition: string;
  emailAddress: string;
  contactNumber: string;
  organizationName: string;
  organizationType: string;
  industryCategory: string;
  yearEstablished: string;
  employeeCount: string;
  municipality: string;
  businessAddress: string;
  proposalType: ProposalType;
  projectTitle: string;
  cooperatingAgency: string;
  currentOperationalProblem: string;
  expectedBusinessImprovement: string;
  projectCategory: ProjectCategory;
  projectDuration: string;
  projectType: ProjectType;
  projectDescription: string;
  projectObjectives: string;
  methodology: string;
  personnelInvolved: string;
  proposedTechnologyAssistance: string;
  siteOfImplementation: string;
  technologyInnovation: string;
  targetBeneficiary: TargetBeneficiary;
  expectedOutputs: string;
  workplanSummary: string;
  equipmentNeeds: string;
  totalBusinessAssets: string;
  annualNetProfit: string;
  documents: ProposalDocuments;
  certified: boolean;
}

export type ProposalFieldName = Exclude<keyof ProposalFormData, "documents">;

export type ProposalFormErrors = Record<string, string>;

export type NotificationType = "error" | "success";

export interface ProposalNotification {
  type: NotificationType;
  title: string;
  message: string;
}
