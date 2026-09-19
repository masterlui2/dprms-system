/**
 * System: DPRMS
 * Purpose: Manage application store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import g_objApi from '../lib/axios';
import { getMockUser, setMockUser } from '../lib/mock_auth';
import type { BackendProposalRecord } from '../types/api/application';
import type { ApplicationRecord } from '../types/application';
import type { ProposalFormData } from '../types/proposal';
import { reportError } from '../utils/error_reporting';
export type { BackendProposalRecord } from '../types/api/application';

const APPLICATIONS_KEY = 'dprms.applications';
const LEGACY_APPLICATIONS_KEY = 'dprms.mock-applications';

/** Read applications. */
function _readApplications(): ApplicationRecord[]
{
    if (typeof window === 'undefined')
    {
        return [];
    }

    const strRawApplications =
        window.localStorage.getItem(APPLICATIONS_KEY) ||
        window.localStorage.getItem(LEGACY_APPLICATIONS_KEY);

    if (!strRawApplications)
    {
        return [];
    }

    try
    {
        return JSON.parse(strRawApplications) as ApplicationRecord[];
    } catch (errCaught)
    {
        reportError(errCaught, 'application_store: read applications failed.');

        window.localStorage.removeItem(APPLICATIONS_KEY);
        window.localStorage.removeItem(LEGACY_APPLICATIONS_KEY);
        return [];
    }
} /* end _readApplications */

/** Write applications. */
function _writeApplications(arrApplications: ApplicationRecord[])
{
    if (typeof window === 'undefined')
    {
        return;
    }

    window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(arrApplications));
}

/** Save application. */
export function saveApplication(objApplication: ApplicationRecord)
{
    const arrExisting = _readApplications().filter((objItem) => objItem.id !== objApplication.id);
    _writeApplications([objApplication, ...arrExisting]);
}

/**
 * Removes all applications from localStorage.
 * Call this on login so a fresh session never shows another user's data.
 */
export function clearApplications()
{
    if (typeof window === 'undefined')
    {
        return;
    }
    window.localStorage.removeItem(APPLICATIONS_KEY);
    window.localStorage.removeItem(LEGACY_APPLICATIONS_KEY);
}

/** Remove application. */
export function removeApplication(strIdentifier: string)
{
    const arrExisting = _readApplications().filter(
        (objItem) => objItem.id !== strIdentifier && objItem.referenceNo !== strIdentifier,
    );
    _writeApplications(arrExisting);
}

/** Update application status. */
export function updateApplicationStatus(
    strReferenceNo: string,
    strStatus: ApplicationRecord['status'],
)
{
    const arrApplications = _readApplications();
    const objApplication = arrApplications.find(
        (objItem) => objItem.referenceNo === strReferenceNo,
    );
    if (!objApplication)
    {
        return;
    }
    _writeApplications(
        arrApplications.map((objItem) =>
            objItem.referenceNo === strReferenceNo ? { ...objItem, status: strStatus } : objItem,
        ),
    );
}

