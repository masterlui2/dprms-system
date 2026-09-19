/**
 * System: DPRMS
 * Purpose: Manage auth service operations and data access.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import axios, { AxiosError } from 'axios';
import { normalizeUserRole } from '../config/permissions';
import g_objApi, { ensureCsrfCookie } from '../lib/axios';
import type { MockUser } from '../lib/mock_auth';
import type {
    BackendUser,
    LoginResponse,
    RegisterPayload,
    RegisterResponse,
    ValidationErrorPayload,
} from '../types/api/auth';
import type { ApplicationProgram } from '../types/application';
import { reportError } from '../utils/error_reporting';

export class AuthError extends Error
{
    constructor(txtMessage = 'Invalid email address or password.')
    {
        super(txtMessage);
        this.name = 'AuthError';
    }
}

/** Resolve role. */
function _resolveRole(objUser: BackendUser): MockUser['role']
{
    const strRelationRole = objUser.roles?.[0]?.code ?? objUser.roles?.[0]?.name;
    return normalizeUserRole(objUser.role ?? strRelationRole);
}

/** Resolve backend role. */
function _resolveBackendRole(objUser: BackendUser): string | undefined
{
    return objUser.role ?? objUser.roles?.[0]?.code ?? objUser.roles?.[0]?.name;
}

/** Get initials. */
function _getInitials(strName: string)
{
    const strInitials = strName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((strPart) => strPart[0]?.toUpperCase())
        .join('');

    return strInitials || 'US';
}

/** Resolve program. */
function _resolveProgram(objUser: BackendUser): ApplicationProgram | undefined
{
    if (objUser.program === 'GIA' || objUser.program === 'SETUP')
    {
        return objUser.program;
    }
    if (objUser.program_type === 'GIA' || objUser.program_type === 'SETUP')
    {
        return objUser.program_type;
    }

    const strEmail = objUser.email?.toLowerCase() ?? '';
    if (strEmail.startsWith('gia.') || strEmail.includes('gia') || strEmail.includes('cest'))
    {
        return 'GIA';
    }
    if (strEmail.startsWith('setup.') || strEmail.includes('setup') || strEmail.includes('sscp'))
    {
        return 'SETUP';
    }

    const strName = objUser.name?.toUpperCase() ?? '';
    if (strName.includes('GIA') || strName.includes('CEST'))
    {
        return 'GIA';
    }
    if (strName.includes('SETUP') || strName.includes('SSCP'))
    {
        return 'SETUP';
    }

    const strRole = (
        objUser.role ??
        objUser.roles?.[0]?.code ??
        objUser.roles?.[0]?.name
    )?.toUpperCase();
    const strRoleProgram = objUser.roles?.[0]?.program_type;

    if (strRoleProgram === 'GIA' || strRoleProgram === 'SETUP')
    {
        return strRoleProgram;
    }
    if (
        strRole === 'GIA_PROJECT_LEADER' ||
        strRole === 'CEST_PROJECT_STAFF' ||
        strRole === 'CEST_FOCAL'
    )
    {
        return 'GIA';
    }
    if (
        strRole === 'MSME_PROPONENT' ||
        strRole === 'SSCP_PROJECT_STAFF' ||
        strRole === 'SSCP_FOCAL' ||
        strRole === 'SETUP_FOCAL'
    )
    {
        return 'SETUP';
    }

    return undefined;
} /* end _resolveProgram */

/** Login with backend. */
export async function loginWithBackend(strEmail: string, strPassword: string)
{
    try
    {
        await ensureCsrfCookie();
        const objResponse = await g_objApi.post<LoginResponse>('/login', {
            email: strEmail,
            password: strPassword,
        });

        const objBackendUser = objResponse.data.data.user;
        const objUser: MockUser = {
            backendRole: _resolveBackendRole(objBackendUser),
            id: objBackendUser.id,
            email: objBackendUser.email,
            initials: _getInitials(objBackendUser.name),
            name: objBackendUser.name,
            program: _resolveProgram(objBackendUser),
            role: _resolveRole(objBackendUser),
        };

        return {
            token: objResponse.data.data.token,
            user: objUser,
        };
    } catch (errCaught)
    {
        reportError(errCaught, 'auth_service: login with backend failed.');

        // Any non-2xx (401, 422, 500, etc.) lands here as an AxiosError.
        throw new AuthError();
    }
} /* end loginWithBackend */

/** Register with backend. */
export async function registerWithBackend(
    objPayload: RegisterPayload,
): Promise<{ token: string; user: MockUser; }>
{
    try
    {
        await ensureCsrfCookie();
        const objResponse = await g_objApi.post<RegisterResponse>('/register', objPayload);
        const objBackendUser = objResponse.data.data.user;
        const objUser: MockUser = {
            backendRole: _resolveBackendRole(objBackendUser),
            id: objBackendUser.id,
            email: objBackendUser.email,
            initials: _getInitials(objBackendUser.name),
            name: objBackendUser.name,
            program: _resolveProgram(objBackendUser),
            role: _resolveRole(objBackendUser),
        };

        return {
            token: objResponse.data.data.token,
            user: objUser,
        };
    } catch (errError)
    {
        reportError(errError, 'auth_service: register with backend failed.');

        if (axios.isAxiosError(errError))
        {
            const errAxiosError = errError as AxiosError<ValidationErrorPayload>;

            if (errAxiosError.response?.status === 422)
            {
                const objErrors = errAxiosError.response.data?.errors;
                const arrFirstError = objErrors ? Object.values(objErrors)[0] : null;
                const txtMessage = Array.isArray(arrFirstError)
                    ? arrFirstError[0]
                    : 'Please review the registration details.';

                throw new AuthError(txtMessage);
            }
        }

        throw new AuthError('Registration failed. Please try again.');
    }
} /* end registerWithBackend */

/** Logout from backend. */
export async function logoutFromBackend(strToken: string)
{
    try
    {
        await g_objApi.post(
            '/logout',
            {},
            {
                headers: {
                    Authorization: `Bearer ${strToken}`,
                },
            },
        );
    } catch (errOperation)
    {
        reportError(errOperation, 'auth_service: logout from backend failed.');
        throw errOperation;
    }
}
