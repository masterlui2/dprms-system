/**
 * System: DPRMS
 * Purpose: Render summary item for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
interface SummaryItemProps
{
    strLabel: string;
    value: string;
    blnWide?: boolean;
}

/** Render summary item and its available actions. */
export function SummaryItem({ strLabel, value: strValue, blnWide = false }: SummaryItemProps)
{
    return (
        <div className={blnWide ? 'sm:col-span-2' : undefined}>
            <dt className="text-xs font-black uppercase tracking-wide text-slate-400">
                {strLabel}
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
                {strValue || 'Not provided'}
            </dd>
        </div>
    );
}
