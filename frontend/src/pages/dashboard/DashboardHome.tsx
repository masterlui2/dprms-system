/**
 * System: DPRMS
 * Purpose: Render dashboard home for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { ROLES } from '../../config/permissions';
import { getMockUser } from '../../lib/mock_auth';
import { ProponentDashboard } from '../proponent/ProponentDashboard';
import { InternalDashboard } from './InternalDashboard';

/** Render dashboard home and its available actions. */
export function DashboardHome()
{
    const objUser = getMockUser();

    if (objUser?.role === ROLES.PROPONENT)
    {
        return <ProponentDashboard />;
    }

    return <InternalDashboard role={objUser?.role ?? ROLES.SYSTEM_ADMIN} />;
}
