/**
 * System: DPRMS
 * Purpose: Provide cn utilities.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Cn. */
/** Cn. */
export function cn(...arrInputs: ClassValue[]): string
{
    return twMerge(clsx(arrInputs));
}
