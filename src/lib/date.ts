import type { DateString } from '../types/booking'

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MS_PER_DAY = 86_400_000

const pad2 = (value: number): string => String(value).padStart(2, '0')

/** Local-midnight `Date` for `YYYY-MM-DD`, or `null` when the key is not a real calendar day. */
export function parseDateKey(key: DateString): Date | null {
  if (!DATE_KEY_PATTERN.test(key)) return null
  const [yearPart, monthPart, dayPart] = key.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)
  const day = Number(dayPart)
  const date = new Date(year, month - 1, day)
  const isRealDay =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return isRealDay ? date : null
}

export function isValidDateKey(value: string): boolean {
  return parseDateKey(value) !== null
}

export function toDateKey(date: Date): DateString {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function todayKey(now: Date = new Date()): DateString {
  return toDateKey(now)
}

export function addDays(key: DateString, days: number): DateString {
  const date = parseDateKey(key)
  if (!date || !Number.isFinite(days)) return key
  date.setDate(date.getDate() + Math.trunc(days))
  return toDateKey(date)
}

function toUtcMs(key: DateString): number | null {
  const date = parseDateKey(key)
  return date ? Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) : null
}

/** Whole calendar days between two keys (`a - b`); UTC-based so DST shifts cannot skew it. */
export function diffDays(a: DateString, b: DateString): number {
  const left = toUtcMs(a)
  const right = toUtcMs(b)
  return left === null || right === null ? 0 : Math.round((left - right) / MS_PER_DAY)
}

export function isToday(key: DateString, now: Date = new Date()): boolean {
  return key === todayKey(now)
}

export function isBeforeDay(key: DateString, referenceKey: DateString): boolean {
  return diffDays(key, referenceKey) < 0
}

/** True for days strictly before today — such days can no longer be booked. */
export function isBeforeToday(key: DateString, now: Date = new Date()): boolean {
  return isBeforeDay(key, todayKey(now))
}

export function dateRange(startKey: DateString, days: number): DateString[] {
  const keys: DateString[] = []
  for (let offset = 0; offset < days; offset += 1) {
    keys.push(addDays(startKey, offset))
  }
  return keys
}
