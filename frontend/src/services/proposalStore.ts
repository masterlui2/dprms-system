import api from '../lib/axios'
import type { ApplicationRecord, ApplicationProgram } from '../types/application'
import type { ProposalFormData } from '../types/proposal'
import { createApplicationFromProposal } from './applicationStore'

interface ProposalUserApiRecord {
  id: number
  name: string
  email: string
}

interface SetupProposalApiRecord {
  id: number
  proposal_id: number
  business_name: string
  business_type: string
  industry_sector: string
  enterprise_size: string
  years_in_operation: number
  business_address: string
  region: string | null
  province: string | null
  city_municipality: string | null
  form_snapshot: Record<string, unknown> | null
}

interface GiaProposalApiRecord {
  id: number
  proposal_id: number
  proponent_category: string
  organization_name: string
  office_address: string
  position: string
  contact_number: string
  // NOTE: index endpoint uses research_type/research_category, NOT
  // project_type/project_category like submitGiaProposal() assumes.
  // Flagging — these two endpoints disagree on field names; verify
  // against the GiaProposal migration/model before relying on either.
  research_type: string
  research_category: string
}

interface ProposalIndexApiRecord {
  id: number
  submitted_by: number
  focal_id: number | null
  reviewed_by: number | null
  program_type: ApplicationProgram
  reference_number: string
  title: string
  status: string
  submitted_at: string | null
  approved_at: string | null
  disapproved_at: string | null
  remarks: string | null
  created_at: string
  updated_at: string
  user: ProposalUserApiRecord | null
  setup_proposal: SetupProposalApiRecord[]
  gia_proposal: GiaProposalApiRecord[]
}

interface ProposalIndexResponse {
  data: ProposalIndexApiRecord[]
}

/**
 * Maps GET /proposal's `status` string to ApplicationRecord['status'].
 * Only 'SUBMITTED' has been observed in real backend data so far — the
 * rest are inferred from the frontend's existing status union and are
 * UNVERIFIED. Update this map once other statuses are confirmed.
 */
const BACKEND_STATUS_TO_APPLICATION_STATUS: Record<string, ApplicationRecord['status']> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  UNDER_VALIDATION: 'In Process',
  ENDORSED_TO_RPMO: 'Under review',
  UNDER_SCREENING: 'Under review',
  ENDORSED_TO_RTEC: 'Technical evaluation',
  UNDER_EVALUATION: 'Technical evaluation',
  ENDORSED_TO_DIRECTOR: 'Executive Approval',
  TECHNICAL_EVALUATION: 'Technical evaluation',
  IN_PROCESS: 'In Process',
  EXECUTIVE_APPROVAL: 'Executive Approval',
  APPROVED: 'Approved',
  DISAPPROVED: 'Disapproved',
  RETURNED: 'Returned for Revision',
  RETURNED_FOR_REVISION: 'Returned for Revision',
}

function mapProposalStatus(status: string): ApplicationRecord['status'] {
  const mapped = BACKEND_STATUS_TO_APPLICATION_STATUS[status]
  if (!mapped) {
    console.warn(`Unmapped proposal status "${status}" from GET /proposal — defaulting to 'Submitted'.`)
    return 'Submitted'
  }
  return mapped
}

/**
 * Fetches all proposals via GET /proposal for admin/reviewer listing
 * (e.g. ApprovalsPage). Pure backend read, no localStorage fallback —
 * admin views should always reflect the real database.
 *
 * setup_proposal / gia_proposal come back as arrays (HasMany relation on
 * Proposal model, even though a proposal only ever has one) — same
 * unwrapping pattern as pickSetupProposalRecord() in setupProposalStore.ts.
 */
export async function getAllProposals(): Promise<ApplicationRecord[]> {
  const response = await api.get<ProposalIndexResponse>('/proposal')

  return response.data.data.map((proposal) => {
    const setup = proposal.setup_proposal[0] ?? null
    const gia = proposal.gia_proposal[0] ?? null

    const location = setup
      ? [setup.city_municipality, setup.province].filter(Boolean).join(', ') || setup.business_address
      : gia
        ? gia.office_address
        : null

    return {
      applicantName: proposal.user?.name ?? '',
      contactEmail: proposal.user?.email ?? '',
      createdAt: proposal.created_at,
      id: String(proposal.id),
      proposalId: proposal.id,
      organizationName: setup?.business_name ?? gia?.organization_name ?? '',
      program: proposal.program_type,
      projectTitle: proposal.title,
      referenceNo: proposal.reference_number,
      remarks: proposal.remarks,
      status: mapProposalStatus(proposal.status),
      industrySector: setup?.industry_sector ?? null,
      enterpriseSize: setup?.enterprise_size ?? null,
      businessType: setup?.business_type ?? null,
      location,
      proponentCategory: gia?.proponent_category ?? null,
      researchCategory: gia?.research_category ?? gia?.research_type ?? null,
      contactNumber: gia?.contact_number ?? null,
    }
  })
}

export async function submitProposal(
  proposal: ProposalFormData,
): Promise<ApplicationRecord> {
  await new Promise((resolve) => window.setTimeout(resolve, 700))

  return createApplicationFromProposal(proposal)
}

export async function markProposalInProcess(proposalId: number) {
  await api.put(`/proposal/advance-stage/${proposalId}`, {
    status: 'UNDER_VALIDATION',
  })
}

export type ProposalDecision =
  | 'approve'
  | 'disapprove'
  | 'endorse'
  | 'return_revision'

export async function applyProposalDecision({
  decision,
  proposalId,
  remarks,
}: {
  decision: ProposalDecision
  proposalId: number
  remarks?: string
}): Promise<ApplicationRecord['status']> {
  if (decision === 'approve') {
    await api.put(`/proposal/${proposalId}/approve`, { remarks: remarks || null })
    return 'Approved'
  }

  if (decision === 'disapprove') {
    await api.put(`/proposal/${proposalId}/disapprove`, { remarks })
    return 'Disapproved'
  }

  if (decision === 'return_revision') {
    const response = await api.put<{ data: ProposalIndexApiRecord }>(
      `/proposal/${proposalId}/return-for-revision`,
      { remarks },
    )
    return mapProposalStatus(response.data.data.status)
  }

  await api.put(`/proposal/advance-stage/${proposalId}`, {
    remarks: remarks || null,
    status: 'ENDORSED_TO_DIRECTOR',
  })
  return 'Executive Approval'
}

export async function resubmitProposal(proposalId: number) {
  await api.put(`/proposal/${proposalId}/resubmit`)
}
