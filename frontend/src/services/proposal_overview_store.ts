/**
 * System: DPRMS
 * Purpose: Manage proposal overview store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import g_objApi from '../lib/axios';
import type { ProposalOverviewResponse } from '../types/api/proposal_overview';
import type { ApplicationProgram } from '../types/application';
import { reportError } from '../utils/error_reporting';

export interface ProposalOverviewData
{
    address: string | null;
    assignedOfficer: string | null;
    businessIndustry: string | null;
    businessSize: string | null;
    contactNumber: string | null;
    contactPerson: string | null;
    emailAddress: string | null;
    enterpriseBackground: string | null;
    expectedOutputs: string | null;
    generalObjective: string | null;
    numberOfEmployees: string | null;
    organizationName: string | null;
    organizationType: string | null;
    position: string | null;
    productsServices: string | null;
    program: ApplicationProgram;
    projectBackground: string | null;
    projectCategory: string | null;
    projectSummary: string | null;
    projectTitle: string;
    projectType: string | null;
    proponentCategory: string | null;
    referenceNo: string;
    siteOfImplementation: string | null;
    specificObjectives: string | null;
    status: string;
    submittedAt: string;
    yearEstablished: string | null;
}

const ORGANIZATION_TYPE_LABELS: Record<string, string> = {
    COOPERATIVE: 'Cooperative',
    CORPORATION: 'Corporation',
    PARTNERSHIP: 'Partnership',
    'SOLE-PROPRIETORSHIP': 'Sole Proprietorship',
};

const BUSINESS_SIZE_LABELS: Record<string, string> = {
    MEDIUM: 'Medium',
    MICRO: 'Micro',
    SMALL: 'Small',
};

/** First relation. */
function _firstRelation<T>(udtRecord: T[] | T | null | undefined): T | null
{
    if (!udtRecord)
    {
        return null;
    }
    return Array.isArray(udtRecord) ? (udtRecord[0] ?? null) : udtRecord;
}

/** Snapshot text. */
function _snapshotText(
    objSnapshot: Record<string, unknown> | null | undefined,
    strKey: string,
): string | null
{
    const objValue = objSnapshot?.[strKey];
    if (objValue == null)
    {
        return null;
    }
    const strText = String(objValue).trim();
    return strText || null;
}

