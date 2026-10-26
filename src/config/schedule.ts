import type { TimeString } from '../types/booking'

/** Single source of truth for every schedule constant — no magic numbers elsewhere. */
export const WORK_DAY_START: TimeString = '09:00'
export const WORK_DAY_END: TimeString = '18:00'

export const MIN_DURATION_MIN = 30
export const MAX_DURATION_MIN = 120
/** Granularity of the day grid and of the time pickers. */
export const SLOT_STEP_MIN = 30
/** Days shown in one window; the arrows shift it by a single day. */
export const VISIBLE_DAYS = 3

export const TITLE_MAX_LENGTH = 80

/** Step of the labels on the vertical time axis. */
export const TIME_AXIS_STEP_MIN = 60
/** Grid geometry: pixels per work-day hour. Card offsets and heights derive from it. */
export const SCHEDULE_HOUR_PX = 64

/** How often the shared clock ticks; drives recalculation of "already in the past" slots. */
export const CLOCK_INTERVAL_MS = 15_000

/** Artificial latency of the mock server, inclusive range. */
export const MOCK_LATENCY_MIN_MS = 300
export const MOCK_LATENCY_MAX_MS = 600

/**
 * Only UI preferences live here: server data is not persisted because `mockServer`
 * is the source of truth and a stale localStorage copy would silently disagree with it.
 */
export const UI_STORAGE_KEY = 'meeting-room-booking:ui'

export const DATE_LOCALE = 'ru-RU'
