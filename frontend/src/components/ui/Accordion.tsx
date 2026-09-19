/**
 * System: DPRMS
 * Purpose: Render accordion for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '../../utils/cn';

export const Accordion = AccordionPrimitive.Root;

/** Render accordion item and its available actions. */
export function AccordionItem({
    className: strClassName,
    ...objProps
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>)
{
    return (
        <AccordionPrimitive.Item
            className={cn('border-b border-slate-200 last:border-b-0', strClassName)}
            {...objProps}
        />
    );
}

/** Render accordion trigger and its available actions. */
export function AccordionTrigger({
    children: objChildren,
    className: strClassName,
    ...objProps
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>)
{
    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                className={cn(
                    'group flex flex-1 items-center justify-between gap-4 py-5 text-left text-base font-semibold text-slate-950 transition hover:text-[#0f53b7]',
                    strClassName,
                )}
                {...objProps}
            >
                {objChildren}
                <ChevronDown className="size-5 shrink-0 text-[#0f53b7] transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

/** Render accordion content and its available actions. */
export function AccordionContent({
    children: objChildren,
    className: strClassName,
    ...objProps
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>)
{
    return (
        <AccordionPrimitive.Content
            className="overflow-hidden text-sm data-[state=closed]:animate-none data-[state=open]:animate-none"
            {...objProps}
        >
            <div className={cn('pb-5 leading-6 text-slate-600', strClassName)}>{objChildren}</div>
        </AccordionPrimitive.Content>
    );
}
