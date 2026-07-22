import type { ApplicationRecord } from '../types/application'
import type {
  BusinessRegistrationEntry,
  BusinessRegistrationOffice,
  SetupProposalData,
} from '../types/setupProposal'
import { getApplications, saveApplication } from './applicationStore'
import { businessRegistrationOffices, createEmptyBusinessRegistrations } from '../data/setupProposal'

const DRAFT_KEY = 'dprms.setup-proposal-draft'
const PROPOSALS_KEY = 'dprms.setup-proposal-details'

type ProposalDetails = Record<string, SetupProposalData>

function isBusinessRegistrationOffice(value: string): value is BusinessRegistrationOffice {
  return businessRegistrationOffices.includes(value as BusinessRegistrationOffice)
}

function normalizeBusinessRegistrations(value: unknown): BusinessRegistrationEntry[] {
  const empty = createEmptyBusinessRegistrations()

  if (!Array.isArray(value)) return empty

  if (value.every((item) => typeof item === 'string')) {
    return empty.map((entry) => ({
      ...entry,
      selected: value.includes(entry.office),
    }))
  }

  return empty.map((entry) => {
    const existing = value.find((item) => {
      if (!item || typeof item !== 'object') return false

      const office = (item as { office?: unknown }).office
      return typeof office === 'string' && isBusinessRegistrationOffice(office) && office === entry.office
    }) as Partial<BusinessRegistrationEntry> | undefined

    return {
      ...entry,
      dateOfRegistration: existing?.dateOfRegistration ?? '',
      otherOfficeName: existing?.otherOfficeName ?? '',
      registrationNumber: existing?.registrationNumber ?? '',
      selected: Boolean(existing?.selected),
    }
  })
}

function normalizeSetupProposal(data: SetupProposalData): SetupProposalData {
  return {
    ...data,
    businessRegistrations: normalizeBusinessRegistrations(data.businessRegistrations),
  }
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
    return draft ? normalizeSetupProposal(JSON.parse(draft) as SetupProposalData) : null
  } catch {
    window.localStorage.removeItem(DRAFT_KEY)
    return null
  }
}

export function saveSetupDraft(data: SetupProposalData) {
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(normalizeSetupProposal(data)))
}

export function clearSetupDraft() {
  window.localStorage.removeItem(DRAFT_KEY)
}

export function submitSetupProposal(data: SetupProposalData): ApplicationRecord {
  const normalizedData = normalizeSetupProposal(data)
  const referenceNo = `SETUP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const application: ApplicationRecord = {
    applicantName: normalizedData.contactPerson,
    contactEmail: normalizedData.emailAddress,
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    organizationName: normalizedData.businessName,
    program: 'SETUP',
    projectTitle: normalizedData.projectTitle,
    referenceNo,
    status: 'Draft Submitted',
  }

  saveApplication(application)
  window.localStorage.setItem(
    PROPOSALS_KEY,
    JSON.stringify({ ...readDetails(), [referenceNo]: normalizedData }),
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
