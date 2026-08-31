import type { GiaMonitoringDetails, Program, ProjectRecord } from '../data/admin'
import api from '../lib/axios'

interface BackendUser {
  id: number
  name: string
  email: string
}

interface BackendSetupProposal {
  business_name: string
  business_address: string
  city_municipality: string | null
  province: string | null
  form_snapshot: Record<string, unknown> | null
}

interface BackendGiaProposal {
  organization_name: string
  office_address: string
  form_snapshot: Record<string, unknown> | null
}

interface BackendProposal {
  id: number
  reference_number: string
  title: string
  user: BackendUser | null
  assigned_staff: BackendUser | null
  assigned_focal: BackendUser | null
  setup_proposal: BackendSetupProposal[]
  gia_proposal: BackendGiaProposal[]
}

interface BackendProject {
  id: number
  program_type: Program
  status: 'active' | 'completed' | 'terminated' | 'archieved'
  start_date: string | null
  expected_end_date: string | null
  approved_at: string | null
  proposal: BackendProposal
}

interface BackendProjectIndexResponse {
  data: BackendProject[]
}

function snapshotString(snapshot: Record<string, unknown> | null, key: string): string {
  const value = snapshot?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

function formatDate(value: string | null): string {
  if (!value) return 'Not scheduled'

  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function mapStatus(status: BackendProject['status']): ProjectRecord['status'] {
  if (status === 'completed' || status === 'archieved') return 'Completed'
  if (status === 'terminated') return 'At risk'
  return 'Active'
}

function calculateProgress(project: BackendProject): number {
  if (project.status === 'completed' || project.status === 'archieved') return 100
  if (!project.start_date || !project.expected_end_date) return 0

  const start = new Date(`${project.start_date.slice(0, 10)}T00:00:00`).getTime()
  const end = new Date(`${project.expected_end_date.slice(0, 10)}T00:00:00`).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0

  const elapsed = Date.now() - start
  return Math.max(0, Math.min(99, Math.round((elapsed / (end - start)) * 100)))
}

function calculateCompliance(project: BackendProject): ProjectRecord['compliance'] {
  if (!project.expected_end_date || project.status === 'completed' || project.status === 'archieved') {
    return 'Compliant'
  }

  const dueAt = new Date(`${project.expected_end_date.slice(0, 10)}T23:59:59`).getTime()
  const remainingDays = (dueAt - Date.now()) / 86_400_000

  if (remainingDays < 0) return 'Overdue'
  if (remainingDays <= 30) return 'Due soon'
  return 'Compliant'
}

function createGiaDetails(
  project: BackendProject,
  giaProposal: BackendGiaProposal,
): GiaMonitoringDetails {
  const snapshot = giaProposal.form_snapshot
  const startDate = formatDate(project.start_date)
  const endDate = formatDate(project.expected_end_date)

  return {
    actualAccomplishment: '',
    agency: giaProposal.organization_name,
    baseStation: giaProposal.office_address,
    catchUpPlan: '',
    cooperatingAgencies: [],
    durationMonths: 0,
    endDate,
    issueSummary: '',
    latestReport: {
      period: 'No report submitted',
      status: 'Pending',
      submitted: 'Not yet submitted',
    },
    location:
      snapshotString(snapshot, 'siteOfImplementation') || giaProposal.office_address,
    objective: snapshotString(snapshot, 'generalObjective'),
    outputs: [],
    reportingPeriod: 'For monitoring setup',
    startDate,
    suggestedSolution: '',
    targetProgress: 0,
    yearlyBudgets: [],
  }
}

function mapProject(project: BackendProject): ProjectRecord {
  const proposal = project.proposal
  const setupProposal = proposal.setup_proposal[0]
  const giaProposal = proposal.gia_proposal[0]
  const snapshot = setupProposal?.form_snapshot ?? giaProposal?.form_snapshot ?? null
  const enterprise =
    setupProposal?.business_name ||
    giaProposal?.organization_name ||
    proposal.user?.name ||
    'Approved proponent'
  const manager = project.program_type === 'GIA'
    ? snapshotString(snapshot, 'projectLeader') || proposal.user?.name || 'Unassigned'
    : proposal.assigned_focal?.name ||
      proposal.assigned_staff?.name ||
      snapshotString(snapshot, 'contactPerson') ||
      proposal.user?.name ||
      'Unassigned'
  const location =
    (setupProposal
      ? [setupProposal.city_municipality, setupProposal.province].filter(Boolean).join(', ') ||
        setupProposal.business_address
      : giaProposal?.office_address) ||
    'Location not recorded'

  return {
    approvedAt: project.approved_at,
    backendId: project.id,
    budget: 0,
    compliance: calculateCompliance(project),
    dueDate: formatDate(project.expected_end_date),
    enterprise,
    id: proposal.reference_number || `P-${project.id}`,
    location,
    manager,
    program: project.program_type,
    progress: calculateProgress(project),
    referenceNumber: proposal.reference_number,
    status: mapStatus(project.status),
    title: proposal.title,
    used: 0,
    gia:
      project.program_type === 'GIA' && giaProposal
        ? createGiaDetails(project, giaProposal)
        : undefined,
  }
}

export async function fetchActiveProjects(): Promise<ProjectRecord[]> {
  const response = await api.get<BackendProjectIndexResponse>('/v1/projects', {
    params: { status: 'active' },
  })

  return response.data.data.map(mapProject)
}
