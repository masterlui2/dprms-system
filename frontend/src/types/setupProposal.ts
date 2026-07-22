export type OrganizationType =
  | ''
  | 'Sole Proprietorship'
  | 'Partnership'
  | 'Cooperative'
  | 'Corporation'

export type BusinessSize = '' | 'Micro' | 'Small' | 'Medium'

export type BusinessRegistrationOffice = 'DTI' | 'SEC' | 'CDA' | 'LGU' | 'Others'

export interface BusinessRegistrationEntry {
  dateOfRegistration: string
  office: BusinessRegistrationOffice
  otherOfficeName: string
  registrationNumber: string
  selected: boolean
}

export interface SetupProposalData {
  projectTitle: string
  generalObjective: string
  specificObjectives: string
  projectBackground: string
  businessName: string
  businessAddress: string
  contactPerson: string
  contactNumber: string
  emailAddress: string
  yearEstablished: string
  organizationType: OrganizationType
  businessSize: BusinessSize
  numberOfEmployees: string
  businessRegistrations: BusinessRegistrationEntry[]
  businessIndustry: string
  productsServices: string
  enterpriseBackground: string
  organizationalStructure: string
  ownerKeyPersonnel: string
  skillsExpertise: string
  plantLocation: string
  rawMaterials: string
  currentProductionProcess: string
  existingProblems: string
  proposedTechnologyIntervention: string
  expectedOutputs: string
  targetMarket: string
  competitors: string
  marketingStrategy: string
  distributionChannel: string
  annualSales: string
  existingFundingSource: string
}

export type SetupProposalField = keyof SetupProposalData
export type SetupProposalErrors = Partial<Record<SetupProposalField, string>>
