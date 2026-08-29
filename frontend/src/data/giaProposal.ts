import type { GiaProposalData, GiaProponentCategory } from '../types/giaProposal'

export const giaProponentCategories: Array<Exclude<GiaProponentCategory, ''>> = [
  'Private Sector',
  'Higher Education Institution',
  'Barangay LGU',
]

export const giaProjectCategories = [
  'Agriculture and Fisheries',
  'Community Development',
  'Education',
  'Environment',
  'Health',
  'Information and Communications Technology',
  'Research and Development',
  'Disaster Risk Reduction and Management',
  'Others',
]

export const giaProjectTypes = [
  'Research and Development',
  'Capability Building and Training',
  'Technology Transfer',
  'Community-Based Science and Technology Project',
  'Others',
]

export const emptyGiaProposal: GiaProposalData = {
  proponentCategory: '',
  organizationName: '',
  officeAddress: '',
  projectLeader: '',
  position: '',
  contactNumber: '',
  emailAddress: '',
  projectTitle: '',
  projectCategory: '',
  projectType: '',
  projectSummary: '',
  projectRationale: '',
  generalObjective: '',
  specificObjectives: '',
  siteOfImplementation: '',
  targetBeneficiaries: '',
  methodology: '',
  expectedOutputs: '',
  sustainabilityPlan: '',
}
