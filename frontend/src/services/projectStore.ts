import api from "../lib/axios";

// ── Raw backend shapes (what the API actually returns) ────────────────────

export interface ProjectUserRef {
  id: number;
  name: string;
  email: string;
}

export interface SetupProposalFormSnapshot {
  projectTitle?: string;
  businessName?: string;
  businessAddress?: string;
  contactPerson?: string;
  contactNumber?: string;
  emailAddress?: string;
  numberOfEmployees?: string;
  [key: string]: unknown;
}

export interface SetupProposalRecord {
  id: number;
  proposal_id: number;
  business_name: string;
  business_type: string;
  industry_sector: string;
  enterprise_size: string;
  years_in_operation: number;
  business_address: string;
  region: string;
  province: string;
  city_municipality: string;
  form_snapshot: SetupProposalFormSnapshot | null;
}

// ⚠️ NEEDS VERIFICATION against the actual gia_proposals migration/model —
// live-monitoring's version used organization_name/office_address instead of
// agency/location. Confirm which is correct before relying on this in prod.
export interface GiaProposalRecord {
  id: number;
  proposal_id: number;
  organization_name?: string;
  office_address?: string;
  agency?: string;
  location?: string;
  reporting_period?: string;
  form_snapshot?: Record<string, unknown> | null;
}

export interface ProjectProposalRef {
  id: number;
  submitted_by: number;
  focal_id: number | null;
  reviewed_by: number | null;
  program_type: "SETUP" | "GIA";
  reference_number: string;
  title: string;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  disapproved_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  setup_proposal?: SetupProposalRecord[];
  gia_proposal?: GiaProposalRecord[];
  // ⚠️ These are only populated if the backend eager-loads the relations
  // (`->with(['user', 'assignedStaff', 'assignedFocal'])` or similar) on
  // top of the raw submitted_by/focal_id IDs. Confirm the index endpoint
  // actually returns these before relying on assignedFocal?.name below.
  user?: ProjectUserRef | null;
  assigned_staff?: ProjectUserRef | null;
  assigned_focal?: ProjectUserRef | null;
}

export interface RawProject {
  id: number;
  proposal_id: number;
  created_by: number;
  approved_by: ProjectUserRef | null;
  program_type: "SETUP" | "GIA";
  status: "active" | "completed" | "terminated" | "archieved";
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  notes: string | null;
  approved_at: string | null;
  budget?: number;
  created_at: string;
  updated_at: string;
  proposal: ProjectProposalRef;
  user: ProjectUserRef;
}

interface RawProjectIndexResponse {
  data: RawProject[];
}

// ── UI-facing shapes (what the component actually renders) ────────────────

export type Program = "SETUP" | "GIA";

export interface GiaMonitoringDetails {
  actualAccomplishment: string;
  agency: string;
  baseStation: string;
  catchUpPlan: string;
  cooperatingAgencies: string[];
  durationMonths: number;
  endDate: string;
  issueSummary: string;
  latestReport: { period: string; status: string; submitted: string };
  location: string;
  objective: string;
  outputs: string[];
  reportingPeriod: string;
  startDate: string;
  suggestedSolution: string;
  targetProgress: number;
  yearlyBudgets: unknown[];
}

export interface ProjectRecord {
  backendId: number;
  id: string;
  referenceNumber: string;
  title: string;
  enterprise: string;
  location: string;
  manager: string;
  program: Program;
  status: "Active" | "Completed" | "At risk";
  compliance: "Compliant" | "Due soon" | "Overdue";
  progress: number;
  dueDate: string;
  approvedAt: string | null;
  budget: number;
  used: number;
  monitored?: boolean;
  monitoringStatus?: string;
  lastMonitoredAt?: string | null;
  pendingReports?: number;
  // filter helper fields
  district: string;
  agency: string;
  gia?: GiaMonitoringDetails;
}

function snapshotString(snapshot: Record<string, unknown> | null | undefined, key: string): string {
  const value = snapshot?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value: string | null): string {
  if (!value) return "Not scheduled";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" });
}

