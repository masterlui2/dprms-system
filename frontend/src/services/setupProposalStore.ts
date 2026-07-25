import type { ApplicationRecord } from '../types/application'
import type { SetupProposalData } from '../types/setupProposal'
import { getApplications, saveApplication } from './applicationStore'
import { SAMPLE_SETUP_REFERENCE, sampleSetupProposal } from '../data/sampleSetupProposal'
import api, { ensureCsrfCookie } from '../lib/axios'

const DRAFT_KEY = 'dprms.setup-proposal-draft'
const PROPOSALS_KEY = 'dprms.setup-proposal-details'

// Matches routes/api.php: Route::prefix('proposal')->post('/setup', ...)
const SETUP_SUBMIT_URL = '/proposal/setup'

type ProposalDetails = Record<string, SetupProposalData>

const ORGANIZATION_TYPE_TO_BUSINESS_TYPE: Record<
  Exclude<SetupProposalData['organizationType'], ''>,
  'SOLE-PROPRIETORSHIP' | 'PARTNERSHIP' | 'CORPORATION' | 'COOPERATIVE'
> = {
  'Sole Proprietorship': 'SOLE-PROPRIETORSHIP',
  Partnership: 'PARTNERSHIP',
  Corporation: 'CORPORATION',
  Cooperative: 'COOPERATIVE',
}

const BUSINESS_SIZE_TO_ENTERPRISE_SIZE: Record<
  Exclude<SetupProposalData['businessSize'], ''>,
  'MICRO' | 'SMALL' | 'MEDIUM'
> = {
  Micro: 'MICRO',
  Small: 'SMALL',
  Medium: 'MEDIUM',
}

interface SetupProposalSubmitPayload {
  title: string
  remarks?: string
  business_name: string
  business_type: string
  industry_sector: string
  enterprise_size: string
  years_in_operation: number
  business_address: string
  form_snapshot: SetupProposalData
}

interface SetupProposalSubmitResponse {
  message: string
  data: {
    proposal: {
      id: number | string
      reference_number: string
      title: string
      status: string
    }
    setup_proposal: unknown
    document: unknown
  }
}

// Maps the `proposals.status` enum to ApplicationRecord's display-status
// union. Anything not explicitly listed here falls back to 'Draft Submitted'.
const BACKEND_STATUS_TO_APPLICATION_STATUS: Record<string, ApplicationRecord['status']> = {
  DRAFT: 'Draft Submitted',
  SUBMITTED: 'Submitted',
  UNDER_VALIDATION: 'Under review',
  ENDORSED_TO_FOCAL: 'Under review',
  UNDER_SCREENING: 'Under review',
  ENDORSED_TO_DIRECTOR: 'Under review',
  UNDER_EVALUATION: 'Technical evaluation',
  APPROVED: 'Approved',
  DISAPPROVED: 'Returned for Revision',
  RETURNED: 'Returned for Revision',
}

function toSubmitPayload(data: SetupProposalData): SetupProposalSubmitPayload {
  const businessType = data.organizationType
    ? ORGANIZATION_TYPE_TO_BUSINESS_TYPE[data.organizationType]
    : undefined
  const enterpriseSize = data.businessSize
    ? BUSINESS_SIZE_TO_ENTERPRISE_SIZE[data.businessSize]
    : undefined

  if (!businessType) {
    throw new Error('Organization type is required.')
  }
  if (!enterpriseSize) {
    throw new Error('Business size is required.')
  }

  const yearEstablished = Number(data.yearEstablished)
  const yearsInOperation = Number.isFinite(yearEstablished)
    ? Math.max(0, new Date().getFullYear() - yearEstablished)
    : 0

  return {
    title: data.projectTitle,
    business_name: data.businessName,
    business_type: businessType,
    industry_sector: data.businessIndustry,
    enterprise_size: enterpriseSize,
    years_in_operation: yearsInOperation,
    business_address: data.businessAddress,
    form_snapshot: data,
  }
}

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

export async function submitSetupProposal(data: SetupProposalData): Promise<ApplicationRecord> {
  const proposal = withoutLegacyRegistration(data)
  const payload = toSubmitPayload(proposal)

  await ensureCsrfCookie()

  const response = await api.post<SetupProposalSubmitResponse>(SETUP_SUBMIT_URL, payload)
  const backendProposal = response.data.data.proposal

  const referenceNo = backendProposal.reference_number

  const application: ApplicationRecord = {
    applicantName: proposal.contactPerson,
    contactEmail: proposal.emailAddress,
    createdAt: new Date().toISOString(),
    id: String(backendProposal.id),
    organizationName: proposal.businessName,
    program: 'SETUP',
    projectTitle: proposal.projectTitle,
    referenceNo,
    status: BACKEND_STATUS_TO_APPLICATION_STATUS[backendProposal.status] ?? 'Draft Submitted',
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
  return readDetails()[referenceNo] ?? null
}

export function getSetupApplications() {
  return getApplications().filter((application) => application.program === 'SETUP')
}