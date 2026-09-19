/**
 * System: DPRMS
 * Purpose: Describe the current project API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */

export interface ProjectUserRef
{
    id: number;
    name: string;
    email: string;
}

export interface SetupProposalFormSnapshot
{
    projectTitle?: string;
    businessName?: string;
    businessAddress?: string;
    contactPerson?: string;
    contactNumber?: string;
    emailAddress?: string;
    numberOfEmployees?: string;
    [strKey: string]: unknown;
}

export interface SetupProposalRecord
{
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

export interface GiaProposalRecord
{
    id: number;
    proposal_id: number;
    organization_name?: string;
    office_address?: string;
    agency?: string;
    location?: string;
    reporting_period?: string;
    form_snapshot?: Record<string, unknown> | null;
}

export interface ProjectProposalRef
{
    id: number;
    submitted_by: number;
    focal_id: number | null;
    reviewed_by: number | null;
    program_type: 'SETUP' | 'GIA';
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

export interface RawProject
{
    id: number;
    proposal_id: number;
    created_by: number;
    approved_by: ProjectUserRef | null;
    program_type: 'SETUP' | 'GIA';
    status: 'active' | 'completed' | 'terminated' | 'archieved';
    start_date: string | null;
    expected_end_date: string | null;
    actual_end_date: string | null;
    notes: string | null;
    approved_at: string | null;
    budget?: number;
    created_at: string;
    updated_at: string;
    checklist_stats?: {
        complied: number;
        total: number;
        percentage: number;
    };
    proposal: ProjectProposalRef;
    user: ProjectUserRef;
}

export interface RawProjectIndexResponse
{
    data: RawProject[];
}
