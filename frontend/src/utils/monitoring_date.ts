/**
 * System: DPRMS
 * Purpose: Provide monitoring date utilities.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { Quarter } from '../types/setup_monitoring';

const MONTHS: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
};

/** Iso from parts. */
function _isoFromParts(intYear: number, intMonth: number, intDay: number): string | undefined
{
    const dtDate = new Date(Date.UTC(intYear, intMonth - 1, intDay));
    if (
        dtDate.getUTCFullYear() !== intYear ||
        dtDate.getUTCMonth() + 1 !== intMonth ||
        dtDate.getUTCDate() !== intDay
    )
    {
        return undefined;
    }

    return `${String(intYear).padStart(4, '0')}-${String(intMonth).padStart(2, '0')}-${String(intDay).padStart(2, '0')}`;
}

/**
 * Converts legacy monitoring values such as "July 2026" and "Jun 12" to
 * the API's YYYY-MM-DD contract. Empty or unrecognizable values are omitted
 * from update payloads rather than being sent as malformed dates.
 */
export function normalizeMonitoringDate(
    objValue: unknown,
    intFallbackYear?: number,
): string | undefined
{
    if (typeof objValue !== 'string')
    {
        return undefined;
    }

    const strTrimmed = objValue.trim();
    if (!strTrimmed)
    {
        return undefined;
    }

    const objIsoDate = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(strTrimmed);
    if (objIsoDate)
    {
        return _isoFromParts(Number(objIsoDate[1]), Number(objIsoDate[2]), Number(objIsoDate[3]));
    }

    const objMonthYear = /^([A-Za-z]+)\s+(\d{4})$/.exec(strTrimmed);
    if (objMonthYear)
    {
        const intMonth = MONTHS[objMonthYear[1].toLowerCase()];
        if (intMonth)
        {
            return _isoFromParts(Number(objMonthYear[2]), intMonth, 1);
        }
    }

    const objMonthDay = /^([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?$/.exec(strTrimmed);
    if (objMonthDay)
    {
        const intMonth = MONTHS[objMonthDay[1].toLowerCase()];
        const intYear = objMonthDay[3] ? Number(objMonthDay[3]) : intFallbackYear;
        if (intMonth && intYear)
        {
            return _isoFromParts(intYear, intMonth, Number(objMonthDay[2]));
        }
    }

    return undefined;
} /* end normalizeMonitoringDate */

/** Quarter start iso date. */
export function quarterStartIsoDate(intYear: number, strQuarter: Quarter): string
{
    const intMonth = (Number(strQuarter.slice(1)) - 1) * 3 + 1;
    return `${intYear}-${String(intMonth).padStart(2, '0')}-01`;
}
