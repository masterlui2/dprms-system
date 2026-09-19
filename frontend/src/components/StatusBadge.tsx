/**
 * System: DPRMS
 * Purpose: Render status badge for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
type StatusBadgeProps = {
    children: string;
    strTone?: 'success' | 'warning' | 'neutral';
};

const g_objToneClasses = {
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    neutral: 'text-slate-600',
} satisfies Record<NonNullable<StatusBadgeProps['strTone']>, string>;

/** Render status badge and its available actions. */
export function StatusBadge({ children: strChildren, strTone = 'neutral' }: StatusBadgeProps)
{
    return (
        <span className={`text-xs font-semibold ${g_objToneClasses[strTone]}`}>{strChildren}</span>
    );
}
