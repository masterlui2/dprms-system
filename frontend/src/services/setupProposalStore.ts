import type { ApplicationRecord } from '../types/application'
import type { SetupProposalData } from '../types/setupProposal'
import { getApplications, saveApplication } from './applicationStore'
import { SAMPLE_SETUP_REFERENCE, sampleSetupProposal } from '../data/sampleSetupProposal'

const DRAFT_KEY = 'dprms.setup-proposal-draft'
const PROPOSALS_KEY = 'dprms.setup-proposal-details'

type ProposalDetails = Record<string, SetupProposalData>

function withoutLegacyRegistration(data: SetupProposalData): SetupProposalData {
  const proposal = { ...data } as SetupProposalData & { businessRegistrations?: unknown }
  delete proposal.businessRegistrations
  return proposal
}

function readDetails(): ProposalDetails {
  try {
    return JSON.parse(window.localStorage.getItem(PROPOSALS_KEY) ?? '{}') as ProposalDetails
  } catch {
    return {}
  }
}

export function getSetupDraft(): SetupProposalData | null {
  try {
    const draft = window.localStorage.getItem(DRAFT_KEY)
    return draft ? withoutLegacyRegistration(JSON.parse(draft) as SetupProposalData) : null
  } catch {
    window.localStorage.removeItem(DRAFT_KEY)
    return null
  }
}

export function saveSetupDraft(data: SetupProposalData) {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(withoutLegacyRegistration(data)))
}

export function clearSetupDraft() {
  window.localStorage.removeItem(DRAFT_KEY)
}

export function submitSetupProposal(data: SetupProposalData): ApplicationRecord {
  const proposal = withoutLegacyRegistration(data)
  const referenceNo = `SETUP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const application: ApplicationRecord = {
    applicantName: proposal.contactPerson,
    contactEmail: proposal.emailAddress,
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    organizationName: proposal.businessName,
    program: 'SETUP',
    projectTitle: proposal.projectTitle,
    referenceNo,
    status: 'Draft Submitted',
  }

  saveApplication(application)
  window.localStorage.setItem(
    PROPOSALS_KEY,
    JSON.stringify({ ...readDetails(), [referenceNo]: proposal }),
  )
  clearSetupDraft()
  return application
}

export function getSetupProposal(referenceNo: string) {
  return readDetails()[referenceNo]
    ?? (referenceNo === SAMPLE_SETUP_REFERENCE ? sampleSetupProposal : null)
}

export function getSetupApplications() {
  return getApplications().filter((application) => application.program === 'SETUP')
}
