export type ProposalType = '' | 'GIA' | 'SETUP'

export type ProjectCategory =
  | ''
  | 'Agriculture'
  | 'Food Processing'
  | 'Manufacturing'
  | 'ICT / Software'
  | 'Health'
  | 'Education'
  | 'Environment'
  | 'Energy'
  | 'Fisheries'
  | 'Others'

export type ProjectType =
  | ''
  | 'Research and Development'
  | 'Technology Transfer'
  | 'Equipment Assistance'
  | 'Capability Building'
  | 'Innovation Project'
  | 'Others'

export type TargetBeneficiary =
  | ''
  | 'MSMEs'
  | 'Farmers'
  | 'Fisherfolk'
  | 'Cooperatives'
  | 'Local Government Units (LGUs)'
  | 'Community Organizations'
  | 'Students'
  | 'Others'

export type ProposalDocumentKey =
  | 'registrationCertificate'
  | 'businessPermit'
  | 'birCertificate'
  | 'projectProposal'
  | 'lineItemBudget'
  | 'proponentBiodata'
  | 'incomeTaxReturn'
  | 'equipmentQuotations'

export type ProposalDocuments = Record<ProposalDocumentKey, File | null>

export interface ProposalFormData {
  applicantFullName: string
  applicantPosition: string
  emailAddress: string
  contactNumber: string
  organizationName: string
  organizationType: string
  industryCategory: string
  yearEstablished: string
  employeeCount: string
  municipality: string
  businessAddress: string
  proposalType: ProposalType
  projectTitle: string
  projectCategory: ProjectCategory
  projectType: ProjectType
  technologyInnovation: string
  targetBeneficiary: TargetBeneficiary
  equipmentNeeds: string
  totalBusinessAssets: string
  annualNetProfit: string
  documents: ProposalDocuments
  certified: boolean
}

export type ProposalFieldName = Exclude<keyof ProposalFormData, 'documents'>

export type ProposalFormErrors = Record<string, string>

export type NotificationType = 'error' | 'success'

export interface ProposalNotification {
  type: NotificationType
  title: string
  message: string
}
