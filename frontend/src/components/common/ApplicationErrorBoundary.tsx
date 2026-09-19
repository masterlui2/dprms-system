/**
 * System: DPRMS
 * Purpose: Keep a recoverable screen visible when an unexpected render fails.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../../utils/error_reporting';
import { ErrorRecovery } from './ErrorRecovery';

interface ApplicationErrorBoundaryProps
{
    children: ReactNode;
}

interface ApplicationErrorBoundaryState
{
    blnHasError: boolean;
}

/** Contain unexpected rendering failures and offer an explicit page reload. */
export class ApplicationErrorBoundary extends Component<
    ApplicationErrorBoundaryProps,
    ApplicationErrorBoundaryState
>
{
    state: ApplicationErrorBoundaryState = { blnHasError: false };

    /** Select the fallback screen using React's required lifecycle method. */
    static getDerivedStateFromError(): ApplicationErrorBoundaryState
    {
        return { blnHasError: true };
    }

    /** Record the failure without exposing component props or form contents. */
    componentDidCatch(errRender: Error, _objErrorInfo: ErrorInfo): void
    {
        reportError(errRender, 'Application rendering failed.');
    }

    /** Render the application or the recovery action after a failure. */
    render(): ReactNode
    {
        if (this.state.blnHasError)
        {
            return <ErrorRecovery />;
        }
        return this.props.children;
    }
}
