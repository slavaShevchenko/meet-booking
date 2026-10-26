import {
  MIN_DURATION_MIN,
  SCHEDULE_HOUR_PX,
  SLOT_STEP_MIN,
  TIME_AXIS_STEP_MIN,
} from '../config/schedule'
import type { Booking, DateString, TimeString } from '../types/booking'
import type { BookingCardModel, CellStatus, DayCell, TimeAxisMark } from '../types/schedule'
import type { SelectOption } from '../types/ui'
import type { ValidationCode } from '../types/validation'
import { displayTitle } from './booking'
import { isBeforeToday, todayKey } from './date'
import { formatDuration, formatTimeRange } from './format'
import { intervalsOverlap, toInterval, type MinuteInterval } from './overlap'
import {
  MINUTES_PER_HOUR,
  WORK_DAY_DURATION_MIN,
  WORK_DAY_END_MIN,
  WORK_DAY_START_MIN,
  addMinutes,
  compareTime,
  durationMinutes,
  formatTime,
  generateEndTimes,
  generateStartTimes,
  generateTimeMarks,
  isValidTime,
  nowMinutes,
  offsetFromWorkStart,
  parseTime,
} from './time'
import { validateBookingInput } from './validation'

export const PX_PER_MINUTE = SCHEDULE_HOUR_PX / MINUTES_PER_HOUR
export const GRID_HEIGHT_PX = WORK_DAY_DURATION_MIN * PX_PER_MINUTE
export const SLOT_HEIGHT_PX = SLOT_STEP_MIN * PX_PER_MINUTE

export interface ScheduleContext {
  date: DateString
  bookings: readonly Booking[]
  now: Date
  editingId?: string | null
}

const START_HINTS: Partial<Record<ValidationCode, string>> = {
  PAST_DATE: 'день прошёл',
  PAST_TIME: 'время прошло',
  CONFLICT: 'занято',
}

const END_HINTS: Partial<Record<ValidationCode, string>> = {
  PAST_TIME: 'время прошло',
  CONFLICT: 'занято',
  DURATION_TOO_SHORT: `меньше ${formatDuration(MIN_DURATION_MIN)}`,
  DURATION_TOO_LONG: 'дольше максимума',
  OUT_OF_WORK_HOURS: 'вне рабочего дня',
  END_NOT_AFTER_START: 'раньше начала',
}

export function minuteOffsetToPx(offsetMin: number): number {
  return Number.isFinite(offsetMin) ? Math.round(offsetMin * PX_PER_MINUTE) : 0
}

export function buildTimeAxis(stepMin: number = TIME_AXIS_STEP_MIN): TimeAxisMark[] {
  return generateTimeMarks(stepMin).map((time) => ({
    time,
    offsetMin: offsetFromWorkStart(time),
  }))
}

function cellStarts(): TimeString[] {
  const starts: TimeString[] = []
  for (
    let minutes = WORK_DAY_START_MIN;
    minutes + SLOT_STEP_MIN <= WORK_DAY_END_MIN;
    minutes += SLOT_STEP_MIN
  ) {
    starts.push(formatTime(minutes))
  }
  return starts
}

/** Clickable 30-minute cells of one day: free, occupied by a booking, or already in the past. */
export function buildDayCells(context: ScheduleContext): DayCell[] {
  const { date, bookings, now } = context
  const today = todayKey(now)
  const isPastDay = isBeforeToday(date, now)
  const currentMinutes = nowMinutes(now)

  const occupied: Array<{ id: string; interval: MinuteInterval }> = []
  for (const booking of bookings) {
    const interval = toInterval(booking)
    if (interval) occupied.push({ id: booking.id, interval })
  }

  return cellStarts().map((start) => {
    const startMin = parseTime(start) ?? WORK_DAY_START_MIN
    const cellInterval: MinuteInterval = { start: startMin, end: startMin + SLOT_STEP_MIN }
    const occupying = occupied.find((entry) => intervalsOverlap(cellInterval, entry.interval))
    const isPast = isPastDay || (date === today && startMin < currentMinutes)
    const status: CellStatus = occupying ? 'busy' : isPast ? 'past' : 'free'

    return {
      start,
      end: addMinutes(start, SLOT_STEP_MIN),
      offsetMin: startMin - WORK_DAY_START_MIN,
      status,
      bookingId: occupying?.id,
      selectable: status === 'free',
    }
  })
}

