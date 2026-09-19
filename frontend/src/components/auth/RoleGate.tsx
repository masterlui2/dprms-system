/**
 * System: DPRMS
 * Purpose: Render role gate for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { getMockUser, type UserRole } from '../../lib/mock_auth';

/** Render role gate and its available actions. */
export function RoleGate({
    arrAllowedRoles,
    children: objChildren,
}: {
    arrAllowedRoles: UserRole[];
    children: ReactNode;
})
{
    const objUser = getMockUser();

    if (!objUser)
    {
        return <Navigate replace to="/login" />;
    }

    if (!arrAllowedRoles.includes(objUser.role))
    {
        return <Navigate replace to="/dashboard" />;
    }

    return objChildren;
}
