/**
 * System: DPRMS
 * Purpose: Render not found for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Link } from 'react-router-dom';

/** Render not found and its available actions. */
export function NotFound()
{
    return (
        <main className="grid min-h-screen place-items-center bg-[#f6f8fb] px-4 text-center">
            <div className="max-w-md">
                <p className="text-sm font-bold uppercase tracking-wide text-[#105c4a]">404</p>
                <h1 className="mt-3 text-4xl font-bold text-slate-950">Page not found</h1>
                <p className="mt-3 text-slate-600">
                    The page you are looking for does not exist in the DPRMS scaffold.
                </p>
                <Link
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#105c4a] px-5 text-sm font-bold text-white transition hover:bg-[#0c4639]"
                    to="/dashboard"
                >
                    Back to Dashboard
                </Link>
            </div>
        </main>
    );
}