/** One range is bookable when it passes the full rule set — a single source of truth for the pickers. */
export function isRangeBookable(
  range: { date: DateString; start: TimeString; end: TimeString },
  context: ScheduleContext,
): boolean {
  return validateBookingInput({ ...range, title: '' }, context).valid
}

function isPastTime(date: DateString, time: TimeString, now: Date): boolean {
  const minutes = parseTime(time)
  return minutes !== null && date === todayKey(now) && minutes < nowMinutes(now)
}

function startHint(start: TimeString, context: ScheduleContext): string | null {
  if (isBeforeToday(context.date, context.now)) return START_HINTS.PAST_DATE ?? 'недоступно'
  if (isPastTime(context.date, start, context.now)) return START_HINTS.PAST_TIME ?? 'недоступно'
  const hasFreeEnd = generateEndTimes(start).some((end) =>
    isRangeBookable({ date: context.date, start, end }, context),
  )
  return hasFreeEnd ? null : 'нет свободных слотов'
}

function endHint(start: TimeString, end: TimeString, context: ScheduleContext): string | null {
  const result = validateBookingInput(
    { date: context.date, start, end, title: '' },
    { bookings: context.bookings, editingId: context.editingId, now: context.now },
  )
  if (result.valid) return null
  const issue = result.issues[0]
  return (issue && (END_HINTS[issue.code] ?? START_HINTS[issue.code])) || 'недоступно'
}

function toOption(value: TimeString, hint: string | null): SelectOption {
  return { value, label: value, disabled: hint !== null, hint: hint ?? undefined }
}

export function buildStartOptions(context: ScheduleContext): SelectOption[] {
  return generateStartTimes().map((start) => toOption(start, startHint(start, context)))
}

export function buildEndOptions(
  start: TimeString,
  context: ScheduleContext,
  currentEnd?: TimeString,
): SelectOption[] {
  if (!isValidTime(start)) return []
  const values = generateEndTimes(start)

  // An edited booking may end off the grid (09:15–10:00): keep that value selectable so opening
  // the form never silently moves the user's data — validation still decides if it is allowed.
  const endMin = currentEnd ? parseTime(currentEnd) : null
  if (endMin !== null && endMin <= WORK_DAY_END_MIN && !values.includes(currentEnd as TimeString)) {
    values.push(currentEnd as TimeString)
    values.sort(compareTime)
  }

  return values.map((end) => toOption(end, endHint(start, end, context)))
}

/** Smallest allowed end for a start — the default when the form opens or the start changes. */
export function defaultEndFor(start: TimeString): TimeString {
  const [first] = generateEndTimes(start)
  return first ?? addMinutes(start, MIN_DURATION_MIN)
}

/** Keeps the current end when it is still valid, otherwise falls back to the first free one. */
export function resolveEndForStart(
  start: TimeString,
  previousEnd: TimeString,
  context: ScheduleContext,
): TimeString {
  const options = buildEndOptions(start, context, previousEnd)
  const kept = options.find((option) => option.value === previousEnd && !option.disabled)
  if (kept) return previousEnd
  const firstFree = options.find((option) => !option.disabled)
  return firstFree ? firstFree.value : defaultEndFor(start)
}

/** First start that can actually be booked — used to prefill the create form. */
export function firstBookableStart(context: ScheduleContext): TimeString | null {
  const option = buildStartOptions(context).find((item) => !item.disabled)
  return option ? option.value : null
}

export function buildCardModel(booking: Booking, editable: boolean): BookingCardModel {
  const duration = durationMinutes(booking)
  return {
    booking,
    topPx: minuteOffsetToPx(offsetFromWorkStart(booking.start)),
    heightPx: minuteOffsetToPx(duration),
    timeLabel: formatTimeRange(booking),
    durationLabel: formatDuration(duration),
    title: displayTitle(booking),
    editable,
  }
}
