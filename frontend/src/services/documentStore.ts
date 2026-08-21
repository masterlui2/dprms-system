import api from '../lib/axios'
import type { ApplicationProgram } from '../types/application'
import type { GiaProponentCategory } from '../types/giaProposal'
import type { BusinessSize, OrganizationType } from '../types/setupProposal'
import {
  getDocumentTypes,
  ORGANIZATION_TYPE_TO_BUSINESS_TYPE,
  BUSINESS_SIZE_TO_ENTERPRISE_SIZE,
  type DocumentTypeRecord,
} from './setupProposalStore'
import { GIA_CATEGORY_TO_API_CATEGORY } from './giaProposalStore'

export type VerificationStatus =
  | 'Not Uploaded'
  // Local-only: file has been attached in the browser but the proposal
  // hasn't been submitted to the backend yet, so there's nothing to upload
  // to /documents against (no proposal_id exists yet). Cleared once the
  // submit flow uploads it and swaps it for a real StoredDocument.
  | 'Pending Upload'
  | 'Uploaded'
  | 'Under Review'
  | 'Approved'
  | 'Needs Revision'

export interface StoredDocument {
  /**
   * Present only for documents backed by the real /documents API (SETUP).
   * GIA documents are still local-only (localStorage) and won't have this.
   */
  backendId?: number
  dataUrl: string
  fileName: string
  fileSize: number
  fileType: string
  remarks?: string | null
  reviewedAt?: string | null
  uploadedAt: string
  verificationStatus: VerificationStatus
}

export type RequirementGroup =
  | 'Business Documents'
  | 'Corporation / Cooperative Documents'
  | 'Financial Documents'
  | 'Additional Documents'
  | 'GIA Core Documents'

export interface DocumentaryRequirement {
  businessSizes?: Array<Exclude<BusinessSize, ''>>
  description: string
  group: RequirementGroup
  giaCategories?: Array<Exclude<GiaProponentCategory, ''>>
  id: string
  instructions?: string
  organizationTypes?: Array<Exclude<OrganizationType, ''>>
  required: boolean
  templateUrl?: string
  title: string
}

export function mapDocumentTypeToRequirement(record: DocumentTypeRecord): DocumentaryRequirement {
  let templateUrl = record.template_url ?? undefined
  const lowerName = record.name.toLowerCase()
  if (!templateUrl) {
    if (lowerName.includes('letter of intent')) {
      templateUrl = '/templates/SETUP_Letter_of_Intent_Template.docx'
    } else if (lowerName.includes('omnibus')) {
      templateUrl = '/templates/SETUP_Omnibus_Sworn_Statement_Template.docx'
    }
  }

  return {
    id: String(record.id),
    title: record.name,
    description: record.description ?? '',
    group: (record.group ?? 'Additional Documents') as RequirementGroup,
    instructions: record.instructions ?? undefined,
    required: true,
    templateUrl,
  }
}

