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

export interface DocumentaryRequirement {
  id: string
  title: string
  description: string
  appliesTo?: string
  required: boolean
}

export const documentaryRequirements: DocumentaryRequirement[] = [
  {
    id: 'letter-of-intent',
    title: 'Letter of Intent',
    description: 'Signed letter expressing interest in availing of SETUP assistance.',
    required: true,
  },
  {
    id: 'business-permit',
    title: "Valid Mayor's / Business Permit",
    description: 'Current permit issued by the city or municipality where the enterprise operates.',
    required: true,
  },
  {
    id: 'registration-certificate',
    title: 'Business Registration Certificate',
    description: 'DTI, SEC, or CDA certificate matching the registration selected in the proposal.',
    required: true,
  },
  {
    id: 'bir-registration',
    title: 'BIR Certificate of Registration',
    description: 'Latest BIR Form 2303 or equivalent proof of tax registration.',
    required: true,
  },
  {
    id: 'financial-statements',
    title: 'Financial Statements / Income Tax Return',
    description: 'Latest available financial statement or annual income tax return.',
    required: true,
  },
  {
    id: 'production-photos',
    title: 'Production Area and Product Photos',
    description: 'Clear photos showing the current production area, process, and products.',
    required: true,
  },
  {
    id: 'technology-quotation',
    title: 'Technology or Equipment Quotation',
    description: 'Supplier quotation or technical specification, when already available.',
    required: false,
  },
  {
    id: 'board-resolution',
    title: 'Board Resolution / Authority to Transact',
    description: 'For corporations and cooperatives, where applicable.',
    appliesTo: 'Corporation / Cooperative',
    required: false,
  },
]

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
