import type { ApplicationProgram } from '../types/application'
import type { GiaProponentCategory } from '../types/giaProposal'
import type { BusinessSize, OrganizationType } from '../types/setupProposal'

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
    description: 'Required if manufacturing space is rented.',
    group: 'Business Documents',
    instructions: 'Lease contract for rented manufacturing space or equivalent (if space is rented).',
    required: false,
  },

  /* For Corporations / Cooperatives */
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
    description: 'Certificate of SEC Registration (Corporation/Partnership) or CDA Registration (Cooperative).',
    group: 'Corporation / Cooperative Documents',
    instructions: 'Upload SEC or CDA Registration Certificate. (Required for Corporations & Cooperatives)',
    organizationTypes: ['Corporation', 'Cooperative', 'Partnership'],
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

  /* Financial Statements */
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

  /* Additional Documents / SET 2 */
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
]

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

export function getDocumentaryRequirements(
  program: ApplicationProgram,
  organizationType?: OrganizationType,
  giaCategory?: GiaProponentCategory,
  businessSize?: BusinessSize,
) {
  const requirements = program === 'SETUP'
    ? setupDocumentaryRequirements
    : giaDocumentaryRequirements

  return requirements.filter((requirement) => {
    if (requirement.organizationTypes && requirement.organizationTypes.length > 0) {
      if (!organizationType || !requirement.organizationTypes.includes(organizationType as Exclude<OrganizationType, ''>)) {
        return false
      }
    }
    if (requirement.giaCategories && requirement.giaCategories.length > 0) {
      if (!giaCategory || !requirement.giaCategories.includes(giaCategory as Exclude<GiaProponentCategory, ''>)) {
        return false
      }
    }
    if (requirement.businessSizes && requirement.businessSizes.length > 0) {
      if (businessSize && !requirement.businessSizes.includes(businessSize as Exclude<BusinessSize, ''>)) {
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
