/**
 * System: DPRMS
 * Purpose: Render card for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { HTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

/** Render card and its available actions. */
export function Card({ className: strClassName, ...objProps }: HTMLAttributes<HTMLDivElement>)
{
    return (
        <div
            className={cn(
                'rounded-2xl border border-slate-200 bg-white shadow-sm transition',
                strClassName,
            )}
            {...objProps}
        />
    );
}

/** Render card header and its available actions. */
export function CardHeader({
    className: strClassName,
    ...objProps
}: HTMLAttributes<HTMLDivElement>)
{
    return <div className={cn('p-5 pb-0 sm:p-6 sm:pb-0', strClassName)} {...objProps} />;
}

/** Render card content and its available actions. */
export function CardContent({
    className: strClassName,
    ...objProps
}: HTMLAttributes<HTMLDivElement>)
{
    return <div className={cn('p-5 sm:p-6', strClassName)} {...objProps} />;
}

/** Render card title and its available actions. */
export function CardTitle({
    className: strClassName,
    ...objProps
}: HTMLAttributes<HTMLHeadingElement>)
{
    return (
        <h3 className={cn('text-lg font-semibold text-slate-950', strClassName)} {...objProps} />
    );
}

/** Render card description and its available actions. */
export function CardDescription({
    className: strClassName,
    ...objProps
}: HTMLAttributes<HTMLParagraphElement>)
{
    return <p className={cn('text-sm leading-6 text-slate-600', strClassName)} {...objProps} />;
}
