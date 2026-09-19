/**
 * System: DPRMS
 * Purpose: Render metric card for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { LucideIcon } from 'lucide-react';

import { cn } from '../../utils/cn';

type MetricTone = 'blue' | 'gold' | 'orange' | 'sky' | 'green' | 'red' | 'indigo' | 'purple';

const TONE_CLASSES: Record<MetricTone, string> = {
    blue: 'bg-blue-50 text-[#0f53b7]',
    gold: 'bg-amber-50 text-amber-600',
    orange: 'bg-orange-50 text-orange-600',
    sky: 'bg-sky-50 text-sky-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
};

interface MetricCardProps
{
    strDetail?: string;
    icon: LucideIcon;
    strLabel: string;
    onClick?: () => void;
    strTone?: MetricTone;
    strTrend?: string;
    strTrendTone?: 'up' | 'down' | 'neutral';
    value: string | number;
    strValueType?: 'numeric' | 'text';
}

/** Is looks numeric. */
function _isLooksNumeric(strValue: string): boolean
{
    return /^(?:[₱$€£]\s*)?[+-]?\d[\d,.]*(?:\s*\/\s*\d[\d,.]*)?(?:\s*(?:%|[KMB]))?$/i.test(
        strValue.trim(),
    );
}

/** Render metric card and its available actions. */
export function MetricCard({
    strDetail,
    icon: Icon,
    strLabel,
    onClick,
    strTone = 'blue',
    strTrend,
    strTrendTone,
    value: objValue,
    strValueType,
}: MetricCardProps)
{
    const strValue = String(objValue);
    const blnIsNumeric =
        strValueType === 'numeric' || (strValueType !== 'text' && _isLooksNumeric(strValue));

    const blnIsPositive =
        strTrendTone === 'up' ||
        (strTrendTone !== 'down' && (strTrend?.includes('+') || strTrend?.includes('↗')));
    const blnIsNegative =
        strTrendTone === 'down' ||
        (strTrendTone !== 'up' && (strTrend?.includes('-') || strTrend?.includes('↘')));

    const strTrendIcon = blnIsPositive ? '↗' : blnIsNegative ? '↘' : '';
    const strDisplayTrend = strTrend
        ? strTrend.startsWith('↗') || strTrend.startsWith('↘')
            ? strTrend
            : `${strTrendIcon} ${strTrend}`.trim()
        : null;

    return (
        <article
            className={cn(
                'group flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_8px_30px_-6px_rgba(15,23,42,0.08)]',
                onClick && 'cursor-pointer active:scale-[0.99]',
            )}
            onClick={onClick}
        >
            <div className="flex min-w-0 items-center gap-3.5">
                <span
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
                        TONE_CLASSES[strTone],
                    )}
                >
                    <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p
                        className="text-sm font-bold leading-snug text-slate-800 line-clamp-2"
                        title={strLabel}
                    >
                        {strLabel}
                    </p>
                    {strDetail ? (
                        <p
                            className="mt-0.5 text-xs font-medium leading-tight text-slate-400 line-clamp-1"
                            title={strDetail}
                        >
                            {strDetail}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="shrink-0 text-right">
                <p
                    className={cn(
                        'font-black leading-none tracking-tight text-slate-900',
                        blnIsNumeric
                            ? 'numeric-value whitespace-nowrap text-2xl sm:text-3xl tabular-nums'
                            : 'text-base sm:text-lg',
                    )}
                    data-value-type={blnIsNumeric ? 'numeric' : 'text'}
                >
                    {strValue}
                </p>

                {strDisplayTrend ? (
                    <span
                        className={cn(
                            'mt-1 inline-flex items-center gap-0.5 text-xs font-bold tabular-nums',
                            blnIsPositive && 'text-emerald-600',
                            blnIsNegative && 'text-rose-600',
                            !blnIsPositive && !blnIsNegative && 'text-slate-500',
                        )}
                    >
                        {strDisplayTrend}
                    </span>
                ) : null}
            </div>
        </article>
    ); // end return
} /* end MetricCard */
