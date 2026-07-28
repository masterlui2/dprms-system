import api from '../lib/axios'
import type { ApplicationProgram, ApplicationRecord } from '../types/application'
import type { OrganizationType, BusinessSize, SetupProposalData } from '../types/setupProposal'
import { saveApplication } from './applicationStore'
import type { DocumentApiRecord } from './documentStore'

export const ORGANIZATION_TYPE_TO_BUSINESS_TYPE: Record<Exclude<OrganizationType, ''>, string> = {
  'Sole Proprietorship': 'SOLE-PROPRIETORSHIP',
  Partnership: 'PARTNERSHIP',
  Cooperative: 'COOPERATIVE',
  Corporation: 'CORPORATION',
}

export const BUSINESS_SIZE_TO_ENTERPRISE_SIZE: Record<Exclude<BusinessSize, ''>, string> = {
  Micro: 'MICRO',
  Small: 'SMALL',
  Medium: 'MEDIUM',
}

// Reverse of the two maps above — for translating what the backend returns
// (SetupProposal.business_type / enterprise_size) back into frontend types.
export const BUSINESS_TYPE_TO_ORGANIZATION_TYPE: Record<string, Exclude<OrganizationType, ''>> = {
  'SOLE-PROPRIETORSHIP': 'Sole Proprietorship',
  PARTNERSHIP: 'Partnership',
  COOPERATIVE: 'Cooperative',
  CORPORATION: 'Corporation',
}

export const ENTERPRISE_SIZE_TO_BUSINESS_SIZE: Record<string, Exclude<BusinessSize, ''>> = {
  MICRO: 'Micro',
  SMALL: 'Small',
  MEDIUM: 'Medium',
}

export type DocumentGroup =
  | 'Business Documents'
  | 'Corporation / Cooperative Documents'
  | 'Financial Documents'
  | 'Additional Documents'
  | 'GIA Core Documents'
  | 'Category-specific Documents'

export interface DocumentTypeRecord {
  id: number
  name: string
  group: DocumentGroup | null
  description: string | null
  instructions: string | null
  template_url: string | null
  set_number: 'PROPOSAL' | 'SET1' | 'SET2' | 'SET3'
  applicable_program: 'SETUP' | 'GIA' | 'BOTH'
  applicable_business_types: string[] | null
  applicable_business_sizes: string[] | null
  applicable_gia_categories: string[] | null
  is_required: boolean
  is_applicant_visible: boolean
}

interface DocumentTypeIndexResponse {
  data: DocumentTypeRecord[]
}

export async function getDocumentTypes(params: {
  program: ApplicationProgram
  businessType?: string
  businessSize?: string
  giaCategory?: string
}): Promise<DocumentTypeRecord[]> {
  const response = await api.get<DocumentTypeIndexResponse>('/document-types', {
    params: {
      program: params.program,
      business_type: params.businessType,
      business_size: params.businessSize,
      gia_category: params.giaCategory,
    },
  })
  return response.data.data
}

interface SetupProposalApiRecord {
  id: number
  proposal_id: number
  business_name: string
  business_type: string
  industry_sector: string
  enterprise_size: string
  years_in_operation: number
  business_address: string
  region: string | null
  province: string | null
  city_municipality: string | null
}

interface ProposalApiRecord {
  id: number
  reference_number: string
  title: string
  status: string
  program_type: string
  user?: { id: number; name: string; email: string } | null
  // Modeled as HasMany on the backend (Proposal::setup_proposal), even
  // though a proposal only ever has one — so this can come back either as
  // an array or (if the backend later normalizes it) a single object.
  setup_proposal?: SetupProposalApiRecord[] | SetupProposalApiRecord | null
}

interface ProposalShowResponse {
  data: ProposalApiRecord
}

function pickSetupProposalRecord(
  record: SetupProposalApiRecord[] | SetupProposalApiRecord | null | undefined,
): SetupProposalApiRecord | null {
  if (!record) return null
  return Array.isArray(record) ? (record[0] ?? null) : record
}

/**
 * Fetches a submitted SETUP proposal by reference number via
 * GET /proposal/reference-number/{referenceNumber}
 * (ProposalController::getByReferenceNumber).
 *
 * Only maps the fields currently available on the backend. `contactPerson`
 * / `contactNumber` are intentionally left blank: there's no user-details
 * table yet to source them from (per backend, deferred post-MVP) — falls
 * back to the submitter's name/email from the Proposal's User relation
 * where it can.
 */
export async function getSetupProposal(
  referenceNo: string,
): Promise<Partial<SetupProposalData> | null> {
  try {
    const response = await api.get<ProposalShowResponse>(
      `/proposal/reference-number/${referenceNo}`,
    )
    const proposal = response.data.data
    const setup = pickSetupProposalRecord(proposal.setup_proposal)
    if (!setup) return null

    return {
      businessName: setup.business_name,
      businessAddress: setup.business_address,
      businessIndustry: setup.industry_sector,
      organizationType: BUSINESS_TYPE_TO_ORGANIZATION_TYPE[setup.business_type] ?? '',
      businessSize: ENTERPRISE_SIZE_TO_BUSINESS_SIZE[setup.enterprise_size] ?? '',
      contactPerson: proposal.user?.name ?? '',
      emailAddress: proposal.user?.email ?? '',
      projectTitle: proposal.title,
    }
  } catch {
    // Not found, unauthorized, or network error — callers already fall
    // back to application-level data when this returns null.
    return null
  }
}

const SETUP_DRAFT_KEY = 'dprms.setup-proposal-draft'

