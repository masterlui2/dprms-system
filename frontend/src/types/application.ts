import type { ProposalType } from './proposal'

export type ApplicationProgram = Exclude<ProposalType, ''>

export interface ApplicationRecord {
  applicantName: string
  contactEmail: string
  createdAt: string
  id: string
  organizationName: string
  program: ApplicationProgram
  projectTitle: string
  referenceNo: string
  status:
    | 'Submitted'
    | 'Draft Submitted'
    | 'Under review'
    | 'Technical evaluation'
    | 'Approved'
    | 'Returned for Revision'
}

export interface CreatedProjectRecord {
  beneficiary: string
  complianceStatus: string
  id: string
  program: ApplicationProgram
  title: string
}
