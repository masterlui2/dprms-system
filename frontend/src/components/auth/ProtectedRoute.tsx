/**
 * System: DPRMS
 * Purpose: Render protected route for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { canAccessModule, type ModuleId } from '../../config/permissions';
import { getMockUser } from '../../lib/mock_auth';

/** Render protected route and its available actions. */
export function ProtectedRoute({
    children: objChildren,
    strModule,
}: {
    children: ReactNode;
    strModule: ModuleId;
})
{
    const objUser = getMockUser();

    if (!objUser)
    {
        return <Navigate replace to="/login" />;
    }
    if (!canAccessModule(objUser.role, strModule, objUser.program, objUser.backendRole))
    {
        return <Navigate replace to="/unauthorized" />;
    }

    return objChildren;
}