export const setupDocumentaryRequirements: DocumentaryRequirement[] = [
  {
    id: 'recent-mayors-permit',
    title: "Recent Mayor's Permit",
    description: "Indicating the firm's line of business.",
    group: 'Business Documents',
    instructions: "Upload a clear scanned copy of your valid Mayor's/Business Permit indicating the firm's line of business.",
    required: true,
  },
  {
    id: 'dti-registration-certificate',
    title: 'DTI Registration',
    description: 'DTI registration for sole proprietorship.',
    group: 'Business Documents',
    instructions: 'Upload Department of Trade and Industry (DTI) Certificate of Business Name Registration for sole proprietorship.',
    organizationTypes: ['Sole Proprietorship'],
    required: true,
  },
  {
    id: 'bir-registration',
    title: 'BIR Registration',
    description: 'Bureau of Internal Revenue Certificate of Registration (Form 2303).',
    group: 'Business Documents',
    instructions: 'Upload official BIR Certificate of Registration (Form 2303).',
    required: true,
  },
  {
    id: 'blank-official-receipt',
    title: 'Photocopy of Blank Official Receipt',
    description: 'Provide a clear scanned copy or photo of a blank official receipt.',
    group: 'Business Documents',
    instructions: 'Upload a clear scanned copy or photo of a sample blank official receipt.',
    required: true,
  },
  {
    id: 'three-equipment-quotations',
    title: '3 Valid Equipment Quotations',
    description: 'From 3 different suppliers, originally signed with preference to the lowest bidder.',
    group: 'Business Documents',
    instructions: 'Obtain 3 valid equipment quotations from 3 different suppliers, originally signed with preference to the lowest bidder. Combine into a single PDF.',
    required: true,
  },
  {
    id: 'manufacturing-space-lease',
    title: 'Lease Contract for Rented Manufacturing Space or Equivalent',
    description: 'Lease contract for rented manufacturing space or equivalent.',
    group: 'Business Documents',
    instructions: 'Upload lease contract for rented manufacturing space or equivalent proof of site occupancy.',
    required: true,
  },
  {
    id: 'notarized-board-resolution',
    title: 'Notarized Board Resolution',
    description: 'Authorizing the availment of assistance & designating the approved signatory for the funding assistance.',
    group: 'Corporation / Cooperative Documents',
    instructions: 'Notarized Board Resolution authorizing the availment of assistance & designating the approved signatory for the funding assistance. (Required for Corporations & Cooperatives)',
    organizationTypes: ['Corporation', 'Cooperative'],
    required: true,
  },
  {
    id: 'sec-cda-registration',
    title: 'SEC or CDA Registration',
    description: 'Certificate of SEC Registration (Corporation) or CDA Registration (Cooperative).',
    group: 'Corporation / Cooperative Documents',
    instructions: 'Upload SEC or CDA Registration Certificate. (Required for Corporations & Cooperatives)',
    organizationTypes: ['Corporation', 'Cooperative'],
    required: true,
  },
  {
    id: 'articles-of-incorporation-cooperation',
    title: 'Articles of Incorporation / Cooperation',
    description: 'Official Articles of Incorporation or Articles of Cooperation with By-Laws.',
    group: 'Corporation / Cooperative Documents',
    instructions: 'Upload Articles of Incorporation / Cooperation. (Required for Corporations & Cooperatives)',
    organizationTypes: ['Corporation', 'Cooperative'],
    required: true,
  },
  {
    id: 'secretarys-certificate',
    title: "Secretary's Certificate of Incumbent Officers",
    description: 'Certified list of incumbent corporate or cooperative officers.',
    group: 'Corporation / Cooperative Documents',
    instructions: "Upload Secretary's certificate of incumbent officers. (Required for Corporations & Cooperatives)",
    organizationTypes: ['Corporation', 'Cooperative'],
    required: true,
  },
  {
    id: 'statement-financial-position',
    title: 'Statement of Financial Position',
    description: 'For Small & Medium Enterprises (past 3 years) or Microenterprises (at least 1 year), together with notarized Sworn Statement.',
    group: 'Financial Documents',
    instructions: 'Audited Statement of Financial Position (Balance Sheet) together with notarized Sworn Statement that all information provided are correct and true.',
    required: true,
  },
  {
    id: 'statement-financial-operations',
    title: 'Statement of Financial Operation',
    description: 'For Small & Medium Enterprises (past 3 years) or Microenterprises (at least 1 year), together with notarized Sworn Statement.',
    group: 'Financial Documents',
    instructions: 'Audited Statement of Financial Operation (Income Statement) together with notarized Sworn Statement.',
    required: true,
  },
  {
    id: 'statement-cash-flows',
    title: 'Statement of Financial Cash Flows',
    description: 'For Small & Medium Enterprises (past 3 years) or Microenterprises (at least 1 year), together with notarized Sworn Statement.',
    group: 'Financial Documents',
    instructions: 'Statement of Financial Cash Flows together with notarized Sworn Statement.',
    required: true,
  },
  {
    id: 'statement-owner-equity',
    title: "Statement of Changes in Owner's Equity",
    description: 'For Small & Medium Enterprises (past 3 years) or Microenterprises (at least 1 year), together with notarized Sworn Statement.',
    group: 'Financial Documents',
    instructions: "Statement of Changes in Owner's Equity together with notarized Sworn Statement.",
    required: true,
  },
  {
    id: 'notes-financial-statements',
    title: 'Notes to Financial Statements',
    description: 'For Small & Medium Enterprises (past 3 years) or Microenterprises (at least 1 year), together with notarized Sworn Statement.',
    group: 'Financial Documents',
    instructions: 'Notes to Financial Statements accompanying audited financial statements.',
    required: true,
  },
  {
    id: 'letter-intent-setup',
    title: 'Letter of Intent for SETUP Assistance',
    description: 'Stating commitment to refund the assistance and cover the insurance cost of equipment.',
    group: 'Additional Documents',
    instructions: 'Letter of Intent for SETUP Assistance, stating commitment to refund the assistance and cover the insurance cost of equipment.',
    required: true,
    templateUrl: '/templates/SETUP_Letter_of_Intent_Template.docx',
  },
  {
    id: 'biodata-approved-signatory',
    title: 'Bio-data of the Approved Signatory',
    description: 'Curriculum Vitae / Bio-data of the approved signatory.',
    group: 'Additional Documents',
    instructions: 'Upload Bio-data / CV of the approved signatory.',
    required: true,
  },
  {
    id: 'government-id-approved-signatory',
    title: 'Photocopy of Valid Government-issued ID of the Approved Signatory',
    description: 'Must include 3 specimen signatures.',
    group: 'Additional Documents',
    instructions: 'Photocopy of valid government-issued ID of the approved signatory with 3 specimen signatures.',
    required: true,
  },
  {
    id: 'barangay-residence-certificate',
    title: 'Barangay Certification of Permanent Residence',
    description: 'Barangay certification of permanent residence of the approved signatory.',
    group: 'Additional Documents',
    instructions: 'Upload Barangay certification of permanent residence of the approved signatory.',
    required: true,
  },
  {
    id: 'omnibus-affidavit',
    title: 'Omnibus Sworn Statement / Affidavit',
    description: 'Omnibus affidavit stating: 1) None of its organizers, directors or officials is an agent... 2) No bad debt, 3) No previous accountabilities with DOST, 4) Information in AFR are true & correct, 5) Truthfulness of above stated facts.',
    group: 'Additional Documents',
    instructions: 'Omnibus affidavit stating the following: 1) None of its organizers, directors or officials is an agent..., 2) No bad debt, 3) No previous accountabilities with DOST, 4) Information in AFR are true & correct, 5) Truthfulness of above stated facts.',
    required: true,
    templateUrl: '/templates/SETUP_Omnibus_Sworn_Statement_Template.docx',
  },
]

