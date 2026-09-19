/**
 * System: DPRMS
 * Purpose: Mock auth definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { normalizeUserRole, ROLES, type UserRole } from '../config/permissions';
import type { ApplicationProgram, ApplicationRecord } from '../types/application';
import { reportError } from '../utils/error_reporting';

export { ROLE_LABEL } from '../config/permissions';
export type { UserRole } from '../config/permissions';

export type MockUser = {
    id?: number;
    backendRole?: string;
    applicationReference?: string;
    email: string;
    initials: string;
    name: string;
    program?: ApplicationProgram;
    role: UserRole;
};

const STORAGE_KEY = 'dprms.mock-user';
const TOKEN_STORAGE_KEY = 'dprms.auth-token';
const ACTIVATED_USERS_KEY = 'dprms.mock-activated-users';

export const ADMIN_USER: MockUser = {
    email: 'admin@dost.gov.ph',
    initials: 'AD',
    name: 'DOST Admin',
    role: ROLES.SYSTEM_ADMIN,
};

export const SETUP_PROPONENT_USER: MockUser = {
    email: 'setup.proponent@dost.gov.ph',
    initials: 'MS',
    name: 'Maria SETUP Proponent',
    program: 'SETUP',
    role: ROLES.PROPONENT,
};

export const PROPONENT_USER: MockUser = SETUP_PROPONENT_USER;

export const GIA_PROPONENT_USER: MockUser = {
    email: 'gia.proponent@dost.gov.ph',
    initials: 'GP',
    name: 'Gina GIA Project Leader',
    program: 'GIA',
    role: ROLES.PROPONENT,
};

const SETUP_STAFF_USER: MockUser = {
    email: 'setup.staff@dost.gov.ph',
    initials: 'SS',
    name: 'Paolo SETUP Staff (SSCP)',
    program: 'SETUP',
    role: ROLES.PROJECT_STAFF,
};

const GIA_STAFF_USER: MockUser = {
    email: 'gia.staff@dost.gov.ph',
    initials: 'GS',
    name: 'Carla GIA Staff (CEST)',
    program: 'GIA',
    role: ROLES.PROJECT_STAFF,
};

const SETUP_FOCAL_USER: MockUser = {
    email: 'setup.focal@dost.gov.ph',
    initials: 'SF',
    name: 'Faith SETUP Focal (SSCP)',
    program: 'SETUP',
    role: ROLES.FOCAL,
};

const GIA_FOCAL_USER: MockUser = {
    email: 'gia.focal@dost.gov.ph',
    initials: 'GF',
    name: 'Felix GIA Focal (CEST)',
    program: 'GIA',
    role: ROLES.FOCAL,
};

const DIRECTOR_USER: MockUser = {
    email: 'director@dost.gov.ph',
    initials: 'PD',
    name: 'Pat Director Approver',
    role: ROLES.PROVINCIAL_DIRECTOR,
};
const RPMO_USER: MockUser = {
    email: 'rpmo@dost.gov.ph',
    initials: 'RV',
    name: 'Rico Regional',
    role: ROLES.RPMO,
};

const MOCK_USERS = [
    { credentials: { email: 'admin@dost.gov.ph', password: 'Dprms@123' }, user: ADMIN_USER },
    {
        credentials: { email: 'setup.proponent@dost.gov.ph', password: 'Dprms@123' },
        user: SETUP_PROPONENT_USER,
    },
    {
        credentials: { email: 'gia.proponent@dost.gov.ph', password: 'Dprms@123' },
        user: GIA_PROPONENT_USER,
    },
    {
        credentials: { email: 'setup.staff@dost.gov.ph', password: 'Dprms@123' },
        user: SETUP_STAFF_USER,
    },
    {
        credentials: { email: 'gia.staff@dost.gov.ph', password: 'Dprms@123' },
        user: GIA_STAFF_USER,
    },
    {
        credentials: { email: 'setup.focal@dost.gov.ph', password: 'Dprms@123' },
        user: SETUP_FOCAL_USER,
    },
    {
        credentials: { email: 'gia.focal@dost.gov.ph', password: 'Dprms@123' },
        user: GIA_FOCAL_USER,
    },
    { credentials: { email: 'director@dost.gov.ph', password: 'Dprms@123' }, user: DIRECTOR_USER },
    { credentials: { email: 'rpmo@dost.gov.ph', password: 'Dprms@123' }, user: RPMO_USER },
];

export const MOCK_CREDENTIAL_HINTS = MOCK_USERS.map(
    ({ credentials: objCredentials, user: objUser }) =>
    {
        return {
            email: objCredentials.email,
            password: objCredentials.password,
            role: objUser.role,
        };
    },
);

type ActivatedAccount = {
    credentials: {
        email: string;
        password: string;
    };
    user: MockUser;
};

/** Normalize credential email. */
function _normalizeCredentialEmail(strEmail: string)
{
    return strEmail.trim().toLowerCase();
}

