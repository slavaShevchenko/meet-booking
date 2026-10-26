import { MOCK_LATENCY_MAX_MS, MOCK_LATENCY_MIN_MS } from '../config/schedule'
import { findIssueByCode, validateBookingDraft } from '../lib/validation'
import type {
  CreateBookingBody,
  ListBookingsQuery,
  ListBookingsResponse,
  UpdateBookingBody,
} from '../types/api'
import { ApiError } from '../types/api'
import type { Booking, BookingDraft, BookingPatch } from '../types/booking'
import { mockStore, type MockBookingStore } from './mockStore'

export type FailureMode = 'network' | 'internal'

export interface MockServer {
  listBookings(query: ListBookingsQuery): Promise<ListBookingsResponse>
  createBooking(body: CreateBookingBody): Promise<Booking>
  updateBooking(id: string, body: UpdateBookingBody): Promise<Booking>
  deleteBooking(id: string): Promise<void>
  /** One-shot failure injection, so the error/retry UI states can be exercised by hand. */
  injectFailure(mode: FailureMode): void
  reset(): void
}

export interface MockServerDeps {
  store?: MockBookingStore
  latency?: () => number
  now?: () => Date
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

function defaultLatency(): number {
  const span = MOCK_LATENCY_MAX_MS - MOCK_LATENCY_MIN_MS
  return MOCK_LATENCY_MIN_MS + Math.round(Math.random() * span)
}

/** `PATCH` semantics: absent fields keep their value, an empty title clears it. */
function mergePatch(existing: Booking, patch: BookingPatch): BookingDraft {
  const draft: BookingDraft = {
    date: patch.date ?? existing.date,
    start: patch.start ?? existing.start,
    end: patch.end ?? existing.end,
  }
  const title = patch.title ?? existing.title
  if (title) draft.title = title
  return draft
}

export function createMockServer(deps: MockServerDeps = {}): MockServer {
  const store = deps.store ?? mockStore
  const now = deps.now ?? (() => new Date())
  const latency = deps.latency ?? defaultLatency
  let pendingFailure: FailureMode | null = null

  /**
   * Runs the same business rules the form does, but against the authoritative data set
   * (including hidden records), and maps the outcome onto HTTP semantics.
   */
  function assertValid(draft: BookingDraft, editingId: string | null): void {
    const result = validateBookingDraft(draft, {
      bookings: store.listAll(draft.date),
      editingId,
      now: now(),
    })
    if (result.valid) return

    const conflict = findIssueByCode(result, 'CONFLICT')
    if (conflict) {
      // The competing booking may still be hidden from GET. Reveal it, so the refresh the UI
      // performs after a 409 shows the day exactly as the server sees it.
      if (conflict.conflictingBookingId) store.reveal(conflict.conflictingBookingId)
      throw new ApiError(
        {
          error: 'CONFLICT',
          message: conflict.message,
          conflictingBookingId: conflict.conflictingBookingId,
          fieldErrors: result.fieldErrors,
          issues: result.issues,
        },
        409,
      )
    }

    throw new ApiError(
      {
        error: 'VALIDATION_ERROR',
        message: result.errors[0] ?? 'Некорректные данные брони',
        fieldErrors: result.fieldErrors,
        issues: result.issues,
      },
      400,
    )
  }

  async function respond<T>(handler: () => T): Promise<T> {
    await delay(latency())
    if (pendingFailure === 'network') {
      pendingFailure = null
      throw ApiError.network()
    }
    if (pendingFailure === 'internal') {
      pendingFailure = null
      throw ApiError.internal()
    }
    return handler()
  }

  return {
    listBookings(query: ListBookingsQuery): Promise<ListBookingsResponse> {
      return respond(() => store.listVisible(query.date))
    },

    createBooking(body: CreateBookingBody): Promise<Booking> {
      return respond(() => {
        assertValid(body, null)
        return store.insert(body)
      })
    },

    updateBooking(id: string, body: UpdateBookingBody): Promise<Booking> {
      return respond(() => {
        const existing = store.find(id)
        if (!existing) throw ApiError.notFound()
        const merged = mergePatch(existing, body)
        // The edited booking is excluded from the overlap check, so it never conflicts with itself.
        assertValid(merged, id)
        return store.replace(id, merged)
      })
    },

    deleteBooking(id: string): Promise<void> {
      return respond(() => {
        if (!store.remove(id)) throw ApiError.notFound()
      })
    },

    injectFailure(mode: FailureMode): void {
      pendingFailure = mode
    },

    reset(): void {
      pendingFailure = null
      store.reset()
    },
  }
}

export const mockServer = createMockServer()