export function filterSetupDocumentaryRequirements(
  organizationType?: OrganizationType,
  businessSize?: BusinessSize,
): DocumentaryRequirement[] {
  return setupDocumentaryRequirements.filter((requirement) => {
    if (requirement.organizationTypes && requirement.organizationTypes.length > 0) {
      if (
        !organizationType ||
        !requirement.organizationTypes.includes(organizationType as Exclude<OrganizationType, ''>)
      ) {
        return false
      }
    }
    if (requirement.businessSizes && requirement.businessSizes.length > 0) {
      if (
        businessSize &&
        !requirement.businessSizes.includes(businessSize as Exclude<BusinessSize, ''>)
      ) {
        return false
      }
    }
    return true
  })
}

export async function fetchSetupDocumentaryRequirements(
  organizationType?: OrganizationType,
  businessSize?: BusinessSize,
): Promise<DocumentaryRequirement[]> {
  try {
    const records = await getDocumentTypes({
      program: 'SETUP',
      businessType: organizationType
        ? ORGANIZATION_TYPE_TO_BUSINESS_TYPE[organizationType as Exclude<OrganizationType, ''>]
        : undefined,
      businessSize: businessSize
        ? BUSINESS_SIZE_TO_ENTERPRISE_SIZE[businessSize as Exclude<BusinessSize, ''>]
        : undefined,
    })
    if (records && records.length > 0) {
      return records.map(mapDocumentTypeToRequirement)
    }
  } catch (error) {
    console.error('Failed to fetch setup document types from backend:', error)
  }
  return filterSetupDocumentaryRequirements(organizationType, businessSize)
}