/** Normalize stored user. */
function _normalizeStoredUser(objUser: MockUser): MockUser
{
    return { ...objUser, role: normalizeUserRole(objUser.role) };
}

/** Get activated accounts. */
function _getActivatedAccounts(): ActivatedAccount[]
{
    if (typeof window === 'undefined')
    {
        return [];
    }

    const strRawAccounts = window.localStorage.getItem(ACTIVATED_USERS_KEY);

    if (!strRawAccounts)
    {
        return [];
    }

    try
    {
        return JSON.parse(strRawAccounts) as ActivatedAccount[];
    } catch (errCaught)
    {
        reportError(errCaught, 'mock_auth: get activated accounts failed.');

        window.localStorage.removeItem(ACTIVATED_USERS_KEY);
        return [];
    }
}

/** Save activated accounts. */
function _saveActivatedAccounts(arrAccounts: ActivatedAccount[])
{
    if (typeof window === 'undefined')
    {
        return;
    }

    window.localStorage.setItem(ACTIVATED_USERS_KEY, JSON.stringify(arrAccounts));
}

/** Authenticate mock user. */
export function authenticateMockUser(strEmail: string, strPassword: string)
{
    const objAccount = MOCK_USERS.find(({ credentials: objCredentials }) =>
    {
        return (
            _normalizeCredentialEmail(objCredentials.email) ===
            _normalizeCredentialEmail(strEmail) && objCredentials.password === strPassword
        );
    });

    if (objAccount)
    {
        return objAccount.user;
    }

    const objActivatedAccount = _getActivatedAccounts().find(({ credentials: objCredentials }) =>
    {
        return (
            _normalizeCredentialEmail(objCredentials.email) ===
            _normalizeCredentialEmail(strEmail) && objCredentials.password === strPassword
        );
    });

    return objActivatedAccount ? _normalizeStoredUser(objActivatedAccount.user) : null;
}

/** Is valid login. */
export function isValidLogin(strEmail: string, strPassword: string)
{
    return Boolean(authenticateMockUser(strEmail, strPassword));
}

export const DEFAULT_REDIRECT_BY_ROLE: Record<UserRole, string> = {
    [ROLES.SYSTEM_ADMIN]: '/dashboard',
    [ROLES.PROJECT_STAFF]: '/dashboard',
    [ROLES.FOCAL]: '/dashboard',
    [ROLES.PROVINCIAL_DIRECTOR]: '/dashboard',
    [ROLES.RPMO]: '/dashboard',
    [ROLES.PROPONENT]: '/dashboard',
    [ROLES.FINANCE_OFFICER]: '/dashboard',
};

/** Get default redirect. */
export function getDefaultRedirect(objUser: MockUser)
{
    if (objUser.role === ROLES.PROPONENT)
    {
        return objUser.program ? `/programs/${objUser.program.toLowerCase()}` : '/';
    }

    return DEFAULT_REDIRECT_BY_ROLE[objUser.role];
}

