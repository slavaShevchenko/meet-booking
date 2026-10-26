import type { Booking, BookingDraft, BookingInput, DateString, TimeString } from '../types/booking'
import { compareTime } from './time'

export const UNTITLED_LABEL = 'Без названия'

/** Normalises the raw form model into an API payload: title is trimmed, empty titles are dropped. */
export function toDraft(input: BookingInput): BookingDraft {
  const title = input.title.trim()
  const draft: BookingDraft = { date: input.date, start: input.start, end: input.end }
  if (title) draft.title = title
  return draft
}

/** Maps a server booking (or a partial draft) onto the form model, where `title` always exists. */
export function toInput(source: {
  date: DateString
  start?: TimeString
  end?: TimeString
  title?: string
}): BookingInput {
  return {
    date: source.date,
    start: source.start ?? '',
    end: source.end ?? '',
    title: source.title ?? '',
  }
}

export function displayTitle(booking: Pick<Booking, 'title'>): string {
  const title = booking.title?.trim()
  return title ? title : UNTITLED_LABEL
}

export function sortBookings(bookings: readonly Booking[]): Booking[] {
  return [...bookings].sort((a, b) => compareTime(a.start, b.start) || compareTime(a.end, b.end))
}

/** Immutable upsert applied by the store after every successful create/update. */
export function upsertBooking(bookings: readonly Booking[], booking: Booking): Booking[] {
  const index = bookings.findIndex((item) => item.id === booking.id)
  if (index === -1) return sortBookings([...bookings, booking])
  const next = [...bookings]
  next[index] = booking
  return sortBookings(next)
}

export function removeBookingById(bookings: readonly Booking[], id: string): Booking[] {
  return bookings.filter((booking) => booking.id !== id)
}
