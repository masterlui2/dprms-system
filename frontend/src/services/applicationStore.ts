import api from '../lib/axios'
import type { ProposalFormData } from '../types/proposal'
import type {
  ApplicationRecord,
  CreatedProjectRecord,
} from '../types/application'

const APPLICATIONS_KEY = 'dprms.applications'
const LEGACY_APPLICATIONS_KEY = 'dprms.mock-applications'

function readApplications(): ApplicationRecord[] {
  if (typeof window === 'undefined') return []

  const rawApplications =
    window.localStorage.getItem(APPLICATIONS_KEY) ||
    window.localStorage.getItem(LEGACY_APPLICATIONS_KEY)

  if (!rawApplications) return []

  try {
    return JSON.parse(rawApplications) as ApplicationRecord[]
  } catch {
    window.localStorage.removeItem(APPLICATIONS_KEY)
    window.localStorage.removeItem(LEGACY_APPLICATIONS_KEY)
    return []
  }
}

function writeApplications(applications: ApplicationRecord[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))
}

export function saveApplication(application: ApplicationRecord) {
  const existing = readApplications().filter((item) => item.id !== application.id)
  writeApplications([application, ...existing])
}

/**
 * Removes all applications from localStorage.
 * Call this on login so a fresh session never shows another user's data.
 */
export function clearApplications() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(APPLICATIONS_KEY)
}

export function updateApplicationStatus(
  referenceNo: string,
  status: ApplicationRecord['status'],
) {
  const applications = readApplications()
  const application = applications.find((item) => item.referenceNo === referenceNo)
  if (!application) return
  writeApplications(
    applications.map((item) => item.referenceNo === referenceNo ? { ...item, status } : item),
  )
}

function createReferenceNo(program: ApplicationRecord['program']) {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${program}-${new Date().getFullYear()}-${suffix}`
}

export function createApplicationFromProposal(
  proposal: ProposalFormData,
): ApplicationRecord {
  const program = proposal.proposalType === 'GIA' ? 'GIA' : 'SETUP'
  const application: ApplicationRecord = {
    applicantName: proposal.applicantFullName,
    contactEmail: proposal.emailAddress,
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    organizationName: proposal.organizationName,
    program,
    projectTitle: proposal.projectTitle,
    referenceNo: createReferenceNo(program),
    status: 'Submitted',
  }

  writeApplications([application, ...readApplications()])

  return application
}

export function getApplications(): ApplicationRecord[] {
  return readApplications()
}

export function getApplicationByReference(referenceNo: string) {
  return readApplications().find(
    (application) => application.referenceNo === referenceNo,
  )
}

export function getProjects(): CreatedProjectRecord[] {
  return readApplications()
    .filter((application) => application.status === 'Approved')
    .map((application) => ({
      beneficiary: application.organizationName,
      complianceStatus: 'For monitoring setup',
      id: application.referenceNo,
      program: application.program,
      title: application.projectTitle,
    }))
}

export interface BackendProposalRecord {
  id: number
  submitted_by: number
  program_type: 'SETUP' | 'GIA'
  reference_number: string
  remarks: string | null
  title: string
  status: string
  submitted_at?: string
  created_at: string
  updated_at: string
}

function mapBackendProposalStatus(status: string): ApplicationRecord['status'] {
  const normalized = status.toUpperCase()
  if (normalized === 'SUBMITTED' || normalized === 'UNDER_REVIEW') return 'Under review'
  if (normalized === 'UNDER_VALIDATION') return 'In Process'
  if (normalized === 'ENDORSED_TO_DIRECTOR') return 'Executive Approval'
  if (normalized === 'RETURNED' || normalized === 'RETURNED_FOR_REVISION') return 'Returned for Revision'
  if (normalized === 'APPROVED') return 'Approved'
  if (normalized === 'DISAPPROVED') return 'Disapproved'
  return 'Under review'
}

export async function syncUserApplicationsFromBackend(user: {
  id?: number
  name: string
  email: string
  applicationReference?: string
}): Promise<ApplicationRecord[]> {
  if (!user) return readApplications()

  try {
    let proposals: BackendProposalRecord[] = []
    if (user.id) {
      const response = await api.get<{ data: BackendProposalRecord[] }>(`/proposal/submitter/${user.id}`)
      proposals = response.data.data ?? []
    }

    if (proposals.length > 0) {
      const mappedApps: ApplicationRecord[] = proposals.map((p) => ({
        id: String(p.id),
        proposalId: p.id,
        applicantName: user.name,
        contactEmail: user.email,
        organizationName: `${user.name} Organization`,
        program: p.program_type,
        projectTitle: p.title,
        referenceNo: p.reference_number,
        remarks: p.remarks,
        status: mapBackendProposalStatus(p.status),
        submittedAt: p.submitted_at || p.created_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))

      for (const app of mappedApps) {
        saveApplication(app)
      }
      return mappedApps
    }
  } catch (error) {
    console.error('Failed to sync applications from backend:', error)
  }

  return readApplications()
}
