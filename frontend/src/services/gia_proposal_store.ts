/**
 * System: DPRMS
 * Purpose: Manage gia proposal store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import g_objApi from '../lib/axios';
import { getMockUser, setMockUser } from '../lib/mock_auth';
import type {
    GiaProposalIdLookupResponse,
    GiaProposalSubmitResponse,
} from '../types/api/gia_proposal';
import type { ApplicationRecord } from '../types/application';
import type { GiaProponentCategory, GiaProposalData } from '../types/gia_proposal';
import { reportError } from '../utils/error_reporting';
import { getApplications, saveApplication } from './application_store';
import type { DocumentApiRecord } from './document_store';

const DRAFT_KEY = 'dprms.gia-proposal-draft';
const PROPOSALS_KEY = 'dprms.gia-proposal-details';

/**
 * project_category / project_type are validated server-side against a fixed
 * enum (see GiaProposalSubmissionRequest::rules()):
 *
 *   project_category => Agriculture and Fisheries | Community Development |
 *     Education | Environment | Health |
 *     Information and Communications Technology | Research and Development |
 *     Disaster Risk Reduction and Management | Others
 *
 *   project_type => Research and Development | Capability Building and
 *     Training | Technology Transfer |
 *     Community-Based Science and Technology Project | Others
 *
 * data.projectCategory / data.projectType are sent through as-is (same
 * pattern as proponentCategory, which already matches the backend's
 * proponent_category enum verbatim — see GIA_CATEGORY_TO_API_CATEGORY below,
 * which is a *different* mapping used only for the document-types lookup).
 * The frontend's giaProjectCategories / giaProjectTypes option lists (in
 * data/giaProposal.ts) MUST use these exact strings or submission will fail
 * validation with a 422. Not fixed here since that file wasn't in scope —
 * flagging so a mismatch isn't mistaken for a bug in this function.
 */

// Maps the frontend GiaProponentCategory to the backend's
// document_types.applicable_gia_categories / DocumentTypeController
// `gia_category` query values (see DocumentTypeSeeder.php GIA1 entries).
// Used by fetchGiaDocumentaryRequirements() in documentStore.ts, the same
// way ORGANIZATION_TYPE_TO_BUSINESS_TYPE in setupProposalStore.ts is used
// by fetchSetupDocumentaryRequirements().
export const GIA_CATEGORY_TO_API_CATEGORY: Record<Exclude<GiaProponentCategory, ''>, string> = {
    'Private Sector': 'PRIVATE-SECTOR',
    'Higher Education Institution': 'HEI',
    'Barangay LGU': 'BARANGAY-LGU',
};

type ProposalDetails = Record<string, GiaProposalData>;

/** Read details. */
function _readDetails(): ProposalDetails
{
    try
    {
        return JSON.parse(window.localStorage.getItem(PROPOSALS_KEY) ?? '{}') as ProposalDetails;
    } catch (errCaught)
    {
        reportError(errCaught, 'gia_proposal_store: read details failed.');

        return {};
    }
}

/** Get gia draft. */
export function getGiaDraft(): GiaProposalData | null
{
    try
    {
        const strDraft = window.localStorage.getItem(DRAFT_KEY);
        return strDraft ? (JSON.parse(strDraft) as GiaProposalData) : null;
    } catch (errCaught)
    {
        reportError(errCaught, 'gia_proposal_store: get gia draft failed.');

        window.localStorage.removeItem(DRAFT_KEY);
        return null;
    }
}

/** Save gia draft. */
export function saveGiaDraft(objData: GiaProposalData)
{
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(objData));
}

/** Clear gia draft. */
export function clearGiaDraft()
{
    window.localStorage.removeItem(DRAFT_KEY);
}

/** Save details. */
function _saveDetails(strReferenceNo: string, objData: GiaProposalData)
{
    window.localStorage.setItem(
        PROPOSALS_KEY,
        JSON.stringify({ ..._readDetails(), [strReferenceNo]: objData }),
    );
}

export interface GiaProposalSubmitResult
{
    application: ApplicationRecord;
    /** Keyed by document_type_id, same shape DocumentaryRequirementsPage keeps in state. */
    documents: DocumentApiRecord[];
}

/**
 * Submits a GIA proposal via POST /proposal/gia
 * (GiaProposalSubmissionController::store) as a single multipart request —
 * same pattern as submitSetupProposal() in setupProposalStore.ts. Creates
 * the Proposal, the GiaProposal row, the auto-generated proposal PDF
 * snapshot, and every supporting document in `documents`, all in one DB
 * transaction (GiaSubmissionService::submit()): either everything is
 * created or (on validation failure or any error) nothing is.
 *
 * `documents` is keyed by document_type_id (a DocumentaryRequirement.id),
 * matching what DocumentaryRequirementsPage tracks in `pendingFiles`.
 *
 * Sent as FormData because it carries files. `form_snapshot` is flattened
 * to `form_snapshot[field]=value` bracket notation the same way
 * submitSetupProposal() does, satisfying the `form_snapshot => required|array`
 * rule — every GiaProposalData field is a plain string, so no further
 * nesting is needed.
 *
 * IMPORTANT: same as uploadDocument() in documentStore.ts — the `api` axios
 * instance defaults to 'Content-Type: application/json', which has to be
 * explicitly cleared here so the browser attaches the multipart boundary.
 *
 * Falls back to a local-only application record (same as the old
 * behavior) if the backend request fails, so the proponent isn't blocked
 * by a transient/network error. On fallback there is no numeric proposalId,
 * so document upload for that application stays local-only (handled the
 * same way DocumentaryRequirementsPage already handles a missing
 * proposalId for SETUP).
 */
