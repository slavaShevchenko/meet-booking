import { addDays, todayKey } from '../lib/date'
import type { Booking, BookingDraft, DateString } from '../types/booking'

/**
 * A row of the in-memory database. `hidden` records emulate a concurrent write: they take
 * part in the server-side overlap check but are not returned by GET, so the UI legitimately
 * believes the slot is free until the server answers 409 (see `mockServer.assertValid`).
 */
export interface MockRecord extends Booking {
  hidden: boolean
}

export interface MockBookingStore {
  listVisible(date: DateString): Booking[]
  listAll(date: DateString): MockRecord[]
  find(id: string): MockRecord | undefined
  insert(draft: BookingDraft): Booking
  replace(id: string, draft: BookingDraft): Booking
  remove(id: string): boolean
  reveal(id: string): void
  reset(): void
}

interface SeedEntry {
  dayOffset: number
  start: string
  end: string
  title: string
  hidden?: boolean
}

/**
 * Deterministic seed relative to today, so the grid always shows existing bookings and a
 * reproducible conflict. The `hidden` entry is the "race": tomorrow 12:00–13:00 looks free,
 * and booking it returns 409 — after which it becomes visible.
 */
const SEED: SeedEntry[] = [
  { dayOffset: 0, start: '10:00', end: '11:00', title: 'Синхрон команды' },
  { dayOffset: 0, start: '13:00', end: '14:30', title: 'Ревью макетов' },
  { dayOffset: 0, start: '16:00', end: '17:00', title: 'Звонок с заказчиком' },
  { dayOffset: 1, start: '09:30', end: '10:30', title: 'Планирование спринта' },
  { dayOffset: 1, start: '12:00', end: '13:00', title: 'Бронь коллеги', hidden: true },
  { dayOffset: 1, start: '15:00', end: '16:00', title: '1:1 с тимлидом' },
  { dayOffset: 2, start: '11:00', end: '12:00', title: 'Демо фичи' },
]

export function createSeed(now: Date = new Date()): MockRecord[] {
  const today = todayKey(now)
  return SEED.map((entry, index) => ({
    id: `seed-${index + 1}`,
    date: addDays(today, entry.dayOffset),
    start: entry.start,
    end: entry.end,
    title: entry.title,
    hidden: entry.hidden ?? false,
  }))
}

/** Strips the internal `hidden` flag: nothing outside the API layer may see it. */
function toBooking(record: MockRecord): Booking {
  const booking: Booking = {
    id: record.id,
    date: record.date,
    start: record.start,
    end: record.end,
  }
  if (record.title) booking.title = record.title
  return booking
}

export function createMockBookingStore(now: Date = new Date()): MockBookingStore {
  let records = createSeed(now)
  let sequence = records.length

  return {
    listVisible(date: DateString): Booking[] {
      return records.filter((record) => record.date === date && !record.hidden).map(toBooking)
    },

    listAll(date: DateString): MockRecord[] {
      return records.filter((record) => record.date === date).map((record) => ({ ...record }))
    },

    find(id: string): MockRecord | undefined {
      const record = records.find((item) => item.id === id)
      return record ? { ...record } : undefined
    },

    insert(draft: BookingDraft): Booking {
      sequence += 1
      const record: MockRecord = { ...draft, id: `booking-${sequence}`, hidden: false }
      records = [...records, record]
      return toBooking(record)
    },

    /** Replaces a known record; the caller guarantees existence via `find`. */
    replace(id: string, draft: BookingDraft): Booking {
      const index = records.findIndex((record) => record.id === id)
      if (index === -1) throw new Error(`[mockStore] cannot replace unknown booking "${id}"`)
      const next: MockRecord = { ...draft, id, hidden: records[index]?.hidden ?? false }
      records = records.map((record, position) => (position === index ? next : record))
      return toBooking(next)
    },

    remove(id: string): boolean {
      const existed = records.some((record) => record.id === id)
      records = records.filter((record) => record.id !== id)
      return existed
    },

    reveal(id: string): void {
      records = records.map((record) => (record.id === id ? { ...record, hidden: false } : record))
    },

    reset(): void {
      records = createSeed(now)
      sequence = records.length
    },
  }
}

/** Module-level singleton: the in-memory database every mock server instance shares. */
export const mockStore = createMockBookingStore()
