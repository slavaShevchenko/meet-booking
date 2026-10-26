/** Calendar day in `YYYY-MM-DD`. */
export type DateString = string

/** Time of day in 24-hour `HH:mm`. */
export type TimeString = string

export interface TimeRange {
  start: TimeString
  end: TimeString
}

export interface Booking extends TimeRange {
  id: string
  date: DateString
  title?: string
}

/** Body of `POST /api/bookings`: a booking without the server-assigned id. */
export type BookingDraft = Omit<Booking, 'id'>

/** Body of `PATCH /api/bookings/:id`. */
export type BookingPatch = Partial<BookingDraft>

/**
 * Raw form model. Unlike `Booking`, `title` is always present (possibly an empty
 * string) so the form can bind it two-way and validation can trim it on submit.
 */
export interface BookingInput extends TimeRange {
  date: DateString
  title: string
}
