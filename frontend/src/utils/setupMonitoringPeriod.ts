import type { Quarter } from '../types/setupMonitoring'

export const SETUP_CYCLE_START_YEAR = 2024
export const SETUP_CYCLE_END_YEAR = 2026

export interface SetupMonitoringPeriod {
  quarter: Quarter
  year: number
}

export interface SetupMonitoringPeriodOption extends SetupMonitoringPeriod {
  value: string
  label: string
}

function quarterForDate(referenceDate: Date): Quarter {
  return `Q${Math.ceil((referenceDate.getMonth() + 1) / 3)}` as Quarter
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
): SetupMonitoringPeriod {
  if (
    quarter
    && /^Q[1-4]$/.test(quarter)
    && Number.isInteger(year)
    && year !== undefined
    && year >= SETUP_CYCLE_START_YEAR
    && year <= SETUP_CYCLE_END_YEAR
  ) {
    return { quarter, year }
  }

  return defaultSetupMonitoringPeriod()
}

export function parseSetupMonitoringPeriod(value: string): SetupMonitoringPeriod {
  const match = /^(Q[1-4])\s+(\d{4})$/.exec(value)
  if (!match) return defaultSetupMonitoringPeriod()

  return normalizeSetupMonitoringPeriod(match[1] as Quarter, Number(match[2]))
}

export function setupMonitoringPeriodOptions(): SetupMonitoringPeriodOption[] {
  const options: SetupMonitoringPeriodOption[] = []

  for (let year = SETUP_CYCLE_END_YEAR; year >= SETUP_CYCLE_START_YEAR; year -= 1) {
    for (let quarterNumber = 4; quarterNumber >= 1; quarterNumber -= 1) {
      const quarter = `Q${quarterNumber}` as Quarter
      options.push({
        value: `${quarter} ${year}`,
        label: `${['1st', '2nd', '3rd', '4th'][quarterNumber - 1]} Quarter (${quarter} ${year})`,
        quarter,
        year,
      })
    }
  }

  return options
}
