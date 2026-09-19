/**
 * System: DPRMS
 * Purpose: Describe the current proposal API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ApplicationProgram } from '../application';

export interface ProposalUserApiRecord
{
    id: number;
    name: string;
    email: string;
}

export interface SetupProposalApiRecord
{
    id: number;
    proposal_id: number;
    business_name: string;
    business_type: string;
    industry_sector: string;
    enterprise_size: string;
    years_in_operation: number;
    business_address: string;
    region: string | null;
    province: string | null;
    city_municipality: string | null;
    form_snapshot: Record<string, unknown> | null;
}

export interface GiaProposalApiRecord
{
    id: number;
    proposal_id: number;
    proponent_category: string;
    organization_name: string;
    office_address: string;
    position: string;
    contact_number: string;
    // NOTE: index endpoint uses research_type/research_category, NOT
    // project_type/project_category like submitGiaProposal() assumes.
    // Flagging — these two endpoints disagree on field names; verify
    // against the GiaProposal migration/model before relying on either.
    research_type: string;
    research_category: string;
}

export interface ProposalIndexApiRecord
{
    id: number;
    submitted_by: number;
    focal_id: number | null;
    reviewed_by: number | null;
    program_type: ApplicationProgram;
    reference_number: string;
    title: string;
    status: string;
    submitted_at: string | null;
    approved_at: string | null;
    disapproved_at: string | null;
    remarks: string | null;
    created_at: string;
    updated_at: string;
    user: ProposalUserApiRecord | null;
    setup_proposal: SetupProposalApiRecord[];
    gia_proposal: GiaProposalApiRecord[];
}

export interface ProposalIndexResponse
{
    data: ProposalIndexApiRecord[];
}
