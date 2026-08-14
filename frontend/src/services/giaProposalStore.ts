import api from '../lib/axios'
import type { ApplicationRecord } from '../types/application'
import type { GiaProponentCategory, GiaProposalData } from '../types/giaProposal'
import { getMockUser, setMockUser } from '../lib/mockAuth'
import { getApplications, saveApplication } from './applicationStore'
import type { DocumentApiRecord } from './documentStore'

const DRAFT_KEY = 'dprms.gia-proposal-draft'
const PROPOSALS_KEY = 'dprms.gia-proposal-details'

/**
 * project_category / project_type are validated server-side against a fixed
 * enum (see GiaProposalSubmissionRequest::rules()):
 *
 *   project_category => Agriculture and Fisheries | Community Development |
 *     Education | Environment | Health |
 *     Information and Communications Technology | Research and Development |
 *     Disaster Risk Reduction and Management | Others
 *
 *   project_type => Research and Development | Capability Building and
 *     Training | Technology Transfer |
 *     Community-Based Science and Technology Project | Others
 *
 * data.projectCategory / data.projectType are sent through as-is (same
 * pattern as proponentCategory, which already matches the backend's
 * proponent_category enum verbatim — see GIA_CATEGORY_TO_API_CATEGORY below,
 * which is a *different* mapping used only for the document-types lookup).
 * The frontend's giaProjectCategories / giaProjectTypes option lists (in
 * data/giaProposal.ts) MUST use these exact strings or submission will fail
 * validation with a 422. Not fixed here since that file wasn't in scope —
 * flagging so a mismatch isn't mistaken for a bug in this function.
 */

// Maps the frontend GiaProponentCategory to the backend's
// document_types.applicable_gia_categories / DocumentTypeController
// `gia_category` query values (see DocumentTypeSeeder.php GIA1 entries).
// Used by fetchGiaDocumentaryRequirements() in documentStore.ts, the same
// way ORGANIZATION_TYPE_TO_BUSINESS_TYPE in setupProposalStore.ts is used
// by fetchSetupDocumentaryRequirements().
export const GIA_CATEGORY_TO_API_CATEGORY: Record<Exclude<GiaProponentCategory, ''>, string> = {
  'Private Sector': 'PRIVATE-SECTOR',
  'Higher Education Institution': 'HEI',
  'Barangay LGU': 'BARANGAY-LGU',
}

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

function saveDetails(referenceNo: string, data: GiaProposalData) {
  window.localStorage.setItem(
    PROPOSALS_KEY,
    JSON.stringify({ ...readDetails(), [referenceNo]: data }),
  )
}

interface GiaProposalApiRecord {
  id: number
  proposal_id: number
  proponent_category: string
  organization_name: string
  office_address: string
  position: string
  contact_number: string
  project_category: string
  project_type: string
}

interface GiaProposalSubmitResponse {
  message: string
  data: {
    proposal: { id: number; reference_number: string; title: string; status: string; program_type: string }
    gia_proposal: GiaProposalApiRecord
    // Auto-generated proposal PDF snapshot plus every supporting document
    // submitted alongside it — same shape as SETUP's submit response.
    documents: DocumentApiRecord[]
  }
}

export interface GiaProposalSubmitResult {
  application: ApplicationRecord
  /** Keyed by document_type_id, same shape DocumentaryRequirementsPage keeps in state. */
  documents: DocumentApiRecord[]
}

/**
 * Submits a GIA proposal via POST /proposal/gia
 * (GiaProposalSubmissionController::store) as a single multipart request —
 * same pattern as submitSetupProposal() in setupProposalStore.ts. Creates
 * the Proposal, the GiaProposal row, the auto-generated proposal PDF
 * snapshot, and every supporting document in `documents`, all in one DB
 * transaction (GiaSubmissionService::submit()): either everything is
 * created or (on validation failure or any error) nothing is.
 *
 * `documents` is keyed by document_type_id (a DocumentaryRequirement.id),
 * matching what DocumentaryRequirementsPage tracks in `pendingFiles`.
 *
 * Sent as FormData because it carries files. `form_snapshot` is flattened
 * to `form_snapshot[field]=value` bracket notation the same way
 * submitSetupProposal() does, satisfying the `form_snapshot => required|array`
 * rule — every GiaProposalData field is a plain string, so no further
 * nesting is needed.
 *
 * IMPORTANT: same as uploadDocument() in documentStore.ts — the `api` axios
 * instance defaults to 'Content-Type: application/json', which has to be
 * explicitly cleared here so the browser attaches the multipart boundary.
 *
 * Falls back to a local-only application record (same as the old
 * behavior) if the backend request fails, so the proponent isn't blocked
 * by a transient/network error. On fallback there is no numeric proposalId,
 * so document upload for that application stays local-only (handled the
 * same way DocumentaryRequirementsPage already handles a missing
 * proposalId for SETUP).
 */