// ---------------------------------------------------------------------------
// SETUP documents: backed by the real /documents API (Document model).
// GIA document *types* are now fetched from the same backend endpoint (see
// fetchGiaDocumentaryRequirements below), but the uploaded *files*
// themselves are still local-only (localStorage, via getDocuments /
// saveDocument further down) — GIA has no backend submission flow yet,
// unlike submitSetupProposal() in setupProposalStore.ts.
// ---------------------------------------------------------------------------

export interface DocumentApiRecord {
  id: number
  proposal_id: number
  document_type_id: number
  uploaded_by: number
  reviewed_by: number | null
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  // Backend enum (see documents table migration): no "under review" state
  // exists server-side today, so 'pending' is mapped to 'Uploaded' below —
  // not to 'Under Review', which nothing currently sets.
  status: 'pending' | 'approved' | 'returned_for_revision'
  remarks: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  document_type?: {
    id: number
    name: string
    group?: string | null
    description?: string | null
  }
}

function mapDocumentStatus(status: DocumentApiRecord['status']): VerificationStatus {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'returned_for_revision':
      return 'Needs Revision'
    case 'pending':
    default:
      return 'Uploaded'
  }
}

export function documentRecordToStoredDocument(record: DocumentApiRecord): StoredDocument {
  return {
    backendId: record.id,
    // No local data URL for server-stored files — view goes through
    // fetchDocumentBlobUrl() instead, resolved on demand.
    dataUrl: '',
    fileName: record.file_name,
    fileSize: record.file_size ?? 0,
    fileType: record.mime_type ?? 'application/pdf',
    remarks: record.remarks,
    reviewedAt: record.reviewed_at,
    uploadedAt: record.created_at,
    verificationStatus: mapDocumentStatus(record.status),
  }
}

interface DocumentIndexResponse {
  data: DocumentApiRecord[]
}

/**
 * Fetches all documents already uploaded for a proposal, for the
 * PROPONENT'S OWN view (e.g. resuming a SETUP application to see upload
 * status). Owner-scoped — backed by GET /documents/{proposalId}
 * (DocumentController::indexForOwner), which filters to Auth::id().
 *
 * Was previously calling `/proposals/${proposalId}/documents`, which does
 * not match any registered route (routes are all under `/documents`, not
 * `/proposals`) — fixed to the real route below.
 *
 * NOT for staff/reviewer use — see fetchProposalDocumentsForStaff further
 * down, which hits the unscoped index instead.
 */
export async function fetchProposalDocuments(
  proposalId: number,
): Promise<Record<string, StoredDocument>> {
  const response = await api.get<DocumentIndexResponse>(`/documents/${proposalId}`)
  const byRequirement: Record<string, StoredDocument> = {}
  for (const record of response.data.data) {
    byRequirement[String(record.document_type_id)] = documentRecordToStoredDocument(record)
  }
  return byRequirement
}

/**
 * Uploads a document via POST /documents (DocumentController::store).
 *
 * The backend replaces the existing record when the same proposal and
 * document type are uploaded again, so callers do not need a delete-first
 * workflow.
 *
 * IMPORTANT: the `api` axios instance sets a default
 * 'Content-Type: application/json' header. That has to be explicitly
 * cleared here — otherwise the browser won't attach the multipart
 * boundary for the FormData body, and Laravel will fail to parse the file.
 */
