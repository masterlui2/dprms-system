import type { ApplicationProgram } from '../types/application'
import type { GiaProponentCategory } from '../types/giaProposal'
import type { OrganizationType } from '../types/setupProposal'

export type VerificationStatus =
  | 'Not Uploaded'
  | 'Uploaded'
  | 'Under Review'
  | 'Approved'
  | 'Needs Revision'

export interface StoredDocument {
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
  | 'Category-specific Documents'

export interface DocumentaryRequirement {
  description: string
  group: RequirementGroup
  giaCategories?: Array<Exclude<GiaProponentCategory, ''>>
  id: string
  organizationTypes?: Array<Exclude<OrganizationType, ''>>
  required: boolean
  title: string
}

export const setupDocumentaryRequirements: DocumentaryRequirement[] = [
  {
    id: 'recent-mayors-permit',
    title: "Recent Mayor's Permit",
    description: "The permit must indicate the firm's current line of business.",
    group: 'Business Documents',
    required: true,
  },
  {
    id: 'dti-registration-certificate',
    title: 'DTI Registration Certificate',
    description: 'Certificate of Business Name Registration issued by DTI.',
    group: 'Business Documents',
    organizationTypes: ['Sole Proprietorship'],
    required: true,
  },
  {
    id: 'sec-registration-certificate',
    title: 'SEC Registration Certificate',
    description: 'Certificate of Registration issued by SEC.',
    group: 'Business Documents',
    organizationTypes: ['Partnership', 'Corporation'],
    required: true,
  },
  {
    id: 'bir-registration',
    title: 'BIR Registration',
    description: 'Upload the latest BIR Certificate of Registration.',
    group: 'Business Documents',
    required: true,
  },
  {
    id: 'blank-official-receipt',
    title: 'Photocopy of Blank Official Receipt',
    description: 'Provide a clear scanned copy or photo of a blank official receipt.',
    group: 'Business Documents',
    required: true,
  },
  {
    id: 'three-equipment-quotations',
    title: 'Three (3) Valid Equipment Quotations',
    description: 'Combine quotations from three different suppliers in one PDF before uploading.',
    group: 'Business Documents',
    required: true,
  },
  {
    id: 'manufacturing-space-lease',
    title: 'Lease Contract for Rented Manufacturing Space',
    description: 'Upload only when the manufacturing space is rented.',
    group: 'Business Documents',
    required: false,
  },
  {
    id: 'notarized-board-resolution',
    title: 'Notarized Board Resolution',
    description: 'Board authority approving the SETUP application and its approved signatory.',
    group: 'Corporation / Cooperative Documents',
    organizationTypes: ['Corporation', 'Cooperative'],
    required: true,
  },
  {
    id: 'articles-of-incorporation-cooperation',
    title: 'Articles of Incorporation / Cooperation',
    description: 'Upload the organization articles filed with the appropriate registration office.',
    group: 'Corporation / Cooperative Documents',
    organizationTypes: ['Corporation', 'Cooperative'],
    required: true,
  },
  {
    id: 'secretarys-certificate',
    title: "Secretary's Certificate of Incumbent Officers",
    description: 'Provide the current list of officers certified by the corporate secretary.',
    group: 'Corporation / Cooperative Documents',
    organizationTypes: ['Corporation', 'Cooperative'],
    required: true,
  },
  {
    id: 'statement-financial-position',
    title: 'Statement of Financial Position',
    description: 'Upload the latest available statement.',
    group: 'Financial Documents',
    required: true,
  },
  {
    id: 'statement-financial-operations',
    title: 'Statement of Financial Operations',
    description: 'Upload the latest available statement.',
    group: 'Financial Documents',
    required: true,
  },
  {
    id: 'statement-cash-flows',
    title: 'Statement of Cash Flows',
    description: 'Upload the latest available statement.',
    group: 'Financial Documents',
    required: true,
  },
  {
    id: 'statement-owner-equity',
    title: "Statement of Changes in Owner's Equity",
    description: 'Upload the latest available statement.',
    group: 'Financial Documents',
    required: true,
  },
  {
    id: 'notes-financial-statements',
    title: 'Notes to Financial Statements',
    description: 'Upload the notes that accompany the submitted financial statements.',
    group: 'Financial Documents',
    required: true,
  },
  {
    id: 'letter-intent-setup',
    title: 'Letter of Intent for SETUP Assistance',
    description: 'Signed letter expressing intent to avail of SETUP assistance.',
    group: 'Additional Documents',
    required: true,
  },
  {
    id: 'biodata-approved-signatory',
    title: 'Bio-data of the Approved Signatory',
    description: 'Provide the current bio-data of the person authorized to sign for the enterprise.',
    group: 'Additional Documents',
    required: true,
  },
  {
    id: 'government-id-approved-signatory',
    title: 'Valid Government-issued ID of the Approved Signatory',
    description: 'The uploaded copy must include three specimen signatures.',
    group: 'Additional Documents',
    required: true,
  },
  {
    id: 'barangay-residence-certificate',
    title: 'Barangay Certificate of Permanent Residence',
    description: 'Certificate of permanent residence of the approved signatory.',
    group: 'Additional Documents',
    required: true,
  },
]

export const giaDocumentaryRequirements: DocumentaryRequirement[] = [
  {
    id: 'gia-letter-of-intent',
    title: 'Letter of Intent / Collaboration',
    description: 'Signed by the head of the implementing organization.',
    group: 'GIA Core Documents',
    required: true,
  },
  {
    id: 'gia-project-leader-eligibility',
    title: 'Project Leader Eligibility Checklist',
    description: 'Accomplished eligibility checklist for the designated project leader.',
    group: 'GIA Core Documents',
    required: true,
  },
  {
    id: 'gia-workplan',
    title: 'Workplan and Implementation Schedule',
    description: 'Detailed activities, responsibilities, and implementation schedule.',
    group: 'GIA Core Documents',
    required: true,
  },
  {
    id: 'gia-funds-availability',
    title: 'Certificate of Funds Availability',
    description: 'Certification of available counterpart or project funds.',
    group: 'GIA Core Documents',
    required: true,
  },
  {
    id: 'gia-private-registration',
    title: 'SEC / CDA / DOLE Registration and Organizational Documents',
    description: 'SEC, CDA, or DOLE registration and Articles of Incorporation or Cooperation with By-Laws.',
    group: 'Category-specific Documents',
    giaCategories: ['Private Sector'],
    required: true,
  },
  {
    id: 'gia-private-financial-statements',
    title: 'Audited Financial Statements',
    description: 'Audited financial statements for the past three years.',
    group: 'Category-specific Documents',
    giaCategories: ['Private Sector'],
    required: true,
  },
  {
    id: 'gia-private-affidavit',
    title: 'Sworn Affidavit of No Relationship',
    description: 'Notarized declaration of no prohibited relationship.',
    group: 'Category-specific Documents',
    giaCategories: ['Private Sector'],
    required: true,
  },
  {
    id: 'gia-private-secretary-certificate',
    title: "Secretary's Certificate of Directors and Officers",
    description: 'Current certificate listing the organization directors and officers.',
    group: 'Category-specific Documents',
    giaCategories: ['Private Sector'],
    required: true,
  },
  {
    id: 'gia-private-board-resolution',
    title: 'Board Resolution',
    description: 'Authority for project engagement, official representation, document signing, and transactions with DOST Davao Region.',
    group: 'Category-specific Documents',
    giaCategories: ['Private Sector'],
    required: true,
  },
  {
    id: 'gia-hei-ched-accreditation',
    title: 'CHED Accreditation',
    description: 'Current accreditation issued or recognized by CHED.',
    group: 'Category-specific Documents',
    giaCategories: ['Higher Education Institution'],
    required: true,
  },
  {
    id: 'gia-hei-dost-track-record',
    title: 'Certification of Good Track Record with DOST',
    description: 'Certification confirming satisfactory previous engagement with DOST.',
    group: 'Category-specific Documents',
    giaCategories: ['Higher Education Institution'],
    required: true,
  },
  {
    id: 'gia-barangay-official-bond',
    title: 'Bond of the Barangay Captain and Barangay Treasurer',
    description: 'Bond amount must be sufficient to cover the funds to be granted.',
    group: 'Category-specific Documents',
    giaCategories: ['Barangay LGU'],
    required: true,
  },
  {
    id: 'gia-barangay-project-track-record',
    title: 'Certification of Previously Handled Projects',
    description: 'Certification or equivalent proof of projects handled through downloaded or external funds, preferably from government agencies, when applicable.',
    group: 'Category-specific Documents',
    giaCategories: ['Barangay LGU'],
    required: false,
  },
]

export function getDocumentaryRequirements(
  program: ApplicationProgram,
  organizationType?: OrganizationType,
  giaCategory?: GiaProponentCategory,
) {
  const requirements = program === 'SETUP'
    ? setupDocumentaryRequirements
    : giaDocumentaryRequirements

  return requirements.filter((requirement) => {
    const matchesOrganization = !requirement.organizationTypes
      || (organizationType ? requirement.organizationTypes.includes(
        organizationType as Exclude<OrganizationType, ''>,
      ) : false)
    const matchesGiaCategory = !requirement.giaCategories
      || (giaCategory ? requirement.giaCategories.includes(
        giaCategory as Exclude<GiaProponentCategory, ''>,
      ) : false)

    return matchesOrganization && matchesGiaCategory
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
