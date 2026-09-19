/**
 * System: DPRMS
 * Purpose: Describe the current application API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */

export interface BackendProposalRecord
{
    id: number;
    submitted_by: number;
    program_type: 'SETUP' | 'GIA';
    reference_number: string;
    remarks: string | null;
    title: string;
    status: string;
    submitted_at?: string;
    created_at: string;
    updated_at: string;
}