export async function uploadDocument(
  proposalId: number,
  documentTypeId: string,
  file: File,
): Promise<StoredDocument> {
  const formData = new FormData()
  formData.append('proposal_id', String(proposalId))
  formData.append('document_type_id', documentTypeId)
  formData.append('file', file)

  const response = await api.post<{ data: DocumentApiRecord }>('/documents', formData, {
    headers: { 'Content-Type': undefined },
  })
  return documentRecordToStoredDocument(response.data.data)
}

export async function reviewProposalDocument(
  documentId: number,
  status: 'approved' | 'returned_for_revision',
  remarks?: string,
): Promise<DocumentApiRecord> {
  const response = await api.put<{ data: DocumentApiRecord }>(
    `/documents/${documentId}/review`,
    {
      remarks: remarks?.trim() || null,
      status,
    },
  )
  return response.data.data
}

/** Deletes a document via DELETE /documents/{document}. */
export async function deleteDocumentRecord(documentId: number): Promise<void> {
  await api.delete(`/documents/${documentId}`)
}

/**
 * Fetches a document's file as a blob URL, for the PROPONENT'S OWN view,
 * via GET /documents/{document}/download (DocumentController::show).
 * Owner-scoped (uploaded_by === Auth::id()) — correct for a proponent
 * viewing their own submission.
 *
 * NOT for staff/reviewer use — see viewDocumentBlobForStaff further down.
 *
 * Uses api.get with responseType 'blob' (rather than a plain <a href>)
 * because this route requires auth:sanctum with a Bearer token (not
 * cookies — see loginWithBackend() in the auth service), and a bare
 * browser navigation wouldn't carry that header.
 */
