/**
 * System: DPRMS
 * Purpose: Provide setup monitoring period utilities.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import type { Quarter } from '../types/setup_monitoring';

export const SETUP_CYCLE_START_YEAR = 2024;
export const SETUP_CYCLE_END_YEAR = 2026;

export interface SetupMonitoringPeriod
{
    quarter: Quarter;
    year: number;
}

export interface SetupMonitoringPeriodBounds
{
    approvedAt?: string | null;
    startDate?: string | null;
    referenceDate?: Date;
}

export interface SetupMonitoringPeriodOption extends SetupMonitoringPeriod
{
    context: 'backfill' | 'current';
    value: string;
    label: string;
}

const QUARTER_ORDINALS = ['1st', '2nd', '3rd', '4th'] as const;

/** Quarter for date. */
function _quarterForDate(dtReferenceDate: Date): Quarter
{
    return `Q${Math.ceil((dtReferenceDate.getMonth() + 1) / 3)}` as Quarter;
}

/** Period index. */
function _periodIndex(objPeriod: SetupMonitoringPeriod): number
{
    return objPeriod.year * 4 + Number(objPeriod.quarter.slice(1)) - 1;
}

/** Period from index. */
function _periodFromIndex(intIndex: number): SetupMonitoringPeriod
{
    const intYear = Math.floor(intIndex / 4);
    const intQuarterNumber = (intIndex % 4) + 1;

    return {
        quarter: `Q${intQuarterNumber}` as Quarter,
        year: intYear,
    };
}

/** Period for project date. */
function _periodForProjectDate(strValue?: string | null): SetupMonitoringPeriod | null
{
    if (!strValue)
    {
        return null;
    }

    // Backend dates are ISO strings. Reading the date portion directly avoids
    // moving an approval into a different quarter because of a browser timezone.
    const objMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(strValue.trim());
    if (!objMatch)
    {
        return null;
    }

    const intYear = Number(objMatch[1]);
    const intMonth = Number(objMatch[2]);
    const intDay = Number(objMatch[3]);
    if (!Number.isInteger(intYear) || intMonth < 1 || intMonth > 12 || intDay < 1 || intDay > 31)
    {
        return null;
    }

    return {
        quarter: `Q${Math.ceil(intMonth / 3)}` as Quarter,
        year: intYear,
    };
} /* end _periodForProjectDate */

/** Monitoring bounds. */
function _monitoringBounds(objBounds: SetupMonitoringPeriodBounds = {}):
    {
        earliest: SetupMonitoringPeriod;
        latest: SetupMonitoringPeriod;
    }
{
    const objCycleStart: SetupMonitoringPeriod = {
        quarter: 'Q1',
        year: SETUP_CYCLE_START_YEAR,
    };
    const objCycleEnd: SetupMonitoringPeriod = {
        quarter: 'Q4',
        year: SETUP_CYCLE_END_YEAR,
    };
    const objCurrent = defaultSetupMonitoringPeriod(objBounds.referenceDate);
    const objProjectInception =
        _periodForProjectDate(objBounds.approvedAt) ??
        _periodForProjectDate(objBounds.startDate) ??
        objCycleStart;

    const intLatestIndex = Math.min(_periodIndex(objCurrent), _periodIndex(objCycleEnd));
    const intInceptionIndex = Math.max(
        _periodIndex(objProjectInception),
        _periodIndex(objCycleStart),
    );

    // Active projects should not normally have a future inception date. This
    // clamp keeps the selector usable if migrated data contains one.
    const intEarliestIndex = Math.min(intInceptionIndex, intLatestIndex);

    return {
        earliest: _periodFromIndex(intEarliestIndex),
        latest: _periodFromIndex(intLatestIndex),
    };
} /* end _monitoringBounds */

/** Default setup monitoring period. */
export function defaultSetupMonitoringPeriod(
    dtReferenceDate: Date = new Date(),
): SetupMonitoringPeriod
{
    if (dtReferenceDate.getFullYear() < SETUP_CYCLE_START_YEAR)
    {
        return { quarter: 'Q1', year: SETUP_CYCLE_START_YEAR };
    }

    if (dtReferenceDate.getFullYear() > SETUP_CYCLE_END_YEAR)
    {
        return { quarter: 'Q4', year: SETUP_CYCLE_END_YEAR };
    }

    return {
        quarter: _quarterForDate(dtReferenceDate),
        year: dtReferenceDate.getFullYear(),
    };
}

/** Normalize setup monitoring period. */
export function normalizeSetupMonitoringPeriod(
    strQuarter?: Quarter,
    intYear?: number,
    objBounds: SetupMonitoringPeriodBounds = {},
): SetupMonitoringPeriod
{
    const arrOptions = setupMonitoringPeriodOptions(objBounds);
    const objRequested = arrOptions.find(
        (objOption) => objOption.quarter === strQuarter && objOption.year === intYear,
    );

    return objRequested
        ? { quarter: objRequested.quarter, year: objRequested.year }
        : { quarter: arrOptions[0].quarter, year: arrOptions[0].year };
}

/** Parse setup monitoring period. */
export function parseSetupMonitoringPeriod(
    strValue: string,
    objBounds: SetupMonitoringPeriodBounds = {},
): SetupMonitoringPeriod
{
    const objMatch = /^(Q[1-4])\s+(\d{4})$/.exec(strValue);
    if (!objMatch)
    {
        return normalizeSetupMonitoringPeriod(undefined, undefined, objBounds);
    }

    return normalizeSetupMonitoringPeriod(objMatch[1] as Quarter, Number(objMatch[2]), objBounds);
}

/** Setup monitoring period options. */
export function setupMonitoringPeriodOptions(
    objBounds: SetupMonitoringPeriodBounds = {},
): SetupMonitoringPeriodOption[]
{
    const { earliest: objEarliest, latest: objLatest } = _monitoringBounds(objBounds);
    const intEarliestIndex = _periodIndex(objEarliest);
    const intLatestIndex = _periodIndex(objLatest);
    const arrOptions: SetupMonitoringPeriodOption[] = [];

    let intIndex = intLatestIndex;
    for (; intIndex >= intEarliestIndex; intIndex -= 1)
    {
        const objPeriod = _periodFromIndex(intIndex);
        const intQuarterNumber = Number(objPeriod.quarter.slice(1));
        const blnIsCurrent = intIndex === intLatestIndex;
        const strContext = blnIsCurrent ? 'current' : 'backfill';
        const strValue = `${objPeriod.quarter} ${objPeriod.year}`;

        arrOptions.push({
            ...objPeriod,
            context: strContext,
            value: strValue,
            label: `${QUARTER_ORDINALS[intQuarterNumber - 1]} Quarter (${strValue})`,
        });
    }

    return arrOptions;
}
