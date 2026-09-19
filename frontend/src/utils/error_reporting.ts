/**
 * System: DPRMS
 * Purpose: Report operational failures without logging request credentials or payloads.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import axios from 'axios';

const g_objReportedErrors = new WeakSet<object>();

/** Log a failure once while keeping tokens, request bodies, and response bodies private. */
export function reportError(errFailure: unknown, strContext: string): void
{
    if (errFailure instanceof DOMException && errFailure.name === 'AbortError')
    {
        return;
    }
    if (axios.isCancel(errFailure))
    {
        return;
    }
    if (typeof errFailure === 'object' && errFailure !== null)
    {
        if (g_objReportedErrors.has(errFailure))
        {
            return;
        }
        g_objReportedErrors.add(errFailure);
    }

    // Axios error objects include authorization headers; report only safe diagnostic fields.
    const objDiagnostic = axios.isAxiosError(errFailure)
        ? { name: errFailure.name, code: errFailure.code, status: errFailure.response?.status }
        : { name: errFailure instanceof Error ? errFailure.name : 'UnknownError' };
    console.error(`[DPRMS] ${strContext}`, objDiagnostic);
}
