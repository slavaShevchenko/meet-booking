import type { BookingApi } from '../types/api'
import { ApiError } from '../types/api'
import type { BookingDraft, BookingPatch, DateString } from '../types/booking'
import { mockServer, type MockServer } from './mockServer'

/** Anything that is not an `ApiError` is a transport bug, so it is normalised at the boundary. */
async function guard<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw ApiError.internal('Непредвиденная ошибка при обращении к API', error)
  }
}

/** Normalises a caught value into an `ApiError` for composables that work with results. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return ApiError.internal('Непредвиденная ошибка', error)
}

/**
 * The single entry point for the UI:
 * `GET /api/bookings?date=`, `POST /api/bookings`, `PATCH /api/bookings/:id`, `DELETE /api/bookings/:id`.
 * Replacing the mock with a real backend means supplying another `BookingApi` implementation
 * here (a `fetch`-based one) — no composable, store or component has to change.
 */
export function createBookingApi(server: MockServer = mockServer): BookingApi {
  return {
    list: (date: DateString) => guard(() => server.listBookings({ date })),
    create: (draft: BookingDraft) => guard(() => server.createBooking(draft)),
    update: (id: string, patch: BookingPatch) => guard(() => server.updateBooking(id, patch)),
    remove: (id: string) => guard(() => server.deleteBooking(id)),
  }
}

export const bookingApi: BookingApi = createBookingApi()
