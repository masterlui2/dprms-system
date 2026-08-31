import api from "../lib/axios"; // ⚠️ adjust path to wherever this axios instance actually lives

export interface ProjectUserRef {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  is_active?: boolean;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SetupProposalFormSnapshot {
  projectTitle?: string;
  businessName?: string;
  businessAddress?: string;
  contactPerson?: string;
  contactNumber?: string;
  emailAddress?: string;
  numberOfEmployees?: string;
  [key: string]: unknown; // snapshot has many optional fields not worth enumerating fully
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
  form_snapshot: SetupProposalFormSnapshot;
}

export interface GiaProposalRecord {
  id: number;
  proposal_id: number;
  agency?: string;
  location?: string;
  reporting_period?: string;
  form_snapshot?: Record<string, unknown>;
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
}

export interface ProjectRecord {
  id: number;
  proposal_id: number;
  created_by: number;
  approved_by: ProjectUserRef;
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

export async function fetchProjects(): Promise<ProjectRecord[]> {
  const { data } = await api.get("/projects"); // ⚠️ adjust to your actual index route
  return (data?.data ?? []) as ProjectRecord[];
}