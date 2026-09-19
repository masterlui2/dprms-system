/**
 * System: DPRMS
 * Purpose: Manage profile store operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { MockUser } from '../lib/mock_auth';
import { reportError } from '../utils/error_reporting';
import { getApplications } from './application_store';
import { getGiaProposal } from './gia_proposal_store';
import { getSetupProposal } from './setup_proposal_store';

export const PROFILE_UPDATED_EVENT = 'dprms:profile-updated';

export interface ProponentProfile
{
    businessAddress: string;
    contactNumber: string;
    email: string;
    fullName: string;
    organizationName: string;
    organizationType: string;
    photoDataUrl: string;
    position: string;
    program: string;
}

const STORAGE_KEY = 'dprms.proponent-profiles';
type ProfileStore = Record<string, ProponentProfile>;

/** Read store. */
function _readStore(): ProfileStore
{
    try
    {
        return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as ProfileStore;
    } catch (errCaught)
    {
        reportError(errCaught, 'profile_store: read store failed.');

        return {};
    }
}

/** Profile key. */
function _profileKey(objUser: MockUser)
{
    return objUser.email.trim().toLowerCase();
}

/** Get related application. */
function _getRelatedApplication(objUser: MockUser)
{
    const arrApplications = getApplications();
    return arrApplications.find((objApplication) =>
        objUser.applicationReference
            ? objApplication.referenceNo === objUser.applicationReference
            : objApplication.contactEmail.toLowerCase() === objUser.email.toLowerCase(),
    );
}

/** Get proponent profile. */
export async function getProponentProfile(objUser: MockUser): Promise<ProponentProfile>
{
    try
    {
        const objApplication = _getRelatedApplication(objUser);
        const objProposal =
            objApplication?.program === 'SETUP'
                ? await getSetupProposal(objApplication.referenceNo)
                : null;
        const objGiaProposal =
            objApplication?.program === 'GIA' ? getGiaProposal(objApplication.referenceNo) : null;
        const objDefaults: ProponentProfile = {
            businessAddress: objProposal?.businessAddress ?? objGiaProposal?.officeAddress ?? '',
            contactNumber: objProposal?.contactNumber ?? objGiaProposal?.contactNumber ?? '',
            email: objUser.email,
            fullName: objUser.name,
            organizationName:
                objProposal?.businessName ??
                objGiaProposal?.organizationName ??
                objApplication?.organizationName ??
                '',
            organizationType:
                objProposal?.organizationType ?? objGiaProposal?.proponentCategory ?? '',
            photoDataUrl: '',
            position: objGiaProposal?.position ?? '',
            program: objUser.program ?? objApplication?.program ?? '',
        };

        return {
            ...objDefaults,
            ...(_readStore()[_profileKey(objUser)] ?? {}),
            email: objUser.email,
        };
    } catch (errOperation)
    {
        /* end try */

        reportError(errOperation, 'profile_store: get proponent profile failed.');
        throw errOperation;
    }
} /* end getProponentProfile */

/** Save proponent profile. */
export function saveProponentProfile(objUser: MockUser, objProfile: ProponentProfile)
{
    const objStore = _readStore();
    objStore[_profileKey(objUser)] = { ...objProfile, email: objUser.email };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(objStore));
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT));
}
