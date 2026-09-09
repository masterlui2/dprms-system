import type { Quarter } from '../types/setupMonitoring'

export const SETUP_CYCLE_START_YEAR = 2024
export const SETUP_CYCLE_END_YEAR = 2026

export interface SetupMonitoringPeriod {
  quarter: Quarter
  year: number
}

export interface SetupMonitoringPeriodBounds {
  approvedAt?: string | null
  startDate?: string | null
  referenceDate?: Date
}

export interface SetupMonitoringPeriodOption extends SetupMonitoringPeriod {
  context: 'backfill' | 'current'
  value: string
  label: string
}

const QUARTER_ORDINALS = ['1st', '2nd', '3rd', '4th'] as const

function quarterForDate(referenceDate: Date): Quarter {
  return `Q${Math.ceil((referenceDate.getMonth() + 1) / 3)}` as Quarter
}

function periodIndex(period: SetupMonitoringPeriod): number {
  return period.year * 4 + Number(period.quarter.slice(1)) - 1
}

function periodFromIndex(index: number): SetupMonitoringPeriod {
  const year = Math.floor(index / 4)
  const quarterNumber = (index % 4) + 1

  return {
    quarter: `Q${quarterNumber}` as Quarter,
    year,
  }
}

function periodForProjectDate(value?: string | null): SetupMonitoringPeriod | null {
  if (!value) return null

  // Backend dates are ISO strings. Reading the date portion directly avoids
  // moving an approval into a different quarter because of a browser timezone.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (
    !Number.isInteger(year)
    || month < 1
    || month > 12
    || day < 1
    || day > 31
  ) return null

  return {
    quarter: `Q${Math.ceil(month / 3)}` as Quarter,
    year,
  }
}

function monitoringBounds(
  bounds: SetupMonitoringPeriodBounds = {},
): { earliest: SetupMonitoringPeriod; latest: SetupMonitoringPeriod } {
  const cycleStart: SetupMonitoringPeriod = {
    quarter: 'Q1',
    year: SETUP_CYCLE_START_YEAR,
  }
  const cycleEnd: SetupMonitoringPeriod = {
    quarter: 'Q4',
    year: SETUP_CYCLE_END_YEAR,
  }
  const current = defaultSetupMonitoringPeriod(bounds.referenceDate)
  const projectInception = periodForProjectDate(bounds.approvedAt)
    ?? periodForProjectDate(bounds.startDate)
    ?? cycleStart

  const latestIndex = Math.min(periodIndex(current), periodIndex(cycleEnd))
  const inceptionIndex = Math.max(periodIndex(projectInception), periodIndex(cycleStart))

  // Active projects should not normally have a future inception date. This
  // clamp keeps the selector usable if migrated data contains one.
  const earliestIndex = Math.min(inceptionIndex, latestIndex)

  return {
    earliest: periodFromIndex(earliestIndex),
    latest: periodFromIndex(latestIndex),
  }
}

export function defaultSetupMonitoringPeriod(
  referenceDate: Date = new Date(),
): SetupMonitoringPeriod {
  if (referenceDate.getFullYear() < SETUP_CYCLE_START_YEAR) {
    return { quarter: 'Q1', year: SETUP_CYCLE_START_YEAR }
  }

  if (referenceDate.getFullYear() > SETUP_CYCLE_END_YEAR) {
    return { quarter: 'Q4', year: SETUP_CYCLE_END_YEAR }
  }

  return {
    quarter: quarterForDate(referenceDate),
    year: referenceDate.getFullYear(),
  }
}

export function normalizeSetupMonitoringPeriod(
  quarter?: Quarter,
  year?: number,
  bounds: SetupMonitoringPeriodBounds = {},
): SetupMonitoringPeriod {
  const options = setupMonitoringPeriodOptions(bounds)
  const requested = options.find(
    (option) => option.quarter === quarter && option.year === year,
  )

  return requested
    ? { quarter: requested.quarter, year: requested.year }
    : { quarter: options[0].quarter, year: options[0].year }
}

export function parseSetupMonitoringPeriod(
  value: string,
  bounds: SetupMonitoringPeriodBounds = {},
): SetupMonitoringPeriod {
  const match = /^(Q[1-4])\s+(\d{4})$/.exec(value)
  if (!match) return normalizeSetupMonitoringPeriod(undefined, undefined, bounds)

  return normalizeSetupMonitoringPeriod(
    match[1] as Quarter,
    Number(match[2]),
    bounds,
  )
}

export function setupMonitoringPeriodOptions(
  bounds: SetupMonitoringPeriodBounds = {},
): SetupMonitoringPeriodOption[] {
  const { earliest, latest } = monitoringBounds(bounds)
  const earliestIndex = periodIndex(earliest)
  const latestIndex = periodIndex(latest)
  const options: SetupMonitoringPeriodOption[] = []

  for (let index = latestIndex; index >= earliestIndex; index -= 1) {
    const period = periodFromIndex(index)
    const quarterNumber = Number(period.quarter.slice(1))
    const isCurrent = index === latestIndex
    const context = isCurrent ? 'current' : 'backfill'
    const value = `${period.quarter} ${period.year}`

    options.push({
      ...period,
      context,
      value,
      label: `${QUARTER_ORDINALS[quarterNumber - 1]} Quarter (${value}) (${isCurrent ? 'Current' : 'Backfill'})`,
    })
  }

  return options
}
