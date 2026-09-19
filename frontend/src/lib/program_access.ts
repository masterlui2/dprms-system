/**
 * System: DPRMS
 * Purpose: Program access definitions for DPRMS.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ApplicationProgram } from '../types/application';
import { reportError } from '../utils/error_reporting';

const PROGRAM_ACCESS_KEY = 'dprms.program-access';

/** Read program access. */
function _readProgramAccess(): ApplicationProgram[]
{
    if (typeof window === 'undefined')
    {
        return [];
    }

    const strRawAccess = window.localStorage.getItem(PROGRAM_ACCESS_KEY);

    if (!strRawAccess)
    {
        return [];
    }

    try
    {
        return JSON.parse(strRawAccess) as ApplicationProgram[];
    } catch (errCaught)
    {
        reportError(errCaught, 'program_access: read program access failed.');

        window.localStorage.removeItem(PROGRAM_ACCESS_KEY);
        return [];
    }
}

/** Has program access. */
export function hasProgramAccess(strProgram: ApplicationProgram)
{
    return _readProgramAccess().includes(strProgram);
}

/** Grant program access. */
export function grantProgramAccess(strProgram: ApplicationProgram)
{
    if (typeof window === 'undefined')
    {
        return;
    }

    const arrAccess = _readProgramAccess();

    if (!arrAccess.includes(strProgram))
    {
        window.localStorage.setItem(PROGRAM_ACCESS_KEY, JSON.stringify([strProgram, ...arrAccess]));
    }
}

/** Get program registration url. */
export function getProgramRegistrationUrl(strProgram: ApplicationProgram)
{
    const strSlug = strProgram.toLowerCase();
    const strTarget = `/programs/${strSlug}/register`;
    const strRedirect = encodeURIComponent(strTarget);

    return `/register?program=${strSlug}&redirect=${strRedirect}`;
}
