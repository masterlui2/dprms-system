/**
 * System: DPRMS
 * Purpose: Render form section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { ReactNode } from 'react';

interface FormSectionProps
{
    children: ReactNode;
    txtDescription: string;
    title: string;
}

/** Render form section and its available actions. */
export function FormSection({
    children: objChildren,
    txtDescription,
    title: strTitle,
}: FormSectionProps)
{
    return (
        <section className="border-t border-slate-200 pt-7 first:border-t-0 first:pt-0">
            <div className="mb-5">
                <h3 className="text-base font-black text-[#073b82]">{strTitle}</h3>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{txtDescription}</p>
            </div>
            {objChildren}
        </section>
    );
}