/** Get initials. */
function _getInitials(strName: string)
{
    const [strFirst = 'B', strSecond = 'P'] = strName.trim().split(/\s+/).filter(Boolean);

    return `${strFirst[0] ?? 'B'}${strSecond[0] ?? strFirst[1] ?? 'P'}`.toUpperCase();
}

/** Register user account. */
export function registerUserAccount({
    id: intId,
    email: strEmail,
    name: strName,
    password: strPassword,
    program: strProgram,
}: {
    id?: number;
    email: string;
    name: string;
    password: string;
    program: ApplicationProgram;
}): MockUser
{
    const objUser: MockUser = {
        id: intId,
        email: strEmail.trim().toLowerCase(),
        initials: _getInitials(strName),
        name: strName.trim(),
        program: strProgram,
        role: ROLES.PROPONENT,
    };

    const arrAccounts = _getActivatedAccounts().filter(
        (objAccount) =>
            _normalizeCredentialEmail(objAccount.credentials.email) !==
            _normalizeCredentialEmail(strEmail),
    );

    _saveActivatedAccounts([
        {
            credentials: {
                email: strEmail.trim().toLowerCase(),
                password: strPassword,
            },
            user: objUser,
        },
        ...arrAccounts,
    ]);

    return objUser;
} /* end registerUserAccount */

/** Activate applicant account. */
export function activateApplicantAccount({
    application: objApplication,
    email: strEmail,
    password: strPassword,
}: {
    application: ApplicationRecord;
    email: string;
    password: string;
}): MockUser
{
    const objUser: MockUser = {
        applicationReference: objApplication.referenceNo,
        email: strEmail.trim().toLowerCase(),
        initials: _getInitials(objApplication.applicantName || objApplication.organizationName),
        name: objApplication.applicantName || objApplication.organizationName,
        program: objApplication.program,
        role: ROLES.PROPONENT,
    };
    const arrAccounts = _getActivatedAccounts().filter(
        (objAccount) =>
            _normalizeCredentialEmail(objAccount.credentials.email) !==
            _normalizeCredentialEmail(strEmail) &&
            objAccount.user.applicationReference !== objApplication.referenceNo,
    );

    _saveActivatedAccounts([
        {
            credentials: {
                email: strEmail.trim().toLowerCase(),
                password: strPassword,
            },
            user: objUser,
        },
        ...arrAccounts,
    ]);

    return objUser;
} /* end activateApplicantAccount */

/** Is application activated. */
export function isApplicationActivated(strReferenceNo: string)
{
    return _getActivatedAccounts().some(
        (objAccount) => objAccount.user.applicationReference === strReferenceNo,
    );
}

/** Get mock user. */
export function getMockUser(): MockUser | null
{
    if (typeof window === 'undefined')
    {
        return null;
    }

    const strRawUser = window.localStorage.getItem(STORAGE_KEY);

    if (!strRawUser)
    {
        return null;
    }

    try
    {
        return _normalizeStoredUser(JSON.parse(strRawUser) as MockUser);
    } catch (errCaught)
    {
        reportError(errCaught, 'mock_auth: get mock user failed.');

        window.localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

/** Set mock user. */
export function setMockUser(objUser: MockUser)
{
    if (typeof window === 'undefined')
    {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(objUser));
}

/** Get auth token. */
export function getAuthToken(): string | null
{
    if (typeof window === 'undefined')
    {
        return null;
    }

    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

/** Set auth token. */
export function setAuthToken(strToken: string)
{
    if (typeof window === 'undefined')
    {
        return;
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, strToken);
}

/** Clear mock user. */
export function clearMockUser()
{
    if (typeof window === 'undefined')
    {
        return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem('dprms.applications');
    window.localStorage.removeItem('dprms.mock-applications');
}
