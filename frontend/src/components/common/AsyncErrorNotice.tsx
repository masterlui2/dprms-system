/**
 * System: DPRMS
 * Purpose: Show recovery guidance when an asynchronous action escapes its local handler.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import axios from 'axios';
import { useEffect, useState } from 'react';
import { reportError } from '../../utils/error_reporting';

/** Provide a dismissible fallback for unexpected asynchronous failures. */
export function AsyncErrorNotice()
{
    const [blnHasError, setBlnHasError] = useState(false);

    useEffect(() =>
    {
        /** Ignore deliberate cancellation and report an action that could not finish. */
        function _handleRejection(objEvent: PromiseRejectionEvent): void
        {
            const errFailure: unknown = objEvent.reason;
            const blnIsCancellation =
                axios.isCancel(errFailure) ||
                (errFailure instanceof DOMException && errFailure.name === 'AbortError');
            if (blnIsCancellation)
            {
                return;
            }
            reportError(errFailure, 'An asynchronous action failed.');
            setBlnHasError(true);
            objEvent.preventDefault();
        }

        window.addEventListener('unhandledrejection', _handleRejection);
        return () => window.removeEventListener('unhandledrejection', _handleRejection);
    }, []);

    if (!blnHasError)
    {
        return null;
    }
    return (
        <div
            className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-lg rounded-xl border border-red-300 bg-white p-4 shadow-lg"
            role="alert"
        >
            <p className="font-bold text-slate-900">The action could not be completed</p>
            <p className="mt-1 text-sm text-slate-600">
                Please try again. If the problem continues, reload this page.
            </p>
            <button
                className="mt-3 rounded-md px-3 py-1 text-sm font-semibold text-blue-700 focus-visible:outline"
                onClick={() => setBlnHasError(false)}
                type="button"
            >
                Dismiss
            </button>
        </div>
    );
} /* end AsyncErrorNotice */