/** Create reference no. */
function _createReferenceNo(strProgram: ApplicationRecord['program'])
{
    const intSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${strProgram}-${new Date().getFullYear()}-${intSuffix}`;
}

/** Create application from proposal. */
export function createApplicationFromProposal(objProposal: ProposalFormData): ApplicationRecord
{
    const strProgram = objProposal.proposalType === 'GIA' ? 'GIA' : 'SETUP';
    const objApplication: ApplicationRecord = {
        applicantName: objProposal.applicantFullName,
        contactEmail: objProposal.emailAddress,
        createdAt: new Date().toISOString(),
        id: crypto.randomUUID(),
        organizationName: objProposal.organizationName,
        program: strProgram,
        projectTitle: objProposal.projectTitle,
        referenceNo: _createReferenceNo(strProgram),
        status: 'Submitted',
    };

    _writeApplications([objApplication, ..._readApplications()]);

    return objApplication;
}

/** Get applications. */
export function getApplications(): ApplicationRecord[]
{
    return _readApplications();
}

/** Get application by reference. */
export function getApplicationByReference(strReferenceNo: string)
{
    return _readApplications().find(
        (objApplication) => objApplication.referenceNo === strReferenceNo,
    );
}

/** Map backend proposal status. */
function _mapBackendProposalStatus(strStatus: string): ApplicationRecord['status']
{
    const strNormalized = strStatus.toUpperCase();
    if (strNormalized === 'SUBMITTED' || strNormalized === 'UNDER_REVIEW')
    {
        return 'Under review';
    }
    if (strNormalized === 'UNDER_VALIDATION')
    {
        return 'In Process';
    }
    if (strNormalized === 'ENDORSED_TO_DIRECTOR')
    {
        return 'Executive Approval';
    }
    if (strNormalized === 'RETURNED' || strNormalized === 'RETURNED_FOR_REVISION')
    {
        return 'Returned for Revision';
    }
    if (strNormalized === 'APPROVED')
    {
        return 'Approved';
    }
    if (strNormalized === 'DISAPPROVED')
    {
        return 'Disapproved';
    }
    return 'Under review';
} /* end _mapBackendProposalStatus */

/** Sync user applications from backend. */
export async function syncUserApplicationsFromBackend(objUser: {
    id?: number;
    name: string;
    email: string;
    applicationReference?: string;
}): Promise<ApplicationRecord[]>
{
    if (!objUser)
    {
        return _readApplications();
    }

    try
    {
        let arrProposals: BackendProposalRecord[] = [];
        if (objUser.id)
        {
            try
            {
                const objResponse = await g_objApi.get<{ data: BackendProposalRecord[]; }>(
                    `/proposal/submitter/${objUser.id}`,
                );
                arrProposals = objResponse.data?.data ?? [];
            } catch (errCaught)
            {
                reportError(
                    errCaught,
                    'application_store: sync user applications from backend failed.',
                );

                //
            }
        }

        if (arrProposals.length === 0)
        {
            try
            {
                const objResponse = await g_objApi.get<{ data: BackendProposalRecord[]; }>(
                    '/proposal/my-proposals',
                );
                arrProposals = objResponse.data?.data ?? [];
            } catch (errCaught)
            {
                reportError(
                    errCaught,
                    'application_store: sync user applications from backend failed.',
                );

                try
                {
                    const objResponse = await g_objApi.get<{ data: BackendProposalRecord[]; }>(
                        '/proposal/submitter/me',
                    );
                    arrProposals = objResponse.data?.data ?? [];
                } catch (errCaught)
                {
                    reportError(
                        errCaught,
                        'application_store: sync user applications from backend failed.',
                    );

                    //
                }
            }
        }

        if (!objUser.id && arrProposals.length > 0 && arrProposals[0].submitted_by)
        {
            objUser.id = arrProposals[0].submitted_by;
            const objCurrentMock = getMockUser();
            if (objCurrentMock && !objCurrentMock.id)
            {
                setMockUser({ ...objCurrentMock, id: arrProposals[0].submitted_by });
            }
        }

        const arrMappedApps: ApplicationRecord[] = arrProposals.map((objItem) =>
        {
            const objSetupObj = (objItem as any).setup_proposal?.[0];
            const objGiaObj = (objItem as any).gia_proposal?.[0];
            const objOrgName =
                objSetupObj?.business_name ||
                objGiaObj?.organization_name ||
                `${objUser.name} Organization`;

            return {
                id: String(objItem.id),
                proposalId: objItem.id,
                applicantName: objUser.name,
                contactEmail: objUser.email,
                organizationName: objOrgName,
                program: objItem.program_type,
                projectTitle: objItem.title,
                referenceNo: objItem.reference_number,
                remarks: objItem.remarks,
                status: _mapBackendProposalStatus(objItem.status),
                submittedAt: objItem.submitted_at || objItem.created_at,
                createdAt: objItem.created_at,
                updatedAt: objItem.updated_at,
            };
        });

        const arrLocalUserApps = _readApplications().filter(
            (objApp) => objApp.contactEmail.toLowerCase() === objUser.email.toLowerCase(),
        );

        if (arrMappedApps.length > 0)
        {
            const objServerRefs = new Set(arrMappedApps.map((objLeft) => objLeft.referenceNo));
            const objServerIds = new Set(
                arrMappedApps.map((objLeft) => objLeft.proposalId).filter(Boolean),
            );
            const objServerPrograms = new Set(arrMappedApps.map((objLeft) => objLeft.program));

            if (!objUser.applicationReference || !objServerRefs.has(objUser.applicationReference))
            {
                objUser.applicationReference = arrMappedApps[0].referenceNo;
                const objCurrentMock = getMockUser();
                if (objCurrentMock)
                {
                    setMockUser({
                        ...objCurrentMock,
                        applicationReference: arrMappedApps[0].referenceNo,
                    });
                }
            }

            const arrLocalDrafts = arrLocalUserApps.filter(
                (objApp) =>
                    objApp.status === 'Draft Submitted' &&
                    !objServerPrograms.has(objApp.program) &&
                    !objServerRefs.has(objApp.referenceNo) &&
                    (!objApp.proposalId || !objServerIds.has(objApp.proposalId)),
            );

            const arrMergedUserApps = [...arrMappedApps, ...arrLocalDrafts];
            const arrRemainingOtherApps = _readApplications().filter(
                (objApp) => objApp.contactEmail.toLowerCase() !== objUser.email.toLowerCase(),
            );
            _writeApplications([...arrMergedUserApps, ...arrRemainingOtherApps]);

            return arrMergedUserApps;
        } /* end if */ else
        {
            const arrLocalDrafts = arrLocalUserApps.filter(
                (objApp) => objApp.status === 'Draft Submitted',
            );
            const arrRemainingOtherApps = _readApplications().filter(
                (objApp) => objApp.contactEmail.toLowerCase() !== objUser.email.toLowerCase(),
            );
            _writeApplications([...arrLocalDrafts, ...arrRemainingOtherApps]);

            if (
                objUser.applicationReference &&
                !arrLocalDrafts.some(
                    (objApp) => objApp.referenceNo === objUser.applicationReference,
                )
            )
            {
                delete objUser.applicationReference;
                const objCurrentMock = getMockUser();
                if (objCurrentMock)
                {
                    const objUpdated = { ...objCurrentMock };
                    delete objUpdated.applicationReference;
                    setMockUser(objUpdated);
                }
            }

            return arrLocalDrafts;
        } /* end if */
    } /* end try */ catch (errError)
    {
        reportError(errError, 'application_store: sync user applications from backend failed.');

        reportError(errError, 'Failed to sync applications from backend:');
        return _readApplications().filter(
            (objApp) => objApp.contactEmail.toLowerCase() === objUser.email.toLowerCase(),
        );
    }
} /* end syncUserApplicationsFromBackend */