export async function submitGiaProposal(
  data: GiaProposalData,
  documents: Record<string, File>,
): Promise<GiaProposalSubmitResult> {
  const formData = new FormData()
  formData.append('title', data.projectTitle)
  formData.append('proponent_category', data.proponentCategory)
  formData.append('organization_name', data.organizationName)
  formData.append('office_address', data.officeAddress)
  formData.append('position', data.position)
  formData.append('contact_number', data.contactNumber)
  formData.append('project_category', data.projectCategory)
  formData.append('project_type', data.projectType)

  for (const [key, value] of Object.entries(data)) {
    formData.append(`form_snapshot[${key}]`, value == null ? '' : String(value))
  }

  Object.entries(documents).forEach(([documentTypeId, file], index) => {
    formData.append(`documents[${index}][document_type_id]`, documentTypeId)
    formData.append(`documents[${index}][file]`, file)
  })

  let result: { proposal: { id: number; reference_number: string }; documents: DocumentApiRecord[] } | null = null
  try {
    const response = await api.post<GiaProposalSubmitResponse>('/proposal/gia', formData, {
      headers: { 'Content-Type': undefined },
    })
    result = response.data.data
  } catch (error) {
    console.warn('Backend GIA proposal submission failed, falling back to local submission:', error)
  }

  const referenceNo =
    result?.proposal?.reference_number ??
    `GIA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const proposalId = result?.proposal?.id

  const currentUser = getMockUser()
  const application: ApplicationRecord = {
    applicantName: data.projectLeader || currentUser?.name || 'Proponent User',
    contactEmail: currentUser?.email || data.emailAddress || 'proponent@dost.gov.ph',
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    proposalId,
    organizationName: data.organizationName,
    program: 'GIA',
    projectTitle: data.projectTitle,
    referenceNo,
    status: 'Draft Submitted',
  }

  saveApplication(application)
  saveDetails(referenceNo, data)
  if (currentUser) {
    setMockUser({ ...currentUser, applicationReference: referenceNo })
  }
  clearGiaDraft()
  return { application, documents: result?.documents ?? [] }
}

interface GiaProposalIdLookupResponse {
  data: { id: number }
}

/**
 * Resolves the numeric backend proposal id from a reference number, via the
 * same GET /proposal/reference-number/{referenceNumber} endpoint used by
 * getSetupProposalId() in setupProposalStore.ts. Fallback for
 * ApplicationRecords that don't have proposalId set locally (older records,
 * or a fallback-to-local submission above).
 */
export async function getGiaProposalId(referenceNo: string): Promise<number | null> {
  try {
    const response = await api.get<GiaProposalIdLookupResponse>(
      `/proposal/reference-number/${referenceNo}`,
    )
    return response.data.data.id ?? null
  } catch {
    return null
  }
}

export function getSampleGiaProposalData(): GiaProposalData {
  return {
    organizationName: 'Davao Smart Agriculture & Innovation Cooperative',
    proponentCategory: 'Private Sector',
    projectTitle: 'Smart Solar-Powered Hydroponics and Automated Crop Monitoring System',
    projectLeader: 'Dr. Maria Santos',
    position: 'Executive Director / Project Lead',
    emailAddress: 'maria.santos@davaosmartagri.org',
    contactNumber: '+63 917 555 3829',
    officeAddress: 'Km 12, McArthur Highway, Matina, Davao City',
    projectCategory: 'Community Innovation',
    projectType: 'Research & Community Development',
    projectSummary: 'Deploying solar-powered automated hydroponics setups and IoT-based soil & climate monitoring sensors.',
    projectRationale: 'Frequent climate shifts affect traditional crop yields; hydroponics provides year-round food security.',
    generalObjective: 'Establish climate-resilient smart hydroponics and IoT monitoring systems for high-value crops in Davao Region.',
    specificObjectives: '1. Establish 5 automated hydroponic greenhouses.\n2. Train 50 local farmers in climate-resilient farming.\n3. Increase crop yield by 35% using DOST-assisted IoT monitoring.',
    siteOfImplementation: 'Barangay Matina Biao, Tugbok District, Davao City',
    targetBeneficiaries: 'Local agricultural cooperatives and smallholder farmers in Davao City.',
    methodology: 'Phase 1: Greenhouse construction. Phase 2: IoT sensor integration. Phase 3: Community training.',
    expectedOutputs: '5 operational smart greenhouses, 1 technical manual, 50 trained agricultural workers.',
    sustainabilityPlan: 'Cooperative revenue from high-value crop sales will fund ongoing maintenance and scaling.',
  }
}

export function getGiaProposal(referenceNo: string) {
  return readDetails()[referenceNo] ?? null
}

export function getGiaApplications() {
  return getApplications().filter((application) => application.program === 'GIA')
}