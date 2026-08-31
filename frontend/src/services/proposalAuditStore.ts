import api from "../lib/axios"; // ⚠️ adjust path to wherever this axios instance actually lives

export interface ProposalAuditUser {
  id: number;
  name: string;
  email?: string;
}

export interface ProposalAuditRecord {
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

export async function fetchProposalAuditLogs(
  proposalId: number,
): Promise<ProposalAuditRecord[]> {
  const { data } = await api.get(`/proposal-audit/${proposalId}/list`);
  return (data?.data ?? []) as ProposalAuditRecord[];
}