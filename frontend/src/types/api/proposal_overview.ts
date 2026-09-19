/**
 * System: DPRMS
 * Purpose: Describe the current proposal overview API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ApplicationProgram } from '../application';

export interface PersonApiRecord
{
    id: number;
    name: string;
    email: string;
}

export interface SetupOverviewApiRecord
{
    business_address: string;
    business_name: string;
    business_type: string;
    enterprise_size: string;
    form_snapshot: Record<string, unknown> | null;
    industry_sector: string;
    years_in_operation: number;
}

export interface GiaOverviewApiRecord
{
    contact_number: string;
    form_snapshot: Record<string, unknown> | null;
    office_address: string;
    organization_name: string;
    position: string;
    proponent_category: string;
    research_category: string;
    research_type: string;
}

export interface ProposalOverviewApiRecord
{
    created_at: string;
    focal?: PersonApiRecord | null;
    gia_proposal?: GiaOverviewApiRecord[] | GiaOverviewApiRecord | null;
    id: number;
    program_type: ApplicationProgram;
    reference_number: string;
    reviewed?: PersonApiRecord | null;
    setup_proposal?: SetupOverviewApiRecord[] | SetupOverviewApiRecord | null;
    status: string;
    submitted_at: string | null;
    title: string;
    user?: PersonApiRecord | null;
}

export interface ProposalOverviewResponse
{
    data: ProposalOverviewApiRecord;
}