/** Fetch proposal overview. */
export async function fetchProposalOverview(strReferenceNo: string): Promise<ProposalOverviewData>
{
    try
    {
        const objResponse = await g_objApi.get<ProposalOverviewResponse>(
            `/proposal/reference-number/${encodeURIComponent(strReferenceNo)}`,
        );
        const objProposal = objResponse.data.data;
        const strAssignedOfficer = objProposal.focal?.name ?? objProposal.reviewed?.name ?? null;
        const strSubmittedAt = objProposal.submitted_at ?? objProposal.created_at;

        if (objProposal.program_type === 'SETUP')
        {
            const objSetup = _firstRelation(objProposal.setup_proposal);
            if (!objSetup)
            {
                throw new Error('SETUP proposal details were not found.');
            }
            const objSnapshot = objSetup.form_snapshot;
            const intSubmittedYear = new Date(strSubmittedAt).getFullYear();
            const strDerivedEstablishedYear =
                Number.isFinite(intSubmittedYear) && objSetup.years_in_operation > 0
                    ? String(intSubmittedYear - objSetup.years_in_operation)
                    : null;

            return {
                address: _snapshotText(objSnapshot, 'businessAddress') ?? objSetup.business_address,
                assignedOfficer: strAssignedOfficer,
                businessIndustry:
                    _snapshotText(objSnapshot, 'businessIndustry') ?? objSetup.industry_sector,
                businessSize:
                    _snapshotText(objSnapshot, 'businessSize') ??
                    BUSINESS_SIZE_LABELS[objSetup.enterprise_size] ??
                    objSetup.enterprise_size,
                contactNumber: _snapshotText(objSnapshot, 'contactNumber'),
                contactPerson:
                    _snapshotText(objSnapshot, 'contactPerson') ?? objProposal.user?.name ?? null,
                emailAddress:
                    _snapshotText(objSnapshot, 'emailAddress') ?? objProposal.user?.email ?? null,
                enterpriseBackground: _snapshotText(objSnapshot, 'enterpriseBackground'),
                expectedOutputs: null,
                generalObjective: _snapshotText(objSnapshot, 'generalObjective'),
                numberOfEmployees: _snapshotText(objSnapshot, 'numberOfEmployees'),
                organizationName:
                    _snapshotText(objSnapshot, 'businessName') ?? objSetup.business_name,
                organizationType:
                    _snapshotText(objSnapshot, 'organizationType') ??
                    ORGANIZATION_TYPE_LABELS[objSetup.business_type] ??
                    objSetup.business_type,
                position: null,
                productsServices: _snapshotText(objSnapshot, 'productsServices'),
                program: objProposal.program_type,
                projectBackground: _snapshotText(objSnapshot, 'projectBackground'),
                projectCategory: null,
                projectSummary: null,
                projectTitle: _snapshotText(objSnapshot, 'projectTitle') ?? objProposal.title,
                projectType: null,
                proponentCategory: null,
                referenceNo: objProposal.reference_number,
                siteOfImplementation: null,
                specificObjectives: _snapshotText(objSnapshot, 'specificObjectives'),
                status: objProposal.status,
                submittedAt: strSubmittedAt,
                yearEstablished:
                    _snapshotText(objSnapshot, 'yearEstablished') ?? strDerivedEstablishedYear,
            };
        } /* end if */

        const objGia = _firstRelation(objProposal.gia_proposal);
        if (!objGia)
        {
            throw new Error('GIA proposal details were not found.');
        }
        const objSnapshot = objGia.form_snapshot;

        return {
            address: _snapshotText(objSnapshot, 'officeAddress') ?? objGia.office_address,
            assignedOfficer: strAssignedOfficer,
            businessIndustry: null,
            businessSize: null,
            contactNumber: _snapshotText(objSnapshot, 'contactNumber') ?? objGia.contact_number,
            contactPerson:
                _snapshotText(objSnapshot, 'projectLeader') ?? objProposal.user?.name ?? null,
            emailAddress:
                _snapshotText(objSnapshot, 'emailAddress') ?? objProposal.user?.email ?? null,
            enterpriseBackground: null,
            expectedOutputs: _snapshotText(objSnapshot, 'expectedOutputs'),
            generalObjective: _snapshotText(objSnapshot, 'generalObjective'),
            numberOfEmployees: null,
            organizationName:
                _snapshotText(objSnapshot, 'organizationName') ?? objGia.organization_name,
            organizationType: null,
            position: _snapshotText(objSnapshot, 'position') ?? objGia.position,
            productsServices: null,
            program: objProposal.program_type,
            projectBackground:
                _snapshotText(objSnapshot, 'projectRationale') ??
                _snapshotText(objSnapshot, 'projectSummary'),
            projectCategory:
                _snapshotText(objSnapshot, 'projectCategory') ?? objGia.research_category,
            projectSummary: _snapshotText(objSnapshot, 'projectSummary'),
            projectTitle: _snapshotText(objSnapshot, 'projectTitle') ?? objProposal.title,
            projectType: _snapshotText(objSnapshot, 'projectType') ?? objGia.research_type,
            proponentCategory:
                _snapshotText(objSnapshot, 'proponentCategory') ?? objGia.proponent_category,
            referenceNo: objProposal.reference_number,
            siteOfImplementation: _snapshotText(objSnapshot, 'siteOfImplementation'),
            specificObjectives: _snapshotText(objSnapshot, 'specificObjectives'),
            status: objProposal.status,
            submittedAt: strSubmittedAt,
            yearEstablished: null,
        };
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'proposal_overview_store: fetch proposal overview failed.');
        throw errOperation;
    }
} /* end fetchProposalOverview */
