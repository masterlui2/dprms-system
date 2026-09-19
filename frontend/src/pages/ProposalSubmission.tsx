/**
 * System: DPRMS
 * Purpose: Render proposal submission for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { getMockUser } from '../lib/mock_auth';
import { grantProgramAccess, hasProgramAccess } from '../lib/program_access';
import type { ApplicationProgram } from '../types/application';

/** Render proposal submission and its available actions. */
export function ProposalSubmission()
{
    const { program: strProgram = '' } = useParams();
    const objLocation = useLocation();
    const objUser = getMockUser();

    let strSelectedProgram: ApplicationProgram = 'SETUP';
    if (strProgram.toUpperCase() === 'GIA' || objLocation.pathname.includes('/gia'))
    {
        strSelectedProgram = 'GIA';
    } else if (strProgram.toUpperCase() === 'SETUP' || objLocation.pathname.includes('/setup'))
    {
        strSelectedProgram = 'SETUP';
    } else if (objUser?.program)
    {
        strSelectedProgram = objUser.program;
    }

    if (objUser)
    {
        grantProgramAccess(strSelectedProgram);
    }

    const objHasAccess = objUser || hasProgramAccess(strSelectedProgram);

    if (!objHasAccess)
    {
        const strSlug = strSelectedProgram.toLowerCase();
        const strTarget = `/programs/${strSlug}/register`;
        const strRedirect = encodeURIComponent(strTarget);
        return <Navigate replace to={`/register?program=${strSlug}&redirect=${strRedirect}`} />;
    }

    if (strSelectedProgram === 'GIA')
    {
        return <Navigate replace to="/gia/my-proposal" />;
    }

    return <Navigate replace to="/setup/my-application" />;
} /* end ProposalSubmission */
