import type { ProposalFormData } from '../types/proposal'
import type {
  ApplicationRecord,
  CreatedProjectRecord,
} from '../types/application'

const APPLICATIONS_KEY = 'dprms.mock-applications'

function readApplications(): ApplicationRecord[] {
  if (typeof window === 'undefined') return []

  const rawApplications = window.localStorage.getItem(APPLICATIONS_KEY)

  if (!rawApplications) return []

  try {
    return JSON.parse(rawApplications) as ApplicationRecord[]
  } catch {
    window.localStorage.removeItem(APPLICATIONS_KEY)
    return []
  }
}

function writeApplications(applications: ApplicationRecord[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))
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
