export type GiaProponentCategory =
  | ''
  | 'Private Sector'
  | 'Higher Education Institution'
  | 'Barangay LGU'

export interface GiaProposalData {
  proponentCategory: GiaProponentCategory
  organizationName: string
  officeAddress: string
  projectLeader: string
  position: string
  contactNumber: string
  emailAddress: string
  projectTitle: string
  projectCategory: string
  projectType: string
  projectSummary: string
  projectRationale: string
  generalObjective: string
  specificObjectives: string
  siteOfImplementation: string
  targetBeneficiaries: string
  methodology: string
  expectedOutputs: string
  sustainabilityPlan: string
}

export type GiaProposalField = keyof GiaProposalData
export type GiaProposalErrors = Partial<Record<GiaProposalField, string>>