function mapStatus(status: RawProject["status"]): ProjectRecord["status"] {
  if (status === "completed" || status === "archieved") return "Completed";
  if (status === "terminated") return "At risk";
  return "Active";
}

function calculateProgress(project: RawProject): number {
  if (project.status === "completed" || project.status === "archieved") return 100;
  if (!project.start_date || !project.expected_end_date) return 0;

  const start = new Date(`${project.start_date.slice(0, 10)}T00:00:00`).getTime();
  const end = new Date(`${project.expected_end_date.slice(0, 10)}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;

  const elapsed = Date.now() - start;
  return Math.max(0, Math.min(99, Math.round((elapsed / (end - start)) * 100)));
}

function calculateCompliance(project: RawProject): ProjectRecord["compliance"] {
  if (!project.expected_end_date || project.status === "completed" || project.status === "archieved") {
    return "Compliant";
  }
  const dueAt = new Date(`${project.expected_end_date.slice(0, 10)}T23:59:59`).getTime();
  const remainingDays = (dueAt - Date.now()) / 86_400_000;
  if (remainingDays < 0) return "Overdue";
  if (remainingDays <= 30) return "Due soon";
  return "Compliant";
}

function createGiaDetails(project: RawProject, gia: GiaProposalRecord): GiaMonitoringDetails {
  const snapshot = gia.form_snapshot;
  const agency = gia.organization_name || gia.agency || "Unspecified agency";
  const baseStation = gia.office_address || gia.location || "";

  return {
    actualAccomplishment: "",
    agency,
    baseStation,
    catchUpPlan: "",
    cooperatingAgencies: [],
    durationMonths: 0,
    endDate: formatDate(project.expected_end_date),
    issueSummary: "",
    latestReport: { period: "No report submitted", status: "Pending", submitted: "Not yet submitted" },
    location: snapshotString(snapshot, "siteOfImplementation") || baseStation,
    objective: snapshotString(snapshot, "generalObjective"),
    outputs: [],
    reportingPeriod: gia.reporting_period || "For monitoring setup",
    startDate: formatDate(project.start_date),
    suggestedSolution: "",
    targetProgress: 0,
    yearlyBudgets: [],
  };
}

function mapProject(project: RawProject): ProjectRecord {
  const proposal = project.proposal;
  const setup = proposal.setup_proposal?.[0];
  const gia = proposal.gia_proposal?.[0];
  const snapshot = setup?.form_snapshot ?? gia?.form_snapshot ?? null;

  const enterprise =
    setup?.business_name || gia?.organization_name || gia?.agency || project.user?.name || "Approved proponent";

  const manager =
    project.program_type === "GIA"
      ? snapshotString(snapshot, "projectLeader") || project.user?.name || "Unassigned"
      : proposal.assigned_focal?.name ||
        proposal.assigned_staff?.name ||
        snapshotString(snapshot, "contactPerson") ||
        project.user?.name ||
        "Unassigned";

  const location =
    (setup
      ? [setup.city_municipality, setup.province].filter(Boolean).join(", ") || setup.business_address
      : gia?.office_address || gia?.location) || "Location not recorded";

  const district = setup?.city_municipality || setup?.province || "";

  return {
    backendId: project.id,
    id: proposal.reference_number || `P-${project.id}`,
    referenceNumber: proposal.reference_number,
    title: proposal.title,
    enterprise,
    location,
    manager,
    program: project.program_type,
    status: mapStatus(project.status),
    compliance: calculateCompliance(project),
    progress: calculateProgress(project),
    dueDate: formatDate(project.expected_end_date),
    approvedAt: project.approved_at,
    budget: project.budget ?? 0,
    used: 0,
    lastMonitoredAt: project.approved_at,
    district,
    agency: gia?.organization_name || gia?.agency || "",
    gia: project.program_type === "GIA" && gia ? createGiaDetails(project, gia) : undefined,
  };
}

export async function fetchProjects(): Promise<ProjectRecord[]> {
  const { data } = await api.get<RawProjectIndexResponse>("/v1/projects", {
    params: { status: "active" },
  });
  return (data?.data ?? []).map(mapProject);
}