/**
 * System: DPRMS
 * Purpose: Provide msme classification utilities.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
export type MsmeClassification =
    'Micro Enterprise' | 'Small Enterprise' | 'Medium Enterprise' | 'Outside MSME Range';

/** Classify msme. */
export function classifyMsme(strTotalBusinessAssets: string): MsmeClassification | null
{
    if (!strTotalBusinessAssets.trim())
    {
        return null;
    }

    const intAssets = Number(strTotalBusinessAssets);

    if (!Number.isFinite(intAssets) || intAssets <= 0)
    {
        return null;
    }
    if (intAssets <= 3_000_000)
    {
        return 'Micro Enterprise';
    }
    if (intAssets <= 15_000_000)
    {
        return 'Small Enterprise';
    }
    if (intAssets <= 100_000_000)
    {
        return 'Medium Enterprise';
    }

    return 'Outside MSME Range';
} /* end classifyMsme */

/** Format philippine peso. */
export function formatPhilippinePeso(strValue: string): string
{
    const curAmount = Number(strValue);

    if (!Number.isFinite(curAmount))
    {
        return 'PHP 0';
    }

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    }).format(curAmount);
}