export function getSetupDraft(): SetupProposalData | null {
  try {
    const draft = window.localStorage.getItem(SETUP_DRAFT_KEY)
    return draft ? (JSON.parse(draft) as SetupProposalData) : null
  } catch {
    window.localStorage.removeItem(SETUP_DRAFT_KEY)
    return null
  }
}

export function saveSetupDraft(data: SetupProposalData) {
  window.localStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(data))
}

export function clearSetupDraft() {
  window.localStorage.removeItem(SETUP_DRAFT_KEY)
}

interface SetupProposalSubmitResponse {
  message: string
  data: {
    proposal: { id: number; reference_number: string; title: string; status: string; program_type: string }
    setup_proposal: SetupProposalApiRecord
    // Includes the auto-generated Form 001 PDF document plus every
    // supporting document submitted alongside it.
    documents: DocumentApiRecord[]
  }
}

export interface SetupProposalSubmitResult {
  application: ApplicationRecord
  /** Keyed by document_type_id, same shape DocumentaryRequirementsPage keeps in state. */
  documents: DocumentApiRecord[]
}

/**
 * Submits a SETUP proposal via POST /proposal/setup
 * (SetupProposalSubmissionController::store) as a single multipart request
 * that creates the Proposal, the SetupProposal row, the auto-generated
 * Form 001 PDF snapshot, and every supporting document in `documents` all
 * together. The backend wraps all of this in one DB transaction
 * (SetupSubmissionService::submit()) — either everything is created, or
 * (on validation failure or any error) nothing is, so there's no partial
 * "proposal exists but some documents are missing" state to recover from
 * on the frontend.
 *
 * `documents` is keyed by document_type_id (a DocumentaryRequirement.id),
 * matching what DocumentaryRequirementsPage already tracks in
 * `pendingFiles`.
 *
 * Sent as FormData (not JSON) because it carries files. `form_snapshot` is
 * flattened to `form_snapshot[field]=value` bracket notation since
 * multipart requests can't carry a nested JSON object directly — Laravel
 * reassembles this into a proper array server-side, satisfying the
 * `form_snapshot => required|array` validation rule. Every SetupProposalData
 * field is a plain string, so no further nesting is needed.
 *
 * IMPORTANT: same as uploadDocument() in documentStore.ts — the `api`
 * axios instance defaults to 'Content-Type: application/json', which has
 * to be explicitly cleared here so the browser attaches the multipart
 * boundary instead.
 *
 * KNOWN ISSUE (backend, not this function's bug): the business address is
 * sent as one free-text string, but SetupProposalService splits it on
 * commas expecting exactly 4 segments in the order
 * `street, city/municipality, province, region` — anything else silently
 * mis-assigns fields or, as seen in testing, leaves `region` null and
 * fails the DB constraint. The SETUP form only has a single "Business
 * Address" textarea with no such guidance, so this will keep breaking
 * until either the form collects region/province/city separately or the
 * backend parsing is made tolerant. Not fixed here — flagging so it isn't
 * mistaken for a frontend wiring bug.
 */
export async function submitSetupProposal(
  data: SetupProposalData,
  documents: Record<string, File>,
): Promise<SetupProposalSubmitResult> {
  const yearsInOperation = data.yearEstablished
    ? new Date().getFullYear() - Number(data.yearEstablished)
    : 0

  const formData = new FormData()
  formData.append('title', data.projectTitle)
  formData.append('business_name', data.businessName)
  if (data.organizationType) {
    formData.append(
      'business_type',
      ORGANIZATION_TYPE_TO_BUSINESS_TYPE[data.organizationType as Exclude<OrganizationType, ''>],
    )
  }
  formData.append('industry_sector', data.businessIndustry)
  if (data.businessSize) {
    formData.append(
      'enterprise_size',
      BUSINESS_SIZE_TO_ENTERPRISE_SIZE[data.businessSize as Exclude<BusinessSize, ''>],
    )
  }
  formData.append('years_in_operation', String(yearsInOperation))
  formData.append('business_address', data.businessAddress)

  for (const [key, value] of Object.entries(data)) {
    formData.append(`form_snapshot[${key}]`, value == null ? '' : String(value))
  }

  Object.entries(documents).forEach(([documentTypeId, file], index) => {
    formData.append(`documents[${index}][document_type_id]`, documentTypeId)
    formData.append(`documents[${index}][file]`, file)
  })

  const response = await api.post<SetupProposalSubmitResponse>('/proposal/setup', formData, {
    headers: { 'Content-Type': undefined },
  })
  const result = response.data.data

  const application: ApplicationRecord = {
    applicantName: data.contactPerson,
    contactEmail: data.emailAddress,
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    proposalId: result.proposal.id,
    organizationName: data.businessName,
    program: 'SETUP',
    projectTitle: data.projectTitle,
    referenceNo: result.proposal.reference_number,
    status: 'Submitted',
  }

  saveApplication(application)
  clearSetupDraft()
  return { application, documents: result.documents }
}

interface ProposalIdLookupResponse {
  data: { id: number }
}

/**
 * Resolves the numeric backend proposal id from a reference number, via the
 * same GET /proposal/reference-number/{referenceNumber} endpoint
 * getSetupProposal() already uses. This is a fallback for ApplicationRecords
 * that don't have proposalId set locally (older records, or if the submit
 * response shape doesn't match what submitSetupProposal() expects above).
 */
export async function getSetupProposalId(referenceNo: string): Promise<number | null> {
  try {
    const response = await api.get<ProposalIdLookupResponse>(
      `/proposal/reference-number/${referenceNo}`,
    )
    return response.data.data.id ?? null
  } catch {
    return null
  }
}