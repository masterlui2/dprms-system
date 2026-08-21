import type { ProposalType } from './proposal'

export type ApplicationProgram = Exclude<ProposalType, ''>

export interface ApplicationRecord {
  applicantName: string
  contactEmail: string
  createdAt: string
  id: string
  /**
   * Numeric backend `proposals.id`. Only guaranteed present for SETUP
   * applications created via submitSetupProposal() and GIA applications
   * created via submitGiaProposal(), after this field was added. Older,
   * local-only, or backend-submission-failed-and-fell-back records may not
   * have it — code that needs it (document upload/list) should fall back
   * to resolving it via getSetupProposalId(referenceNo) /
   * getGiaProposalId(referenceNo) in setupProposalStore.ts /
   * giaProposalStore.ts.
   */
  proposalId?: number
  organizationName: string
  program: ApplicationProgram
  projectTitle: string
  referenceNo: string
  status:
    | 'Submitted'
    | 'Draft Submitted'
    | 'Under review'
    | 'Technical evaluation'
    | 'In Process'
    | 'Executive Approval'
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