export async function fetchDocumentBlobUrl(documentId: number): Promise<string> {
  const response = await api.get(`/documents/${documentId}/download`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(response.data as Blob)
}

export const giaDocumentaryRequirements: DocumentaryRequirement[] = [
  {
    id: 'gia-letter-of-intent',
    title: 'Letter of Intent or for Collaboration duly signed by the Head of IA',
    description: 'Signed by the head of the implementing agency / organization.',
    group: 'GIA Core Documents',
    required: true,
    templateUrl: '/templates/GIA_Letter_of_Intent_Template.docx',
  },
  {
    id: 'gia-project-proposal',
    title: 'Complete Project Proposal Form',
    description: 'Duly accomplished project proposal following the standard DOST format.',
    group: 'GIA Core Documents',
    required: true,
  },
  {
    id: 'gia-eligibility-checklist',
    title: 'Project Leader Eligibility Checklist',
    description: 'Checklist of eligibility requirements for the designated project leader.',
    group: 'GIA Core Documents',
    required: true,
  },
  {
    id: 'gia-workplan',
    title: 'Workplan and Implementation Schedule',
    description: 'Detailed workplan and gantt chart of project activities.',
    group: 'GIA Core Documents',
    required: true,
  },
  {
    id: 'gia-funds-availability',
    title: 'Certificate of Availability of Funds / Counterpart Funding',
    description: 'Proof of available counterpart funds for the proposed project.',
    group: 'GIA Core Documents',
    required: true,
  },
  {
    id: 'gia-private-registration',
    title: 'SEC/CDA/DOLE Registration and Articles of Incorporation/Cooperation with By-Laws',
    description: 'SEC, CDA, or DOLE registration and Articles of Incorporation or Cooperation with By-Laws.',
    group: 'Additional Documents',
    giaCategories: ['Private Sector'],
    required: true,
  },
  {
    id: 'gia-private-financial-statements',
    title: 'Audited Financial Statements for the past three (3) years',
    description: 'Audited financial statements covering the past three (3) years.',
    group: 'Additional Documents',
    giaCategories: ['Private Sector'],
    required: true,
  },
  {
    id: 'gia-private-affidavit',
    title: 'Sworn Affidavit of no relationship',
    description: 'Notarized sworn affidavit declaring no prohibited relationship.',
    group: 'Additional Documents',
    giaCategories: ['Private Sector'],
    required: true,
  },
  {
    id: 'gia-private-secretary-certificate',
    title: "Secretary's Certificate of directors and officers",
    description: 'Certified list of current directors and officers of the organization.',
    group: 'Additional Documents',
    giaCategories: ['Private Sector'],
    required: true,
  },
  {
    id: 'gia-private-board-resolution',
    title: 'Board Resolution for the engagement of the NGO/CSO/PO for the project, assignment of the official representative, and authority to sign related documents and transact with DOST Davao Region',
    description: 'Official Board Resolution authorizing project engagement, official representative, signing authority, and DOST transactions.',
    group: 'Additional Documents',
    giaCategories: ['Private Sector'],
    required: true,
  },
  {
    id: 'gia-hei-ched-accreditation',
    title: 'CHED Accreditation',
    description: 'Current accreditation issued or recognized by the Commission on Higher Education (CHED).',
    group: 'Additional Documents',
    giaCategories: ['Higher Education Institution'],
    required: true,
  },
  {
    id: 'gia-hei-dost-track-record',
    title: 'Certification of Good Track Record with DOST',
    description: 'Certification confirming satisfactory track record and compliance with DOST.',
    group: 'Additional Documents',
    giaCategories: ['Higher Education Institution'],
    required: true,
  },
  {
    id: 'gia-barangay-official-bond',
    title: 'Bond of Barangay Captain and Barangay Treasurer with an amount that can cover the funds to be granted',
    description: 'Official bond of Barangay Captain and Treasurer sufficient to cover granted funds.',
    group: 'Additional Documents',
    giaCategories: ['Barangay LGU'],
    required: true,
  },
  {
    id: 'gia-barangay-project-track-record',
    title: 'Certification or other equivalent documents of previously handled projects through downloaded funds from external sources, preferably government agencies, as applicable',
    description: 'Certification of previously handled projects funded through downloaded external sources.',
    group: 'Additional Documents',
    giaCategories: ['Barangay LGU'],
    required: false,
  },
]

export function getDocumentaryRequirements(
  programOrGiaCategory?: ApplicationProgram | GiaProponentCategory,
  organizationType?: OrganizationType,
  giaCategory?: GiaProponentCategory,
  businessSize?: BusinessSize,
): DocumentaryRequirement[] {
  let program: ApplicationProgram = 'GIA'
  let actualGiaCategory = giaCategory

  if (programOrGiaCategory === 'SETUP' || programOrGiaCategory === 'GIA') {
    program = programOrGiaCategory
  } else if (programOrGiaCategory) {
    actualGiaCategory = programOrGiaCategory as GiaProponentCategory
  }

  if (program === 'SETUP') {
    return filterSetupDocumentaryRequirements(organizationType, businessSize)
  }

  return giaDocumentaryRequirements.filter((requirement) => {
    if (requirement.giaCategories && requirement.giaCategories.length > 0) {
      if (
        !actualGiaCategory ||
        !requirement.giaCategories.includes(actualGiaCategory as Exclude<GiaProponentCategory, ''>)
      ) {
        return false
      }
    }
    return true
  })
}

/**
 * Backend-first counterpart to getDocumentaryRequirements('GIA', ...):
 * fetches GIA document types from GET /document-types
 * (DocumentTypeController::index, set_number=GIA1), same endpoint and
 * pattern fetchSetupDocumentaryRequirements() above uses for SETUP. Falls
 * back to the static giaDocumentaryRequirements list (via
 * getDocumentaryRequirements) if the request fails or the backend has no
 * rows yet, so this is a safe drop-in replacement for callers currently
 * using the local-only list.
 */
export async function fetchGiaDocumentaryRequirements(
  giaCategory?: GiaProponentCategory,
): Promise<DocumentaryRequirement[]> {
  try {
    const records = await getDocumentTypes({
      program: 'GIA',
      giaCategory: giaCategory
        ? GIA_CATEGORY_TO_API_CATEGORY[giaCategory as Exclude<GiaProponentCategory, ''>]
        : undefined,
    })
    if (records && records.length > 0) {
      return records.map(mapDocumentTypeToRequirement)
    }
  } catch (error) {
    console.error('Failed to fetch GIA document types from backend:', error)
  }
  return getDocumentaryRequirements('GIA', undefined, giaCategory)
}

const STORAGE_KEY = 'dprms.documentary-requirements'
type DocumentStore = Record<string, Record<string, StoredDocument>>

function readStore(): DocumentStore {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as DocumentStore
  } catch {
    return {}
  }
}

