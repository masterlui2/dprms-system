import type { ProposalFormData } from '../types/proposal'
import type {
  ApplicationRecord,
  CreatedProjectRecord,
} from '../types/application'
import { sampleSetupApplication } from '../data/sampleSetupProposal'

const APPLICATIONS_KEY = 'dprms.mock-applications'

function readApplications(): ApplicationRecord[] {
  if (typeof window === 'undefined') return []

  const rawApplications = window.localStorage.getItem(APPLICATIONS_KEY)

  if (!rawApplications) return [sampleSetupApplication]

  try {
    const applications = JSON.parse(rawApplications) as ApplicationRecord[]
    return applications.some((application) => application.id === sampleSetupApplication.id)
      ? applications
      : [...applications, sampleSetupApplication]
  } catch {
    window.localStorage.removeItem(APPLICATIONS_KEY)
    return [sampleSetupApplication]
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

export function updateApplicationStatus(
  referenceNo: string,
  status: ApplicationRecord['status'],
) {
  const applications = readApplications()
  const application = applications.find((item) => item.referenceNo === referenceNo)
  if (!application || application.status === 'Approved' || application.status === 'Returned for Revision') return
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
