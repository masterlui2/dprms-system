/**
 * System: DPRMS
 * Purpose: Present recovery guidance after an unexpected page failure.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */

/** Offer a page reload while keeping failure details out of the UI. */
export function ErrorRecovery()
{
    return (
        <main
            className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6"
            role="alert"
        >
            <h1 className="text-2xl font-bold text-slate-900">This page could not be displayed</h1>
            <p className="text-slate-600">
                Please reload the page and try again. Changes that were not saved may need to be
                entered again.
            </p>
            <button
                className="self-start rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white"
                onClick={() => window.location.reload()}
                type="button"
            >
                Reload page
            </button>
        </main>
    );
}
