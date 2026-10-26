import type { Booking, DateString, TimeString } from './booking'

/** Why a 30-minute cell of the day grid cannot be booked. */
export type CellStatus = 'free' | 'busy' | 'past'

export interface DayCell {
  start: TimeString
  end: TimeString
  /** Minutes from `WORK_DAY_START`; drives vertical positioning in the column. */
  offsetMin: number
  status: CellStatus
  bookingId?: string
  selectable: boolean
}

export interface TimeAxisMark {
  time: TimeString
  offsetMin: number
}

/** Everything a `BookingCard` renders, precomputed so templates stay free of math. */
export interface BookingCardModel {
  booking: Booking
  topPx: number
  heightPx: number
  timeLabel: string
  durationLabel: string
  title: string
  editable: boolean
}

export type ColumnState = 'loading' | 'error' | 'empty' | 'ready'

/** Labels of one day, shared by the navigator chips and the schedule columns. */
export interface DayLabel {
  date: DateString
  weekdayLabel: string
  dayLabel: string
  /** `Сегодня` / `Завтра` / empty for the rest of the window. */
  caption: string
  isToday: boolean
  isPast: boolean
  isSelected: boolean
}

export type DayChip = DayLabel

export interface ScheduleColumn extends DayLabel {
  state: ColumnState
  cells: DayCell[]
  cards: BookingCardModel[]
}
