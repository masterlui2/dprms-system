/**
 * System: DPRMS
 * Purpose: Render admin page header for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ReactNode } from 'react';

interface AdminPageHeaderProps
{
    objAction?: ReactNode;
    txtDescription: string;
    strEyebrow?: string;
    title: string;
}

/** Render admin page header and its available actions. */
export function AdminPageHeader({
    objAction,
    txtDescription,
    strEyebrow,
    title: strTitle,
}: AdminPageHeaderProps)
{
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                {strEyebrow ? (
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#0f53b7]">
                        {strEyebrow}
                    </p>
                ) : null}
                <h1 className="text-2xl font-semibold tracking-tight text-[#073b82] sm:text-3xl">
                    {strTitle}
                </h1>
                {txtDescription ? (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {txtDescription}
                    </p>
                ) : null}
            </div>
            {objAction ? <div className="shrink-0">{objAction}</div> : null}
        </header>
    );
}
