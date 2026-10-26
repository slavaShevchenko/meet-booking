import { DATE_LOCALE } from '../config/schedule'
import type { DateString, TimeRange } from '../types/booking'
import { addDays, parseDateKey } from './date'

const MINUTES_PER_HOUR = 60

const dayMonthFormatter = new Intl.DateTimeFormat(DATE_LOCALE, { day: 'numeric', month: 'long' })
const weekdayLongFormatter = new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'long' })
const weekdayShortFormatter = new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'short' })
const clockFormatter = new Intl.DateTimeFormat(DATE_LOCALE, { hour: '2-digit', minute: '2-digit' })

const format = (formatter: Intl.DateTimeFormat, key: DateString): string => {
  const date = parseDateKey(key)
  return date ? formatter.format(date) : ''
}

export function formatDayMonth(key: DateString): string {
  return format(dayMonthFormatter, key)
}

export function formatWeekday(key: DateString, style: 'long' | 'short' = 'long'): string {
  const formatted = format(style === 'short' ? weekdayShortFormatter : weekdayLongFormatter, key)
  return formatted.replace(/\.$/, '')
}

/** `Сегодня` / `Завтра` for the first two days of the window, empty otherwise. */
export function dayCaption(key: DateString, today: DateString): string {
  if (key === today) return 'Сегодня'
  if (key === addDays(today, 1)) return 'Завтра'
  return ''
}

export function formatFullDate(key: DateString): string {
  const parts = [formatWeekday(key), formatDayMonth(key)].filter(Boolean)
  return parts.join(', ')
}

export function formatTimeRange(range: TimeRange): string {
  return `${range.start}–${range.end}`
}

/** `90` → `'1 ч 30 мин'`; `NaN`/negative durations render as an empty string. */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return ''
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = Math.round(minutes % MINUTES_PER_HOUR)
  if (hours && rest) return `${hours} ч ${rest} мин`
  if (hours) return `${hours} ч`
  return `${rest} мин`
}

export function formatClock(date: Date): string {
  return clockFormatter.format(date)
}
