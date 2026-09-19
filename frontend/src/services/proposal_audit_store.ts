/**
 * System: DPRMS
 * Purpose: Manage proposal audit store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import g_objApi from '../lib/axios'; // ⚠️ adjust path to wherever this axios instance actually lives
import { reportError } from '../utils/error_reporting';

export interface ProposalAuditUser
{
    id: number;
    name: string;
    email?: string;
}

export interface ProposalAuditRecord
{
    id: number;
    proposal_id: number;
    reviewed_by: number | null;
    reviewer?: ProposalAuditUser | null;
    action: string | null;
    previous_status: string | null;
    new_status: string | null;
    remarks: string | null;
    findings: string | null;
    assigned_evaluator_id: number | null;
    assigned_evaluator?: ProposalAuditUser | null;
    created_at: string;
    updated_at?: string;
}

/** Fetch proposal audit logs. */
export async function fetchProposalAuditLogs(
    intProposalId: number,
): Promise<ProposalAuditRecord[]>
{
    try
    {
        const { data: objData } = await g_objApi.get(`/proposal-audit/${intProposalId}/list`);
        return (objData?.data ?? []) as ProposalAuditRecord[];
    } catch (errOperation)
    {
        reportError(errOperation, 'proposal_audit_store: fetch proposal audit logs failed.');
        throw errOperation;
    }
}