export function getDocuments(referenceNo: string) {
  return readStore()[referenceNo] ?? {}
}

export function saveDocument(referenceNo: string, requirementId: string, document: StoredDocument) {
  const store = readStore()
  store[referenceNo] = { ...(store[referenceNo] ?? {}), [requirementId]: document }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function deleteDocument(referenceNo: string, requirementId: string) {
  const store = readStore()
  if (!store[referenceNo]) return
  delete store[referenceNo][requirementId]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function fileToStoredDocument(file: File): Promise<StoredDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve({
      dataUrl: String(reader.result),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      verificationStatus: 'Uploaded',
    })
    reader.readAsDataURL(file)
  })
}

// ---------------------------------------------------------------------------
// STAFF / REVIEWER access (ProposalDocumentsSection, ApprovalsPage flow).
// Unlike the proponent-facing functions above, these are NOT owner-scoped:
// the authenticated user reviewing a proposal is never the uploader, so
// the owner-scoped routes (indexForOwner, show, showForOwner) always
// reject them. These call the unscoped index route, and a new staff-only
// view route (see DocumentController::showForStaff — must be added to the
// backend; not yet present as of the routes pasted earlier).
// ---------------------------------------------------------------------------

/**
 * Lists all documents for a proposal, for staff review — no ownership
 * check. Backed by GET /documents/{proposalId}/proposal-documents
 * (DocumentController::index), restricted via role middleware to
 * PROJECT_STAFF/FOCAL/PROVINCIAL_DIRECTOR.
 */
export async function fetchProposalDocumentsForStaff(proposalId: number): Promise<DocumentApiRecord[]> {
  const response = await api.get<DocumentIndexResponse>(`/documents/${proposalId}/proposal-documents`)
  return response.data.data
}

/**
 * Fetches a document's file content as a blob and returns an object URL,
 * for staff review (not the uploading proponent).
 *
 * Backed by the staff-only GET /documents/{document}/view-staff stream.
 *
 * Uses blob fetch + object URL (not a plain <a href>/window.open on the
 * raw URL) for the same Bearer-token reason as fetchDocumentBlobUrl above.
 *
 * Caller is responsible for revoking the returned URL when done, unless
 * intentionally leaving it open in a new tab (see call sites).
 */
export async function viewDocumentBlobForStaff(documentId: number): Promise<string> {
  const response = await api.get(`/documents/${documentId}/view-staff`, {
    responseType: 'blob',
  })
  return URL.createObjectURL(response.data as Blob)
}

/** Uploads or replaces a staff-only internal proposal document. */
export async function uploadInternalDocument(
  proposalId: number,
  documentTypeId: number,
  file: File,
): Promise<DocumentApiRecord> {
  const formData = new FormData()
  formData.append('proposal_id', String(proposalId))
  formData.append('document_type_id', String(documentTypeId))
  formData.append('file', file)

  const response = await api.post<{ data: DocumentApiRecord }>('/documents', formData, {
    headers: { 'Content-Type': undefined },
  })
  return response.data.data
}

/** Loads the server-side SETUP document types hidden from proponents. */
export async function fetchSetupInternalDocumentTypes(): Promise<DocumentTypeRecord[]> {
  return getDocumentTypes({
    program: 'SETUP',
    visibility: 'internal',
  })
}
