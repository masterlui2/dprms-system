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
  | "R&D"
  | "Non-R&D"
  | "Applied Research"
  | "Basic Research"
  | "Development Research"
  | "Not yet conducted"
  | "Conducted by PSTO"
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
  | "letterOfIntent"
  | "endorsementLetter"
  | "eligibilityChecklist"
  | "workplan"
  | "rtecReport"
  | "setiScorecard"
  | "gadChecklist"
  | "moaResolution"
  | "certificateOfFundsAvailability"
  | "chedAccreditation"
  | "dostTrackRecord"
  | "secCdaDoleRegistration"
  | "auditedFinancialStatements"
  | "swornAffidavit"
  | "secretaryCertificate"
  | "boardResolution"
  | "tnaForm01"
  | "mayorsPermit"
  | "dtiRegistration"
  | "notarizedBoardResolution"
  | "registrationCertificate"
  | "businessPermit"
  | "birCertificate"
  | "projectProposal"
  | "incomeTaxReturn"
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
  cooperatingAgency: string;
  headOfAgency: string;
  authorizedRepresentative: string;
  lineOfBusiness: string;
  businessType: string;
  enterpriseSize: string;
  proposalType: ProposalType;
  projectTitle: string;
  scopeOfAssistance: string;
  currentOperationalProblem: string;
  existingEquipmentUsed: string;
  processBottlenecks: string;
  productQualityConcerns: string;
  productivityConcerns: string;
  targetImprovement: string;
  projectCategory: ProjectCategory;
  projectType: ProjectType;
  tnaStatus: ProjectType;
  projectDescription: string;
  projectObjectives: string;
  rationale: string;
  methodology: string;
  personnelInvolved: string;
  proposedTechnologyAssistance: string;
  siteOfImplementation: string;
  technologyInnovation: string;
  targetBeneficiary: TargetBeneficiary;
  expectedOutputs: string;
  sustainabilityPlan: string;
  workplanSummary: string;
  equipmentNeeds: string;
  equipmentPurpose: string;
  supplierFabricator: string;
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
