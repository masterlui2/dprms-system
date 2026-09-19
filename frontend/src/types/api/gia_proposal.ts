/**
 * System: DPRMS
 * Purpose: Describe the current gia proposal API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { DocumentApiRecord } from '../../services/document_store';

export interface GiaProposalApiRecord
{
    id: number;
    proposal_id: number;
    proponent_category: string;
    organization_name: string;
    office_address: string;
    position: string;
    contact_number: string;
    project_category: string;
    project_type: string;
}

export interface GiaProposalSubmitResponse
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
        gia_proposal: GiaProposalApiRecord;
        // Auto-generated proposal PDF snapshot plus every supporting document
        // submitted alongside it — same shape as SETUP's submit response.
        documents: DocumentApiRecord[];
    };
}

export interface GiaProposalIdLookupResponse
{
    data: { id: number; };
}
