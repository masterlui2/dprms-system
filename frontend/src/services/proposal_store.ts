/**
 * System: DPRMS
 * Purpose: Manage proposal store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import g_objApi from '../lib/axios';
import type { ProposalIndexApiRecord, ProposalIndexResponse } from '../types/api/proposal';
import type { ApplicationRecord } from '../types/application';
import type { ProposalFormData } from '../types/proposal';
import { reportError } from '../utils/error_reporting';
import { createApplicationFromProposal } from './application_store';

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
};

/** Map proposal status. */
function _mapProposalStatus(strStatus: string): ApplicationRecord['status']
{
    const strMapped = BACKEND_STATUS_TO_APPLICATION_STATUS[strStatus];
    if (!strMapped)
    {
        reportError(
            undefined,
            `Unmapped proposal status "${strStatus}" from GET /proposal — defaulting to 'Submitted'.`,
        );
        return 'Submitted';
    }
    return strMapped;
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
export async function getAllProposals(): Promise<ApplicationRecord[]>
{
    try
    {
        const objResponse = await g_objApi.get<ProposalIndexResponse>('/proposal');

        return objResponse.data.data.map(
            (objProposal) =>
            {
                const objSetup = objProposal.setup_proposal[0] ?? null;
                const objGia = objProposal.gia_proposal[0] ?? null;

                const strLocation = objSetup
                    ? [objSetup.city_municipality, objSetup.province].filter(Boolean).join(', ') ||
                    objSetup.business_address
                    : objGia
                        ? objGia.office_address
                        : null;

                return {
                    applicantName: objProposal.user?.name ?? '',
                    contactEmail: objProposal.user?.email ?? '',
                    createdAt: objProposal.created_at,
                    id: String(objProposal.id),
                    proposalId: objProposal.id,
                    organizationName: objSetup?.business_name ?? objGia?.organization_name ?? '',
                    program: objProposal.program_type,
                    projectTitle: objProposal.title,
                    referenceNo: objProposal.reference_number,
                    remarks: objProposal.remarks,
                    status: _mapProposalStatus(objProposal.status),
                    industrySector: objSetup?.industry_sector ?? null,
                    enterpriseSize: objSetup?.enterprise_size ?? null,
                    businessType: objSetup?.business_type ?? null,
                    location: strLocation,
                    proponentCategory: objGia?.proponent_category ?? null,
                    researchCategory: objGia?.research_category ?? objGia?.research_type ?? null,
                    contactNumber: objGia?.contact_number ?? null,
                };
            } /* end getAllProposals */,
        );
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'proposal_store: get all proposals failed.');
        throw errOperation;
    }
} /* end getAllProposals */

/** Submit proposal. */
export async function submitProposal(objProposal: ProposalFormData): Promise<ApplicationRecord>
{
    try
    {
        await new Promise((resolve) => window.setTimeout(resolve, 700));

        return createApplicationFromProposal(objProposal);
    } catch (errOperation)
    {
        reportError(errOperation, 'proposal_store: submit proposal failed.');
        throw errOperation;
    }
}

/** Mark proposal in process. */
export async function markProposalInProcess(intProposalId: number)
{
    try
    {
        await g_objApi.put(`/proposal/advance-stage/${intProposalId}`, {
            status: 'UNDER_VALIDATION',
        });
    } catch (errOperation)
    {
        reportError(errOperation, 'proposal_store: mark proposal in process failed.');
        throw errOperation;
    }
}

export type ProposalDecision =
    'approve' | 'disapprove' | 'endorse' | 'return_revision' | 'return_in_process';

/** Apply proposal decision. */
export async function applyProposalDecision({
    decision: strDecision,
    proposalId: intProposalId,
    remarks: txtRemarks,
}: {
    decision: ProposalDecision;
    proposalId: number;
    remarks?: string;
}): Promise<ApplicationRecord['status']>
{
    try
    {
        if (strDecision === 'approve')
        {
            await g_objApi.put(`/proposal/${intProposalId}/approve`, {
                remarks: txtRemarks || null,
            });
            return 'Approved';
        }

        if (strDecision === 'disapprove')
        {
            await g_objApi.put(`/proposal/${intProposalId}/disapprove`, { remarks: txtRemarks });
            return 'Disapproved';
        }

        if (strDecision === 'return_in_process')
        {
            await g_objApi.put(`/proposal/advance-stage/${intProposalId}`, {
                remarks: txtRemarks || null,
                status: 'UNDER_VALIDATION',
            });
            return 'In Process';
        }

        if (strDecision === 'return_revision')
        {
            const objResponse = await g_objApi.put<{ data: ProposalIndexApiRecord; }>(
                `/proposal/${intProposalId}/return-for-revision`,
                { remarks: txtRemarks },
            );
            return _mapProposalStatus(objResponse.data.data.status);
        }

        await g_objApi.put(`/proposal/advance-stage/${intProposalId}`, {
            remarks: txtRemarks || null,
            status: 'ENDORSED_TO_DIRECTOR',
        });
        return 'Executive Approval';
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'proposal_store: apply proposal decision failed.');
        throw errOperation;
    }
} /* end applyProposalDecision */

/** Resubmit proposal. */
export async function resubmitProposal(intProposalId: number)
{
    try
    {
        await g_objApi.put(`/proposal/${intProposalId}/resubmit`);
    } catch (errOperation)
    {
        reportError(errOperation, 'proposal_store: resubmit proposal failed.');
        throw errOperation;
    }
}
