/**
 * System: DPRMS
 * Purpose: Render admin filters for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Search } from 'lucide-react';

interface FilterOption
{
    label: string;
    value: string;
}

/** Render admin search and its available actions. */
export function AdminSearch({
    onChange,
    placeholder: strPlaceholder,
    value: strValue,
}: {
    onChange: (strValue: string) => void;
    placeholder: string;
    value: string;
})
{
    return (
        <label className="relative block min-w-0 flex-1">
            <span className="sr-only">{strPlaceholder}</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                onChange={(objEvent) => onChange(objEvent.target.value)}
                placeholder={strPlaceholder}
                type="search"
                value={strValue}
            />
        </label>
    );
}

/** Render admin select and its available actions. */
export function AdminSelect({
    strLabel,
    onChange,
    arrOptions,
    value: strValue,
}: {
    strLabel: string;
    onChange: (strValue: string) => void;
    arrOptions: FilterOption[];
    value: string;
})
{
    return (
        <label>
            <span className="sr-only">{strLabel}</span>
            <select
                aria-label={strLabel}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100"
                onChange={(objEvent) => onChange(objEvent.target.value)}
                value={strValue}
            >
                {arrOptions.map((objOption) => (
                    <option key={objOption.value} value={objOption.value}>
                        {objOption.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
