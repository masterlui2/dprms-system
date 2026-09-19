/**
 * System: DPRMS
 * Purpose: Handle page failures caught by React Router with safe recovery guidance.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { reportError } from '../../utils/error_reporting';
import { ErrorRecovery } from './ErrorRecovery';

/** Report a route failure and replace the router's diagnostic screen. */
export function RouteErrorBoundary()
{
    const errRoute = useRouteError();
    useEffect(() =>
    {
        reportError(errRoute, 'Page rendering failed.');
    }, [errRoute]);
    return <ErrorRecovery />;
}
