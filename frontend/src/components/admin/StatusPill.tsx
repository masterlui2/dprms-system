/**
 * System: DPRMS
 * Purpose: Render status pill for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { cn } from '../../utils/cn';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASSES: Record<StatusTone, string> = {
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-red-600',
    info: 'text-[#0f53b7]',
    neutral: 'text-slate-600',
};

/** Render status pill and its available actions. */
export function StatusPill({
    children: strChildren,
    strTone = 'neutral',
}: {
    children: string;
    strTone?: StatusTone;
})
{
    return (
        <span className={cn('inline-flex items-center text-xs font-bold', TONE_CLASSES[strTone])}>
            {strChildren}
        </span>
    );
}
