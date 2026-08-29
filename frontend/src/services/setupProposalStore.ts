import api from '../lib/axios'
import type { ApplicationProgram, ApplicationRecord } from '../types/application'
import type { OrganizationType, BusinessSize, SetupProposalData } from '../types/setupProposal'
import { getMockUser, setMockUser } from '../lib/mockAuth'
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
  set_number: 'PROPOSAL' | 'SET1' | 'SET2' | 'SET3' | 'GIA1'
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
  setNumber?: DocumentTypeRecord['set_number']
  visibility?: 'applicant' | 'internal'
}): Promise<DocumentTypeRecord[]> {
  const response = await api.get<DocumentTypeIndexResponse>('/document-types', {
    params: {
      program: params.program,
      business_type: params.businessType,
      business_size: params.businessSize,
      gia_category: params.giaCategory,
      set_number: params.setNumber,
      visibility: params.visibility,
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

export async function submitSetupProposal(
  data: SetupProposalData,
  documents: Record<string, File>,
): Promise<SetupProposalSubmitResult> {
  const yearsInOperation = data.yearEstablished
    ? new Date().getFullYear() - Number(data.yearEstablished)
    : 0

  const formData = new FormData()
  formData.append('title', data.projectTitle || 'SETUP Technology Upgrade Proposal')
  formData.append('business_name', data.businessName || 'Proponent Enterprise')
  const businessType = data.organizationType
    ? ORGANIZATION_TYPE_TO_BUSINESS_TYPE[data.organizationType as Exclude<OrganizationType, ''>] ?? 'SOLE-PROPRIETORSHIP'
    : 'SOLE-PROPRIETORSHIP'
  formData.append('business_type', businessType)
  formData.append('industry_sector', data.businessIndustry || 'Manufacturing')
  const enterpriseSize = data.businessSize
    ? BUSINESS_SIZE_TO_ENTERPRISE_SIZE[data.businessSize as Exclude<BusinessSize, ''>] ?? 'MICRO'
    : 'MICRO'
  formData.append('enterprise_size', enterpriseSize)
  formData.append('years_in_operation', String(yearsInOperation))
  formData.append('business_address', data.businessAddress || 'Philippines')

  for (const [key, value] of Object.entries(data)) {
    formData.append(`form_snapshot[${key}]`, value == null ? '' : String(value))
  }

  let resolvedDocTypes: DocumentTypeRecord[] = []
  const hasNonNumeric = Object.keys(documents).some((id) => !/^\d+$/.test(id))
  if (hasNonNumeric) {
    try {
      resolvedDocTypes = await getDocumentTypes({ program: 'SETUP' })
    } catch {
      // ignore
    }
  }

  let index = 0
  for (const [docKey, file] of Object.entries(documents)) {
    let numericId: number | string = docKey
    if (!/^\d+$/.test(docKey) && resolvedDocTypes.length > 0) {
      const match = resolvedDocTypes.find((dt) => {
        const lowerDtName = dt.name.toLowerCase()
        const lowerKey = docKey.toLowerCase()
        return (
          lowerDtName.includes(lowerKey.replace(/-/g, ' ')) ||
          (lowerKey.includes('omnibus') && lowerDtName.includes('omnibus')) ||
          (lowerKey.includes('intent') && lowerDtName.includes('intent')) ||
          (lowerKey.includes('mayor') && lowerDtName.includes('mayor')) ||
          (lowerKey.includes('dti') && lowerDtName.includes('dti')) ||
          (lowerKey.includes('sec') && lowerDtName.includes('sec')) ||
          (lowerKey.includes('bir') && lowerDtName.includes('bir')) ||
          (lowerKey.includes('receipt') && lowerDtName.includes('receipt')) ||
          (lowerKey.includes('quotation') && lowerDtName.includes('quotation')) ||
          (lowerKey.includes('lease') && lowerDtName.includes('lease')) ||
          (lowerKey.includes('resolution') && lowerDtName.includes('resolution')) ||
          (lowerKey.includes('articles') && lowerDtName.includes('articles')) ||
          (lowerKey.includes('secretary') && lowerDtName.includes('secretary')) ||
          (lowerKey.includes('position') && lowerDtName.includes('position')) ||
          (lowerKey.includes('operation') && lowerDtName.includes('operation')) ||
          (lowerKey.includes('cash') && lowerDtName.includes('cash')) ||
          (lowerKey.includes('equity') && lowerDtName.includes('equity')) ||
          (lowerKey.includes('notes') && lowerDtName.includes('notes')) ||
          (lowerKey.includes('biodata') && lowerDtName.includes('bio-data')) ||
          (lowerKey.includes('government-id') && lowerDtName.includes('government')) ||
          (lowerKey.includes('barangay') && lowerDtName.includes('barangay'))
        )
      })
      if (match) {
        numericId = match.id
      }
    }

    formData.append(`documents[${index}][document_type_id]`, String(numericId))
    formData.append(`documents[${index}][file]`, file)
    index++
  }

  const response = await api.post<SetupProposalSubmitResponse>('/proposal/setup', formData, {
    headers: { 'Content-Type': undefined },
  })
  const result = response.data.data

  const referenceNo = result.proposal.reference_number
  const proposalId = result.proposal.id

  const currentUser = getMockUser()
  const application: ApplicationRecord = {
    applicantName: data.contactPerson || currentUser?.name || 'Proponent User',
    contactEmail: currentUser?.email || data.emailAddress || 'proponent@dost.gov.ph',
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    proposalId,
    organizationName: data.businessName,
    program: 'SETUP',
    projectTitle: data.projectTitle,
    referenceNo,
    status: 'Submitted',
  }

  saveApplication(application)
  try {
    window.localStorage.setItem(`dprms.setup-proposal-snapshot.${referenceNo}`, JSON.stringify(data))
  } catch {
    // ignore
  }
  if (currentUser) {
    setMockUser({ ...currentUser, applicationReference: referenceNo })
  }
  clearSetupDraft()
  return { application, documents: result.documents ?? [] }
}

export function getSetupProposalSnapshot(referenceNo: string): SetupProposalData | null {
  try {
    const item = window.localStorage.getItem(`dprms.setup-proposal-snapshot.${referenceNo}`)
    return item ? (JSON.parse(item) as SetupProposalData) : null
  } catch {
    return null
  }
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
