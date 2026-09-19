/**
 * System: DPRMS
 * Purpose: Manage setup proposal store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import g_objApi from '../lib/axios';
import { getMockUser, setMockUser } from '../lib/mock_auth';
import type {
    DocumentTypeIndexResponse,
    DocumentTypeRecord,
    ProposalIdLookupResponse,
    ProposalShowResponse,
    SetupProposalApiRecord,
    SetupProposalSubmitResponse,
} from '../types/api/setup_proposal';
import type { ApplicationProgram, ApplicationRecord } from '../types/application';
import type { BusinessSize, OrganizationType, SetupProposalData } from '../types/setup_proposal';
import { reportError } from '../utils/error_reporting';
import { saveApplication } from './application_store';
import type { DocumentApiRecord } from './document_store';
export type { DocumentGroup, DocumentTypeRecord } from '../types/api/setup_proposal';

export const ORGANIZATION_TYPE_TO_BUSINESS_TYPE: Record<Exclude<OrganizationType, ''>, string> = {
    'Sole Proprietorship': 'SOLE-PROPRIETORSHIP',
    Partnership: 'PARTNERSHIP',
    Cooperative: 'COOPERATIVE',
    Corporation: 'CORPORATION',
};

export const BUSINESS_SIZE_TO_ENTERPRISE_SIZE: Record<Exclude<BusinessSize, ''>, string> = {
    Micro: 'MICRO',
    Small: 'SMALL',
    Medium: 'MEDIUM',
};

// Reverse of the two maps above — for translating what the backend returns
// (SetupProposal.business_type / enterprise_size) back into frontend types.
export const BUSINESS_TYPE_TO_ORGANIZATION_TYPE: Record<string, Exclude<OrganizationType, ''>> = {
    'SOLE-PROPRIETORSHIP': 'Sole Proprietorship',
    PARTNERSHIP: 'Partnership',
    COOPERATIVE: 'Cooperative',
    CORPORATION: 'Corporation',
};

export const ENTERPRISE_SIZE_TO_BUSINESS_SIZE: Record<string, Exclude<BusinessSize, ''>> = {
    MICRO: 'Micro',
    SMALL: 'Small',
    MEDIUM: 'Medium',
};

/** Get document types. */
export async function getDocumentTypes(objParams: {
    program: ApplicationProgram;
    businessType?: string;
    businessSize?: string;
    giaCategory?: string;
    setNumber?: DocumentTypeRecord['set_number'];
    visibility?: 'applicant' | 'internal';
}): Promise<DocumentTypeRecord[]>
{
    try
    {
        const objResponse = await g_objApi.get<DocumentTypeIndexResponse>('/document-types', {
            params: {
                program: objParams.program,
                business_type: objParams.businessType,
                business_size: objParams.businessSize,
                gia_category: objParams.giaCategory,
                set_number: objParams.setNumber,
                visibility: objParams.visibility,
            },
        });
        return objResponse.data.data;
    } catch (errOperation)
    {
        reportError(errOperation, 'setup_proposal_store: get document types failed.');
        throw errOperation;
    }
}

/** Pick setup proposal record. */
function _pickSetupProposalRecord(
    objRecord: SetupProposalApiRecord[] | SetupProposalApiRecord | null | undefined,
): SetupProposalApiRecord | null
{
    if (!objRecord)
    {
        return null;
    }
    return Array.isArray(objRecord) ? (objRecord[0] ?? null) : objRecord;
}

/**
 * Fetches a submitted SETUP proposal by reference number via
 * GET /proposal/reference-number/{referenceNumber}
 * (ProposalController::getByReferenceNumber).
 *
 * Only maps the fields currently available on the backend. `contactPerson`
 * / `contactNumber` are intentionally left blank: there's no user-details
 * table yet to source them from (per backend, deferred post-MVP) — falls
 * back to the submitter's name/email from the Proposal's User relation
 * where it can.
 */
export async function getSetupProposal(
    strReferenceNo: string,
): Promise<Partial<SetupProposalData> | null>
{
    try
    {
        const objResponse = await g_objApi.get<ProposalShowResponse>(
            `/proposal/reference-number/${strReferenceNo}`,
        );
        const objProposal = objResponse.data.data;
        const objSetup = _pickSetupProposalRecord(objProposal.setup_proposal);
        if (!objSetup)
        {
            return null;
        }

        return {
            businessName: objSetup.business_name,
            businessAddress: objSetup.business_address,
            businessIndustry: objSetup.industry_sector,
            organizationType: BUSINESS_TYPE_TO_ORGANIZATION_TYPE[objSetup.business_type] ?? '',
            businessSize: ENTERPRISE_SIZE_TO_BUSINESS_SIZE[objSetup.enterprise_size] ?? '',
            contactPerson: objProposal.user?.name ?? '',
            emailAddress: objProposal.user?.email ?? '',
            projectTitle: objProposal.title,
        };
    } catch (errCaught)
    {
        reportError(errCaught, 'setup_proposal_store: get setup proposal failed.');

        // Not found, unauthorized, or network error — callers already fall
        // back to application-level data when this returns null.
        return null;
    }
} /* end getSetupProposal */

