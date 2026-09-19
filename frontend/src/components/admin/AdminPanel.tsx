/**
 * System: DPRMS
 * Purpose: Render admin panel for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ReactNode } from 'react';

import { cn } from '../../utils/cn';

interface AdminPanelProps
{
    objAction?: ReactNode;
    children: ReactNode;
    className?: string;
    txtDescription?: string;
    title: string;
}

/** Render admin panel and its available actions. */
export function AdminPanel({
    objAction,
    children: objChildren,
    className: strClassName,
    txtDescription,
    title: strTitle,
}: AdminPanelProps)
{
    return (
        <section
            className={cn(
                'overflow-hidden rounded-2xl border border-[#d8e1ee] bg-white shadow-[0_14px_36px_-32px_rgba(15,23,42,0.75)]',
                strClassName,
            )}
        >
            <div className="flex flex-col gap-3 border-b border-[#d8e1ee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[#073b82]">{strTitle}</h2>
                    {txtDescription ? (
                        <p className="mt-1 text-sm text-slate-500">{txtDescription}</p>
                    ) : null}
                </div>
                {objAction ? <div className="shrink-0">{objAction}</div> : null}
            </div>
            {objChildren}
        </section>
    );
}
