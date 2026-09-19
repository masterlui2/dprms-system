/**
 * System: DPRMS
 * Purpose: Render review section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Pencil } from 'lucide-react';
import type { ReactNode } from 'react';

interface ReviewSectionProps
{
    children: ReactNode;
    txtDescription: string;
    onEdit: () => void;
    title: string;
}

/** Render review section and its available actions. */
export function ReviewSection({
    children: objChildren,
    txtDescription,
    onEdit,
    title: strTitle,
}: ReviewSectionProps)
{
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-base font-black text-[#073b82]">{strTitle}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{txtDescription}</p>
                </div>
                <button
                    className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-[#073b82] transition hover:border-[#0f53b7] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    onClick={onEdit}
                    type="button"
                >
                    <Pencil className="size-4" />
                    Edit
                </button>
            </div>
            <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">{objChildren}</dl>
        </section>
    );
}
