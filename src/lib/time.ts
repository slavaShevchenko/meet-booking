import {
  MAX_DURATION_MIN,
  MIN_DURATION_MIN,
  SLOT_STEP_MIN,
  WORK_DAY_END,
  WORK_DAY_START,
} from '../config/schedule'
import type { TimeRange, TimeString } from '../types/booking'

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export const MINUTES_PER_HOUR = 60
export const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR

/** `'HH:mm'` → minutes since midnight, or `null` when the string is not a valid time. */
export function parseTime(value: string): number | null {
  const match = TIME_PATTERN.exec(value)
  if (!match) return null
  return Number(match[1]) * MINUTES_PER_HOUR + Number(match[2])
}

export function isValidTime(value: string): boolean {
  return parseTime(value) !== null
}

const pad2 = (value: number): string => String(value).padStart(2, '0')

/** Minutes since midnight → `'HH:mm'`, wrapped into the 24-hour range; `''` for non-finite input. */
export function formatTime(totalMinutes: number): TimeString {
  if (!Number.isFinite(totalMinutes)) return ''
  const normalized =
    ((Math.round(totalMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return `${pad2(Math.floor(normalized / MINUTES_PER_HOUR))}:${pad2(normalized % MINUTES_PER_HOUR)}`
}

export function compareMinutes(a: number, b: number): -1 | 0 | 1 {
  if (Number.isNaN(a) || Number.isNaN(b) || a === b) return 0
  return a < b ? -1 : 1
}

/** Compares two `HH:mm` values; unparsable ones compare equal — validation reports them separately. */
export function compareTime(a: TimeString, b: TimeString): -1 | 0 | 1 {
  return compareMinutes(parseTime(a) ?? Number.NaN, parseTime(b) ?? Number.NaN)
}

export function addMinutes(value: TimeString, minutes: number): TimeString {
  const parsed = parseTime(value)
  return parsed === null ? value : formatTime(parsed + minutes)
}

/** `end - start` in minutes; `NaN` when either bound is malformed (may be negative). */
export function durationMinutes(range: TimeRange): number {
  const start = parseTime(range.start)
  const end = parseTime(range.end)
  return start === null || end === null ? Number.NaN : end - start
}

export function nowMinutes(now: Date): number {
  return now.getHours() * MINUTES_PER_HOUR + now.getMinutes()
}

function parseConfigTime(value: TimeString): number {
  const minutes = parseTime(value)
  // Fail fast on a malformed config constant: it is a programming error, not user input.
  if (minutes === null) throw new Error(`[config/schedule] invalid time constant: "${value}"`)
  return minutes
}

export const WORK_DAY_START_MIN = parseConfigTime(WORK_DAY_START)
export const WORK_DAY_END_MIN = parseConfigTime(WORK_DAY_END)
export const WORK_DAY_DURATION_MIN = WORK_DAY_END_MIN - WORK_DAY_START_MIN

/** Minutes between `WORK_DAY_START` and `value`; negative before the work day starts. */
export function offsetFromWorkStart(value: TimeString): number {
  const parsed = parseTime(value)
  return parsed === null ? Number.NaN : parsed - WORK_DAY_START_MIN
}

export function isWithinWorkDay(range: TimeRange): boolean {
  const start = parseTime(range.start)
  const end = parseTime(range.end)
  if (start === null || end === null) return false
  return start >= WORK_DAY_START_MIN && end <= WORK_DAY_END_MIN
}

function generateSteps(fromMin: number, toMin: number, stepMin: number): TimeString[] {
  if (stepMin <= 0) return []
  const marks: TimeString[] = []
  for (let minutes = fromMin; minutes <= toMin; minutes += stepMin) {
    marks.push(formatTime(minutes))
  }
  return marks
}

/** Every slot boundary of the work day, both ends included. */
export function generateTimeMarks(stepMin: number = SLOT_STEP_MIN): TimeString[] {
  return generateSteps(WORK_DAY_START_MIN, WORK_DAY_END_MIN, stepMin)
}

/** Possible booking starts: each one must still leave room for the minimum duration. */
export function generateStartTimes(stepMin: number = SLOT_STEP_MIN): TimeString[] {
  return generateSteps(WORK_DAY_START_MIN, WORK_DAY_END_MIN - MIN_DURATION_MIN, stepMin)
}

/** Possible ends for a start, bounded by the minimum/maximum duration and the work day. */
export function generateEndTimes(start: TimeString, stepMin: number = SLOT_STEP_MIN): TimeString[] {
  const startMin = parseTime(start)
  if (startMin === null) return []
  const latest = Math.min(startMin + MAX_DURATION_MIN, WORK_DAY_END_MIN)
  return generateSteps(startMin + MIN_DURATION_MIN, latest, stepMin)
}
