import type { Quarter } from '../types/setupMonitoring'

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
}

function isoFromParts(year: number, month: number, day: number): string | undefined {
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() + 1 !== month
    || date.getUTCDate() !== day
  ) {
    return undefined
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Converts legacy monitoring values such as "July 2026" and "Jun 12" to
 * the API's YYYY-MM-DD contract. Empty or unrecognizable values are omitted
 * from update payloads rather than being sent as malformed dates.
 */
export function normalizeMonitoringDate(
  value: unknown,
  fallbackYear?: number,
): string | undefined {
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  if (!trimmed) return undefined

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(trimmed)
  if (isoDate) {
    return isoFromParts(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]))
  }

  const monthYear = /^([A-Za-z]+)\s+(\d{4})$/.exec(trimmed)
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()]
    if (month) return isoFromParts(Number(monthYear[2]), month, 1)
  }

  const monthDay = /^([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?$/.exec(trimmed)
  if (monthDay) {
    const month = MONTHS[monthDay[1].toLowerCase()]
    const year = monthDay[3] ? Number(monthDay[3]) : fallbackYear
    if (month && year) return isoFromParts(year, month, Number(monthDay[2]))
  }

  return undefined
}

export function quarterStartIsoDate(year: number, quarter: Quarter): string {
  const month = (Number(quarter.slice(1)) - 1) * 3 + 1
  return `${year}-${String(month).padStart(2, '0')}-01`
}