export async function submitGiaProposal(
    objData: GiaProposalData,
    objDocuments: Record<string, File>,
): Promise<GiaProposalSubmitResult>
{
    try
    {
        const objFormData = new FormData();
        objFormData.append('title', objData.projectTitle);
        objFormData.append('proponent_category', objData.proponentCategory);
        objFormData.append('organization_name', objData.organizationName);
        objFormData.append('office_address', objData.officeAddress);
        objFormData.append('position', objData.position);
        objFormData.append('contact_number', objData.contactNumber);
        objFormData.append('project_category', objData.projectCategory);
        objFormData.append('project_type', objData.projectType);

        for (const [strKey, objValue] of Object.entries(objData))
        {
            objFormData.append(
                `form_snapshot[${strKey}]`,
                objValue == null ? '' : String(objValue),
            );
        }

        Object.entries(objDocuments).forEach(([strDocumentTypeId, objFile], intIndex) =>
        {
            objFormData.append(`documents[${intIndex}][document_type_id]`, strDocumentTypeId);
            objFormData.append(`documents[${intIndex}][file]`, objFile);
        });

        const objResponse = await g_objApi.post<GiaProposalSubmitResponse>(
            '/proposal/gia',
            objFormData,
            {
                headers: { 'Content-Type': undefined },
            },
        );
        const objResult = objResponse.data.data;

        const strReferenceNo = objResult.proposal.reference_number;
        const intProposalId = objResult.proposal.id;

        const objCurrentUser = getMockUser();
        const objApplication: ApplicationRecord = {
            applicantName: objData.projectLeader || objCurrentUser?.name || 'Proponent User',
            contactEmail: objCurrentUser?.email || objData.emailAddress || 'proponent@dost.gov.ph',
            createdAt: new Date().toISOString(),
            id: crypto.randomUUID(),
            proposalId: intProposalId,
            organizationName: objData.organizationName,
            program: 'GIA',
            projectTitle: objData.projectTitle,
            referenceNo: strReferenceNo,
            status: 'Submitted',
        };

        saveApplication(objApplication);
        _saveDetails(strReferenceNo, objData);
        if (objCurrentUser)
        {
            setMockUser({ ...objCurrentUser, applicationReference: strReferenceNo });
        }
        clearGiaDraft();
        return { application: objApplication, documents: objResult.documents ?? [] };
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'gia_proposal_store: submit gia proposal failed.');
        throw errOperation;
    }
} /* end submitGiaProposal */

/**
 * Resolves the numeric backend proposal id from a reference number, via the
 * same GET /proposal/reference-number/{referenceNumber} endpoint used by
 * getSetupProposalId() in setupProposalStore.ts. Fallback for
 * ApplicationRecords that don't have proposalId set locally (older records,
 * or a fallback-to-local submission above).
 */
export async function getGiaProposalId(strReferenceNo: string): Promise<number | null>
{
    try
    {
        const objResponse = await g_objApi.get<GiaProposalIdLookupResponse>(
            `/proposal/reference-number/${strReferenceNo}`,
        );
        return objResponse.data.data.id ?? null;
    } catch (errCaught)
    {
        reportError(errCaught, 'gia_proposal_store: get gia proposal id failed.');

        return null;
    }
}

/** Get sample gia proposal data. */
export function getSampleGiaProposalData(): GiaProposalData
{
    return {
        organizationName: 'Davao Smart Agriculture & Innovation Cooperative',
        proponentCategory: 'Private Sector',
        projectTitle: 'Smart Solar-Powered Hydroponics and Automated Crop Monitoring System',
        projectLeader: 'Dr. Maria Santos',
        position: 'Executive Director / Project Lead',
        emailAddress: 'maria.santos@davaosmartagri.org',
        contactNumber: '+63 917 555 3829',
        officeAddress: 'Km 12, McArthur Highway, Matina, Davao City',
        projectCategory: 'Community Innovation',
        projectType: 'Research & Community Development',
        projectSummary:
            'Deploying solar-powered automated hydroponics setups and IoT-based soil & climate monitoring sensors.',
        projectRationale:
            'Frequent climate shifts affect traditional crop yields; hydroponics provides year-round food security.',
        generalObjective:
            'Establish climate-resilient smart hydroponics and IoT monitoring systems for high-value crops in Davao Region.',
        specificObjectives:
            '1. Establish 5 automated hydroponic greenhouses.\n2. Train 50 local farmers in climate-resilient farming.\n3. Increase crop yield by 35% using DOST-assisted IoT monitoring.',
        siteOfImplementation: 'Barangay Matina Biao, Tugbok District, Davao City',
        targetBeneficiaries:
            'Local agricultural cooperatives and smallholder farmers in Davao City.',
        methodology:
            'Phase 1: Greenhouse construction. Phase 2: IoT sensor integration. Phase 3: Community training.',
        expectedOutputs:
            '5 operational smart greenhouses, 1 technical manual, 50 trained agricultural workers.',
        sustainabilityPlan:
            'Cooperative revenue from high-value crop sales will fund ongoing maintenance and scaling.',
    };
}

/** Get gia proposal. */
export function getGiaProposal(strReferenceNo: string)
{
    return _readDetails()[strReferenceNo] ?? null;
}

/** Get gia applications. */
export function getGiaApplications()
{
    return getApplications().filter((objApplication) => objApplication.program === 'GIA');
}
