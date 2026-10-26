import type { Booking, TimeRange } from '../types/booking'
import { parseTime } from './time'

export interface MinuteInterval {
  start: number
  end: number
}

/** Intervals are half-open, so touching borders (10:00–11:00 and 11:00–12:00) do not conflict. */
export function intervalsOverlap(a: MinuteInterval, b: MinuteInterval): boolean {
  return a.start < b.end && b.start < a.end
}

/** `TimeRange` → minutes interval, or `null` when either bound is malformed. */
export function toInterval(range: TimeRange): MinuteInterval | null {
  const start = parseTime(range.start)
  const end = parseTime(range.end)
  return start === null || end === null ? null : { start, end }
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  const left = toInterval(a)
  const right = toInterval(b)
  // Malformed ranges are validation's business; treating them as non-overlapping keeps this
  // predicate total, so callers never have to handle a "cannot tell" case.
  if (!left || !right) return false
  return intervalsOverlap(left, right)
}

/** Bookings intersecting `range`; `excludeId` skips the booking currently being edited. */
export function findConflicts(
  range: TimeRange,
  bookings: readonly Booking[],
  excludeId?: string | null,
): Booking[] {
  return bookings.filter((booking) => booking.id !== excludeId && rangesOverlap(range, booking))
}

export function hasConflict(
  range: TimeRange,
  bookings: readonly Booking[],
  excludeId?: string | null,
): boolean {
  return findConflicts(range, bookings, excludeId).length > 0
}
