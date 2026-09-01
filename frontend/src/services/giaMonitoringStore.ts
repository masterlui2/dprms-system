import type {
  GiaMonitoringDetails,
  GiaOutputCategory,
  ProjectRecord,
} from '../data/admin'
import api from '../lib/axios'
import type { ProjectPagination } from '../types/monitoring'

export interface GiaMonitoringStatistics {
  activeGrants: number
  monitoredProjects: number
  totalGrantAmount: number
  averageMilestoneProgress: number
  pendingMilestones: number
  delayedMilestones: number
}

export interface GiaMonitoringProjectFilters {
  search?: string
  agency?: string
  status?: string
  year: number
  semester: 1 | 2
  page?: number
}

export interface GiaMonitoringProjectsResult {
  projects: ProjectRecord[]
  statistics: GiaMonitoringStatistics
  agencies: string[]
  statuses: string[]
  pagination: ProjectPagination
  canEdit: boolean
  readOnly: boolean
}

interface BackendGiaMilestone {
  id: number
  number: number
  title: string
  description: string | null
  status: string
  completion_percentage: number
  expected_completion: string | null
  actual_completion: string | null
}

interface BackendGiaMonitoringProject {
  id: number
  reference_number: string
  title: string
  implementing_agency: string
  project_leader: string
  office_address: string | null
  approved_at: string | null
  start_date: string | null
  expected_end_date: string | null
  grant_amount: number
  currency: string
  monitoring_status: string
  last_monitored_at: string | null
  milestone_progress: number
  milestones: BackendGiaMilestone[]
  latest_report: {
    status: string
    reporting_period: string
    year: number
    submitted_at: string | null
    due_date: string | null
  } | null
  semestral_context: {
    year: number
    semester: 1 | 2
  }
}

interface BackendGiaMonitoringResponse {
  access: {
    can_edit: boolean
    read_only: boolean
  }
  statistics: {
    active_grants: number
    monitored_projects: number
    total_grant_amount: number
    average_milestone_progress: number
    pending_milestones: number
    delayed_milestones: number
  }
  filters: {
    agencies: string[]
    statuses: string[]
  }
  data: BackendGiaMonitoringProject[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

const OUTPUT_CATEGORIES: GiaOutputCategory[] = [
  'Publications',
  'Patents / IP',
  'Products',
  'People Services',
  'Places & Partnerships',
  'Policy',
]

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function durationMonths(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00`)
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0

  return Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth(),
  )
}

function reportStatus(status?: string): GiaMonitoringDetails['latestReport']['status'] {
  if (status === 'ACCEPTED') return 'Approved'
  if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') return 'Under review'
  return 'Pending'
}

function mapProject(project: BackendGiaMonitoringProject): ProjectRecord {
  const delayed = project.milestones.some((milestone) => milestone.status === 'DELAYED')
  const pending = project.milestones.some((milestone) =>
    ['PENDING', 'IN_PROGRESS'].includes(milestone.status),
  )
  const semester = project.semestral_context.semester === 1 ? '1st' : '2nd'

  return {
    approvedAt: project.approved_at,
    backendId: project.id,
    budget: project.grant_amount,
    compliance: delayed ? 'Overdue' : pending ? 'Due soon' : 'Compliant',
    dueDate: formatDate(project.latest_report?.due_date ?? project.expected_end_date),
    enterprise: project.implementing_agency,
    id: String(project.id),
    lastMonitoredAt: project.last_monitored_at,
    location: project.office_address ?? 'Location not recorded',
    manager: project.project_leader,
    monitored: project.last_monitored_at !== null,
    monitoringStatus: project.monitoring_status,
    pendingReports: 0,
    program: 'GIA',
    progress: Math.max(0, Math.min(100, Math.round(project.milestone_progress))),
    referenceNumber: project.reference_number,
    status: project.monitoring_status === 'TERMINATED' ? 'At risk' : 'Active',
    title: project.title,
    used: 0,
    gia: {
      actualAccomplishment: `${project.milestone_progress}% milestone completion`,
      agency: project.implementing_agency,
      baseStation: project.office_address ?? '',
      catchUpPlan: '',
      cooperatingAgencies: [],
      durationMonths: durationMonths(project.start_date, project.expected_end_date),
      endDate: formatDate(project.expected_end_date),
      issueSummary: delayed ? 'One or more milestones are delayed.' : '',
      latestReport: {
        period: project.latest_report?.reporting_period ?? `${semester} Semester ${project.semestral_context.year}`,
        status: reportStatus(project.latest_report?.status),
        submitted: project.latest_report?.submitted_at
          ? formatDate(project.latest_report.submitted_at)
          : 'Not yet submitted',
      },
      location: project.office_address ?? '',
      objective: project.title,
      outputs: project.milestones.map((milestone, index) => ({
        actual: milestone.completion_percentage,
        category: OUTPUT_CATEGORIES[Math.min(index, OUTPUT_CATEGORIES.length - 1)],
        description: milestone.title,
        target: 100,
      })),
      milestones: project.milestones.map((milestone) => ({
        completionPercentage: milestone.completion_percentage,
        description: milestone.description ?? '',
        expectedCompletion: milestone.expected_completion,
        id: milestone.id,
        number: milestone.number,
        status: milestone.status,
        title: milestone.title,
      })),
      reportingPeriod: project.latest_report?.reporting_period ?? `${semester} Semester ${project.semestral_context.year}`,
      startDate: formatDate(project.start_date),
      suggestedSolution: '',
      targetProgress: 100,
      yearlyBudgets: project.grant_amount > 0
        ? [{ amount: project.grant_amount, label: String(project.semestral_context.year) }]
        : [],
    },
  }
}

export async function fetchGiaMonitoringProjects(
  filters: GiaMonitoringProjectFilters,
): Promise<GiaMonitoringProjectsResult> {
  const response = await api.get<BackendGiaMonitoringResponse>('/gia/monitoring/projects', {
    params: {
      search: filters.search?.trim() || undefined,
      agency: filters.agency || undefined,
      status: filters.status || undefined,
      year: filters.year,
      semester: filters.semester,
      page: filters.page ?? 1,
    },
  })

  return {
    projects: response.data.data.map(mapProject),
    statistics: {
      activeGrants: response.data.statistics.active_grants,
      monitoredProjects: response.data.statistics.monitored_projects,
      totalGrantAmount: response.data.statistics.total_grant_amount,
      averageMilestoneProgress: response.data.statistics.average_milestone_progress,
      pendingMilestones: response.data.statistics.pending_milestones,
      delayedMilestones: response.data.statistics.delayed_milestones,
    },
    agencies: response.data.filters.agencies,
    statuses: response.data.filters.statuses,
    pagination: {
      currentPage: response.data.pagination.current_page,
      lastPage: response.data.pagination.last_page,
      perPage: response.data.pagination.per_page,
      total: response.data.pagination.total,
      from: response.data.pagination.from,
      to: response.data.pagination.to,
    },
    canEdit: response.data.access.can_edit,
    readOnly: response.data.access.read_only,
  }
}
