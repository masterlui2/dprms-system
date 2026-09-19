/**
 * System: DPRMS
 * Purpose: Describe the current setup proposal API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { DocumentApiRecord } from '../../services/document_store';

export type DocumentGroup =
    | 'Business Documents'
    | 'Corporation / Cooperative Documents'
    | 'Financial Documents'
    | 'Additional Documents'
    | 'GIA Core Documents'
    | 'Category-specific Documents';

export interface DocumentTypeRecord
{
    id: number;
    name: string;
    group: DocumentGroup | null;
    description: string | null;
    instructions: string | null;
    template_url: string | null;
    set_number: 'PROPOSAL' | 'SET1' | 'SET2' | 'SET3' | 'GIA1';
    applicable_program: 'SETUP' | 'GIA' | 'BOTH';
    applicable_business_types: string[] | null;
    applicable_business_sizes: string[] | null;
    applicable_gia_categories: string[] | null;
    is_required: boolean;
    is_applicant_visible: boolean;
}

export interface DocumentTypeIndexResponse
{
    data: DocumentTypeRecord[];
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
}

export interface ProposalApiRecord
{
    id: number;
    reference_number: string;
    title: string;
    status: string;
    program_type: string;
    user?: { id: number; name: string; email: string; } | null;
    // Modeled as HasMany on the backend (Proposal::setup_proposal), even
    // though a proposal only ever has one — so this can come back either as
    // an array or (if the backend later normalizes it) a single object.
    setup_proposal?: SetupProposalApiRecord[] | SetupProposalApiRecord | null;
}

export interface ProposalShowResponse
{
    data: ProposalApiRecord;
}

export interface SetupProposalSubmitResponse
{
    message: string;
    data: {
        proposal: {
            id: number;
            reference_number: string;
            title: string;
            status: string;
            program_type: string;
        };
        setup_proposal: SetupProposalApiRecord;
        // Includes the auto-generated Form 001 PDF document plus every
        // supporting document submitted alongside it.
        documents: DocumentApiRecord[];
    };
}

export interface ProposalIdLookupResponse
{
    data: { id: number; };
}
