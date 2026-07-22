import type { ApplicationRecord } from '../types/application'
import type { GiaProposalData } from '../types/giaProposal'
import { getApplications, saveApplication } from './applicationStore'

const DRAFT_KEY = 'dprms.gia-proposal-draft'
const PROPOSALS_KEY = 'dprms.gia-proposal-details'

type ProposalDetails = Record<string, GiaProposalData>

function readDetails(): ProposalDetails {
  try {
    return JSON.parse(window.localStorage.getItem(PROPOSALS_KEY) ?? '{}') as ProposalDetails
  } catch {
    return {}
  }
}

export function getGiaDraft(): GiaProposalData | null {
  try {
    const draft = window.localStorage.getItem(DRAFT_KEY)
    return draft ? JSON.parse(draft) as GiaProposalData : null
  } catch {
    window.localStorage.removeItem(DRAFT_KEY)
    return null
  }
}

export function saveGiaDraft(data: GiaProposalData) {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

export function clearGiaDraft() {
  window.localStorage.removeItem(DRAFT_KEY)
}

export function submitGiaProposal(data: GiaProposalData): ApplicationRecord {
  const referenceNo = `GIA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const application: ApplicationRecord = {
    applicantName: data.projectLeader,
    contactEmail: data.emailAddress,
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    organizationName: data.organizationName,
    program: 'GIA',
    projectTitle: data.projectTitle,
    referenceNo,
    status: 'Draft Submitted',
  }

  saveApplication(application)
  window.localStorage.setItem(
    PROPOSALS_KEY,
    JSON.stringify({ ...readDetails(), [referenceNo]: data }),
  )
  clearGiaDraft()
  return application
}

export function getGiaProposal(referenceNo: string) {
  return readDetails()[referenceNo] ?? null
}

export function getGiaApplications() {
  return getApplications().filter((application) => application.program === 'GIA')
}
