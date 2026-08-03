import api from '../lib/axios'
import type { GiaProponentCategory } from '../types/giaProposal'
import type { BusinessSize, OrganizationType } from '../types/setupProposal'
import {
  getDocumentTypes,
  ORGANIZATION_TYPE_TO_BUSINESS_TYPE,
  BUSINESS_SIZE_TO_ENTERPRISE_SIZE,
  type DocumentTypeRecord,
} from './setupProposalStore'

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
  return {
    id: String(record.id),
    title: record.name,
    description: record.description ?? '',
    group: (record.group ?? 'Additional Documents') as RequirementGroup,
    instructions: record.instructions ?? undefined,
    required: record.is_required,
    templateUrl: record.template_url ?? undefined,
  }
}

export async function fetchSetupDocumentaryRequirements(
  organizationType?: OrganizationType,
  businessSize?: BusinessSize,
): Promise<DocumentaryRequirement[]> {
  const records = await getDocumentTypes({
    program: 'SETUP',
    businessType: organizationType
      ? ORGANIZATION_TYPE_TO_BUSINESS_TYPE[organizationType as Exclude<OrganizationType, ''>]
      : undefined,
    businessSize: businessSize
      ? BUSINESS_SIZE_TO_ENTERPRISE_SIZE[businessSize as Exclude<BusinessSize, ''>]
      : undefined,
  })
  return records.map(mapDocumentTypeToRequirement)
}

// ---------------------------------------------------------------------------
// SETUP documents: backed by the real /documents API (Document model).
// GIA documents further below are still local-only (localStorage) — out of
// scope for this pass, kept exactly as they were.
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
    uploadedAt: record.created_at,
    verificationStatus: mapDocumentStatus(record.status),
  }
}

interface DocumentIndexResponse {
  data: DocumentApiRecord[]
}

/**
 * Fetches all documents already uploaded for a proposal via
 * GET /proposals/{proposalId}/documents (DocumentController::index),
 * keyed by document_type_id (which is what DocumentaryRequirement.id is
 * for SETUP records — see mapDocumentTypeToRequirement above).
 */
export async function fetchProposalDocuments(
  proposalId: number,
): Promise<Record<string, StoredDocument>> {
  const response = await api.get<DocumentIndexResponse>(`/proposals/${proposalId}/documents`)
  const byRequirement: Record<string, StoredDocument> = {}
  for (const record of response.data.data) {
    byRequirement[String(record.document_type_id)] = documentRecordToStoredDocument(record)
  }
  return byRequirement
}

/**
 * Uploads a document via POST /documents (DocumentController::store).
 *
 * IMPORTANT: `documents` has a unique constraint on (proposal_id,
 * document_type_id), and the backend always INSERTs (there's no upsert
 * route wired). Callers replacing an existing file for the same
 * requirement MUST delete the old document first via deleteDocumentRecord,
 * or this will fail with a DB constraint error.
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

/** Deletes a document via DELETE /documents/{document}. */
export async function deleteDocumentRecord(documentId: number): Promise<void> {
  await api.delete(`/documents/${documentId}`)
}

/**
 * Fetches a document's file as a blob URL for viewing, via
 * GET /documents/{document}/download (DocumentController::show).
 *
 * NOTE: as of this writing, DocumentController::show() checks the file
 * exists but never actually streams it back — it needs a
 * `return Storage::download(...)` added, or this will resolve with an
 * empty/invalid blob. See the accompanying DocumentController.php fix.
 *
 * Uses api.get with responseType 'blob' (rather than a plain <a href>)
 * because the download route requires auth:sanctum — a bare browser
 * navigation wouldn't carry the Bearer token header the axios interceptor
 * attaches.
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
    group: 'Additional Documents',
    required: true,
    templateUrl: '/templates/GIA_Letter_of_Intent_Template.docx',
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

/**
 * GIA-only. SETUP requirements now come from the backend via
 * fetchSetupDocumentaryRequirements() (see documentStore.ts / DocumentTypeController).
 */
export function getDocumentaryRequirements(giaCategory?: GiaProponentCategory) {
  return giaDocumentaryRequirements.filter((requirement) => {
    if (requirement.giaCategories && requirement.giaCategories.length > 0) {
      if (!giaCategory || !requirement.giaCategories.includes(giaCategory as Exclude<GiaProponentCategory, ''>)) {
        return false
      }
    }
    return true
  })
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