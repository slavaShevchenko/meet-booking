import {
  MAX_DURATION_MIN,
  MIN_DURATION_MIN,
  TITLE_MAX_LENGTH,
  WORK_DAY_END,
  WORK_DAY_START,
} from '../config/schedule'
import type { Booking, BookingDraft, BookingInput } from '../types/booking'
import type {
  BookingField,
  FieldErrors,
  ValidationCode,
  ValidationIssue,
  ValidationResult,
} from '../types/validation'
import { displayTitle, toInput } from './booking'
import { isBeforeToday, isValidDateKey, todayKey } from './date'
import { formatDuration, formatTimeRange } from './format'
import { findConflicts } from './overlap'
import { WORK_DAY_END_MIN, WORK_DAY_START_MIN, nowMinutes, parseTime } from './time'

export interface ValidationContext {
  /** Bookings already stored for the validated date. */
  bookings?: readonly Booking[]
  /** Id of the booking being edited — skipped by the overlap check so it cannot conflict with itself. */
  editingId?: string | null
  /** Injected "current moment"; defaults to the real clock. */
  now?: Date
}

export const EMPTY_VALIDATION: ValidationResult = {
  valid: true,
  issues: [],
  errors: [],
  fieldErrors: {},
}

/**
 * Every business rule of the app, checked by both the form (live feedback) and the mock
 * server (authoritative answer) so the two can never drift apart.
 */
export function validateBookingInput(
  input: BookingInput,
  context: ValidationContext = {},
): ValidationResult {
  const bookings = context.bookings ?? []
  const now = context.now ?? new Date()
  const today = todayKey(now)
  const issues: ValidationIssue[] = []

  const add = (code: ValidationCode, field: BookingField | null, message: string): void => {
    issues.push({ code, field, message })
  }

  if (!isValidDateKey(input.date)) {
    add('INVALID_DATE', 'date', 'Некорректная дата')
  } else if (isBeforeToday(input.date, now)) {
    add('PAST_DATE', 'date', 'Нельзя забронировать прошедший день')
  }

  const startMin = parseTime(input.start)
  const endMin = parseTime(input.end)

  if (startMin === null) add('INVALID_TIME', 'start', 'Выберите время начала')
  if (endMin === null) add('INVALID_TIME', 'end', 'Выберите время окончания')

  if (startMin !== null && (startMin < WORK_DAY_START_MIN || startMin >= WORK_DAY_END_MIN)) {
    add('OUT_OF_WORK_HOURS', 'start', `Начало — в пределах ${WORK_DAY_START}–${WORK_DAY_END}`)
  }
  if (endMin !== null && (endMin <= WORK_DAY_START_MIN || endMin > WORK_DAY_END_MIN)) {
    add('OUT_OF_WORK_HOURS', 'end', `Окончание — в пределах ${WORK_DAY_START}–${WORK_DAY_END}`)
  }

  if (startMin !== null && endMin !== null) {
    if (endMin <= startMin) {
      add('END_NOT_AFTER_START', 'end', 'Окончание должно быть позже начала')
    } else {
      const duration = endMin - startMin
      if (duration < MIN_DURATION_MIN) {
        add(
          'DURATION_TOO_SHORT',
          'end',
          `Минимальная длительность — ${formatDuration(MIN_DURATION_MIN)}`,
        )
      }
      if (duration > MAX_DURATION_MIN) {
        add(
          'DURATION_TOO_LONG',
          'end',
          `Максимальная длительность — ${formatDuration(MAX_DURATION_MIN)}`,
        )
      }
    }
  }

  if (input.date === today && startMin !== null) {
    const lowerBound = earliestAllowedStart(bookings, context.editingId, now)
    if (startMin < lowerBound) add('PAST_TIME', 'start', 'Это время уже прошло')
  }

  // Overlap only makes sense for a range that is otherwise well formed.
  if (
    startMin !== null &&
    endMin !== null &&
    endMin > startMin &&
    !isBeforeToday(input.date, now)
  ) {
    const [conflict] = findConflicts(input, bookings, context.editingId)
    if (conflict) {
      issues.push({
        code: 'CONFLICT',
        field: 'start',
        message: `Пересечение с бронью «${displayTitle(conflict)}» ${formatTimeRange(conflict)}`,
        conflictingBookingId: conflict.id,
      })
    }
  }

  if (input.title.trim().length > TITLE_MAX_LENGTH) {
    add('TITLE_TOO_LONG', 'title', `Название — не длиннее ${TITLE_MAX_LENGTH} символов`)
  }

  return toResult(issues)
}

/** Server-side flavour: accepts the API payload instead of the raw form model. */
export function validateBookingDraft(
  draft: BookingDraft,
  context: ValidationContext = {},
): ValidationResult {
  return validateBookingInput(toInput(draft), context)
}

/**
 * Earliest bookable start for today. When an ongoing booking is edited, its already started
 * time stays valid — otherwise renaming a meeting in progress would be impossible.
 */
function earliestAllowedStart(
  bookings: readonly Booking[],
  editingId: string | null | undefined,
  now: Date,
): number {
  const current = nowMinutes(now)
  if (!editingId) return current
  const edited = bookings.find((booking) => booking.id === editingId)
  const editedStart = edited ? parseTime(edited.start) : null
  return editedStart === null ? current : Math.min(current, editedStart)
}

function toResult(issues: ValidationIssue[]): ValidationResult {
  const fieldErrors: FieldErrors = {}
  for (const issue of issues) {
    if (issue.field && fieldErrors[issue.field] === undefined) {
      fieldErrors[issue.field] = issue.message
    }
  }
  return {
    valid: issues.length === 0,
    issues,
    errors: issues.map((issue) => issue.message),
    fieldErrors,
  }
}

export function findIssueByCode(
  result: ValidationResult,
  code: ValidationCode,
): ValidationIssue | undefined {
  return result.issues.find((issue) => issue.code === code)
}
