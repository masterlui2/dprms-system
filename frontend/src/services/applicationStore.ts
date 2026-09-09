import api from '../lib/axios'
import type { ProposalFormData } from '../types/proposal'
import type {
  ApplicationRecord,
} from '../types/application'
import { getMockUser, setMockUser } from '../lib/mockAuth'

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
  window.localStorage.removeItem(LEGACY_APPLICATIONS_KEY)
}

export function removeApplication(identifier: string) {
  const existing = readApplications().filter(
    (item) => item.id !== identifier && item.referenceNo !== identifier,
  )
  writeApplications(existing)
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
      try {
        const response = await api.get<{ data: BackendProposalRecord[] }>(`/proposal/submitter/${user.id}`)
        proposals = response.data?.data ?? []
      } catch {
        //
      }
    }

    if (proposals.length === 0) {
      try {
        const response = await api.get<{ data: BackendProposalRecord[] }>('/proposal/my-proposals')
        proposals = response.data?.data ?? []
      } catch {
        try {
          const response = await api.get<{ data: BackendProposalRecord[] }>('/proposal/submitter/me')
          proposals = response.data?.data ?? []
        } catch {
          //
        }
      }
    }

    if (!user.id && proposals.length > 0 && proposals[0].submitted_by) {
      user.id = proposals[0].submitted_by
      const currentMock = getMockUser()
      if (currentMock && !currentMock.id) {
        setMockUser({ ...currentMock, id: proposals[0].submitted_by })
      }
    }

    const mappedApps: ApplicationRecord[] = proposals.map((p) => {
      const setupObj = (p as any).setup_proposal?.[0]
      const giaObj = (p as any).gia_proposal?.[0]
      const orgName = setupObj?.business_name || giaObj?.organization_name || `${user.name} Organization`

      return {
        id: String(p.id),
        proposalId: p.id,
        applicantName: user.name,
        contactEmail: user.email,
        organizationName: orgName,
        program: p.program_type,
        projectTitle: p.title,
        referenceNo: p.reference_number,
        remarks: p.remarks,
        status: mapBackendProposalStatus(p.status),
        submittedAt: p.submitted_at || p.created_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }
    })

    const localUserApps = readApplications().filter(
      (app) => app.contactEmail.toLowerCase() === user.email.toLowerCase(),
    )

    if (mappedApps.length > 0) {
      const serverRefs = new Set(mappedApps.map((a) => a.referenceNo))
      const serverIds = new Set(mappedApps.map((a) => a.proposalId).filter(Boolean))
      const serverPrograms = new Set(mappedApps.map((a) => a.program))

      if (!user.applicationReference || !serverRefs.has(user.applicationReference)) {
        user.applicationReference = mappedApps[0].referenceNo
        const currentMock = getMockUser()
        if (currentMock) {
          setMockUser({ ...currentMock, applicationReference: mappedApps[0].referenceNo })
        }
      }

      const localDrafts = localUserApps.filter(
        (app) =>
          app.status === 'Draft Submitted' &&
          !serverPrograms.has(app.program) &&
          !serverRefs.has(app.referenceNo) &&
          (!app.proposalId || !serverIds.has(app.proposalId)),
      )

      const mergedUserApps = [...mappedApps, ...localDrafts]
      const remainingOtherApps = readApplications().filter(
        (app) => app.contactEmail.toLowerCase() !== user.email.toLowerCase(),
      )
      writeApplications([...mergedUserApps, ...remainingOtherApps])

      return mergedUserApps
    } else {
      const localDrafts = localUserApps.filter(
        (app) => app.status === 'Draft Submitted',
      )
      const remainingOtherApps = readApplications().filter(
        (app) => app.contactEmail.toLowerCase() !== user.email.toLowerCase(),
      )
      writeApplications([...localDrafts, ...remainingOtherApps])

      if (
        user.applicationReference &&
        !localDrafts.some((app) => app.referenceNo === user.applicationReference)
      ) {
        delete user.applicationReference
        const currentMock = getMockUser()
        if (currentMock) {
          const updated = { ...currentMock }
          delete updated.applicationReference
          setMockUser(updated)
        }
      }

      return localDrafts
    }
  } catch (error) {
    console.error('Failed to sync applications from backend:', error)
    return readApplications().filter(
      (app) => app.contactEmail.toLowerCase() === user.email.toLowerCase(),
    )
  }
}