const SETUP_DRAFT_KEY = 'dprms.setup-proposal-draft';

/** Get setup draft. */
export function getSetupDraft(): SetupProposalData | null
{
    try
    {
        const strDraft = window.localStorage.getItem(SETUP_DRAFT_KEY);
        return strDraft ? (JSON.parse(strDraft) as SetupProposalData) : null;
    } catch (errCaught)
    {
        reportError(errCaught, 'setup_proposal_store: get setup draft failed.');

        window.localStorage.removeItem(SETUP_DRAFT_KEY);
        return null;
    }
}

/** Save setup draft. */
export function saveSetupDraft(objData: SetupProposalData)
{
    window.localStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(objData));
}

/** Clear setup draft. */
export function clearSetupDraft()
{
    window.localStorage.removeItem(SETUP_DRAFT_KEY);
}

export interface SetupProposalSubmitResult
{
    application: ApplicationRecord;
    /** Keyed by document_type_id, same shape DocumentaryRequirementsPage keeps in state. */
    documents: DocumentApiRecord[];
}

/** Submit setup proposal. */
export async function submitSetupProposal(
    objData: SetupProposalData,
    objDocuments: Record<string, File>,
): Promise<SetupProposalSubmitResult>
{
    try
    {
        const dblYearsInOperation = objData.yearEstablished
            ? new Date().getFullYear() - Number(objData.yearEstablished)
            : 0;

        const objFormData = new FormData();
        objFormData.append('title', objData.projectTitle || 'SETUP Technology Upgrade Proposal');
        objFormData.append('business_name', objData.businessName || 'Proponent Enterprise');
        const strBusinessType = objData.organizationType
            ? (ORGANIZATION_TYPE_TO_BUSINESS_TYPE[
                objData.organizationType as Exclude<OrganizationType, ''>
            ] ?? 'SOLE-PROPRIETORSHIP')
            : 'SOLE-PROPRIETORSHIP';
        objFormData.append('business_type', strBusinessType);
        objFormData.append('industry_sector', objData.businessIndustry || 'Manufacturing');
        const strEnterpriseSize = objData.businessSize
            ? (BUSINESS_SIZE_TO_ENTERPRISE_SIZE[
                objData.businessSize as Exclude<BusinessSize, ''>
            ] ?? 'MICRO')
            : 'MICRO';
        objFormData.append('enterprise_size', strEnterpriseSize);
        objFormData.append('years_in_operation', String(dblYearsInOperation));
        objFormData.append('business_address', objData.businessAddress || 'Philippines');

        for (const [strKey, objValue] of Object.entries(objData))
        {
            objFormData.append(
                `form_snapshot[${strKey}]`,
                objValue == null ? '' : String(objValue),
            );
        }

        let arrResolvedDocTypes: DocumentTypeRecord[] = [];
        const blnHasNonNumeric = Object.keys(objDocuments).some((strId) => !/^\d+$/.test(strId));
        if (blnHasNonNumeric)
        {
            try
            {
                arrResolvedDocTypes = await getDocumentTypes({ program: 'SETUP' });
            } catch (errCaught)
            {
                reportError(errCaught, 'setup_proposal_store: submit setup proposal failed.');

                // ignore
            }
        }

        let intIndex = 0;
        for (const [strDocKey, objFile] of Object.entries(objDocuments))
        {
            let objNumericId: number | string = strDocKey;
            if (!/^\d+$/.test(strDocKey) && arrResolvedDocTypes.length > 0)
            {
                const objMatch = arrResolvedDocTypes.find(
                    (objDt) =>
                    {
                        const strLowerDtName = objDt.name.toLowerCase();
                        const strLowerKey = strDocKey.toLowerCase();
                        return (
                            strLowerDtName.includes(strLowerKey.replace(/-/g, ' ')) ||
                            (strLowerKey.includes('omnibus') &&
                                strLowerDtName.includes('omnibus')) ||
                            (strLowerKey.includes('intent') && strLowerDtName.includes('intent')) ||
                            (strLowerKey.includes('mayor') && strLowerDtName.includes('mayor')) ||
                            (strLowerKey.includes('dti') && strLowerDtName.includes('dti')) ||
                            (strLowerKey.includes('sec') && strLowerDtName.includes('sec')) ||
                            (strLowerKey.includes('bir') && strLowerDtName.includes('bir')) ||
                            (strLowerKey.includes('receipt') &&
                                strLowerDtName.includes('receipt')) ||
                            (strLowerKey.includes('quotation') &&
                                strLowerDtName.includes('quotation')) ||
                            (strLowerKey.includes('lease') && strLowerDtName.includes('lease')) ||
                            (strLowerKey.includes('resolution') &&
                                strLowerDtName.includes('resolution')) ||
                            (strLowerKey.includes('articles') &&
                                strLowerDtName.includes('articles')) ||
                            (strLowerKey.includes('secretary') &&
                                strLowerDtName.includes('secretary')) ||
                            (strLowerKey.includes('position') &&
                                strLowerDtName.includes('position')) ||
                            (strLowerKey.includes('operation') &&
                                strLowerDtName.includes('operation')) ||
                            (strLowerKey.includes('cash') && strLowerDtName.includes('cash')) ||
                            (strLowerKey.includes('equity') && strLowerDtName.includes('equity')) ||
                            (strLowerKey.includes('notes') && strLowerDtName.includes('notes')) ||
                            (strLowerKey.includes('biodata') &&
                                strLowerDtName.includes('bio-data')) ||
                            (strLowerKey.includes('government-id') &&
                                strLowerDtName.includes('government')) ||
                            (strLowerKey.includes('barangay') &&
                                strLowerDtName.includes('barangay'))
                        );
                    } /* end objMatch */,
                );
                if (objMatch)
                {
                    objNumericId = objMatch.id;
                }
            } /* end if */

            objFormData.append(`documents[${intIndex}][document_type_id]`, String(objNumericId));
            objFormData.append(`documents[${intIndex}][file]`, objFile);
            intIndex++;
        } /* end loop */

        const objResponse = await g_objApi.post<SetupProposalSubmitResponse>(
            '/proposal/setup',
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
            applicantName: objData.contactPerson || objCurrentUser?.name || 'Proponent User',
            contactEmail: objCurrentUser?.email || objData.emailAddress || 'proponent@dost.gov.ph',
            createdAt: new Date().toISOString(),
            id: crypto.randomUUID(),
            proposalId: intProposalId,
            organizationName: objData.businessName,
            program: 'SETUP',
            projectTitle: objData.projectTitle,
            referenceNo: strReferenceNo,
            status: 'Submitted',
        };

        saveApplication(objApplication);
        try
        {
            window.localStorage.setItem(
                `dprms.setup-proposal-snapshot.${strReferenceNo}`,
                JSON.stringify(objData),
            );
        } catch (errCaught)
        {
            reportError(errCaught, 'setup_proposal_store: submit setup proposal failed.');

            // ignore
        }
        if (objCurrentUser)
        {
            setMockUser({ ...objCurrentUser, applicationReference: strReferenceNo });
        }
        clearSetupDraft();
        return { application: objApplication, documents: objResult.documents ?? [] };
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'setup_proposal_store: submit setup proposal failed.');
        throw errOperation;
    }
} /* end submitSetupProposal */

/** Get setup proposal snapshot. */
export function getSetupProposalSnapshot(strReferenceNo: string): SetupProposalData | null
{
    try
    {
        const strItem = window.localStorage.getItem(
            `dprms.setup-proposal-snapshot.${strReferenceNo}`,
        );
        return strItem ? (JSON.parse(strItem) as SetupProposalData) : null;
    } catch (errCaught)
    {
        reportError(errCaught, 'setup_proposal_store: get setup proposal snapshot failed.');

        return null;
    }
}

/**
 * Resolves the numeric backend proposal id from a reference number, via the
 * same GET /proposal/reference-number/{referenceNumber} endpoint
 * getSetupProposal() already uses. This is a fallback for ApplicationRecords
 * that don't have proposalId set locally (older records, or if the submit
 * response shape doesn't match what submitSetupProposal() expects above).
 */
export async function getSetupProposalId(strReferenceNo: string): Promise<number | null>
{
    try
    {
        const objResponse = await g_objApi.get<ProposalIdLookupResponse>(
            `/proposal/reference-number/${strReferenceNo}`,
        );
        return objResponse.data.data.id ?? null;
    } catch (errCaught)
    {
        reportError(errCaught, 'setup_proposal_store: get setup proposal id failed.');

        return null;
    }
}
