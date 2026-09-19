/**
 * System: DPRMS
 * Purpose: Describe the current document API contract without changing wire keys.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */

export interface ArchivedDocumentApiRecord
{
    id: number;
    document_id: number;
    proposal_id: number;
    document_type_id: number;
    uploaded_by: number;
    reviewed_by: number | null;
    file_name: string;
    file_path: string;
    file_size: number | null;
    mime_type: string | null;
    status: 'pending' | 'approved' | 'returned_for_revision';
    remarks: string | null;
    reviewed_at: string | null;
    archived_at: string;
    version: number;
    created_at: string;
    updated_at: string;
}

export interface DocumentApiRecord
{
    id: number;
    proposal_id: number;
    document_type_id: number;
    uploaded_by: number;
    reviewed_by: number | null;
    file_name: string;
    file_path: string;
    file_size: number | null;
    mime_type: string | null;
    status: 'pending' | 'approved' | 'returned_for_revision';
    remarks: string | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
    archived_versions?: ArchivedDocumentApiRecord[];
    document_type?: {
        id: number;
        name: string;
        group?: string | null;
        description?: string | null;
        set_number?: 'PROPOSAL' | 'SET1' | 'SET2' | 'SET3' | 'GIA1';
        is_applicant_visible?: boolean;
    };
}

export interface DocumentIndexResponse
{
    data: DocumentApiRecord[];
}
