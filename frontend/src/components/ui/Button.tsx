/**
 * System: DPRMS
 * Purpose: Render button for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

const _buttonVariants = cva(
    'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default:
                    'bg-[#0f53b7] text-white shadow-sm hover:bg-[#0b3f8b] focus-visible:ring-blue-200',
                outline:
                    'border border-slate-300 bg-white text-[#07195f] hover:border-[#0f53b7] hover:text-[#0f53b7] focus-visible:ring-blue-100',
                secondary:
                    'bg-[#f4c542] text-[#07195f] shadow-sm hover:bg-[#eab92d] focus-visible:ring-amber-100',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof _buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className: strClassName, variant: strVariant, ...objProps }, ref) => (
        <button
            className={cn(_buttonVariants({ variant: strVariant }), strClassName)}
            ref={ref}
            {...objProps}
        />
    ),
);

Button.displayName = 'Button';
