import { bookingApi, toApiError } from '../api/client'
import { useBookingsStore } from '../store/bookings'
import type { ApiResult, BookingApi } from '../types/api'
import type { Booking, BookingDraft, BookingPatch, DateString } from '../types/booking'

export interface LoadOptions {
  /** Re-read the day even when it is already in the store. */
  force?: boolean
}

/**
 * The only place that talks to the API. Failures come back as values (`ApiResult`), so callers
 * decide what to show and the form never loses what the user typed.
 */
export function useBookings(api: BookingApi = bookingApi) {
  const store = useBookingsStore()

  async function loadDate(
    date: DateString,
    options: LoadOptions = {},
  ): Promise<ApiResult<Booking[]>> {
    if (!date) return { ok: true, data: [] }

    const cached = store.byDate.value[date]
    if (cached && !options.force) return { ok: true, data: cached }

    store.beginLoading()
    try {
      const bookings = await api.list(date)
      store.setBookings(date, bookings)
      store.setListError(null)
      return { ok: true, data: bookings }
    } catch (error) {
      const apiError = toApiError(error)
      store.setListError(apiError)
      return { ok: false, error: apiError }
    } finally {
      store.endLoading()
    }
  }

  async function loadDates(dates: readonly DateString[]): Promise<void> {
    await Promise.all(dates.map((date) => loadDate(date)))
  }

  async function refresh(date: DateString): Promise<ApiResult<Booking[]>> {
    return loadDate(date, { force: true })
  }

  async function refreshDates(dates: readonly DateString[]): Promise<void> {
    await Promise.all(dates.map((date) => refresh(date)))
  }

  async function mutate(
    run: () => Promise<Booking>,
    date: DateString,
  ): Promise<ApiResult<Booking>> {
    store.setSubmitting(true)
    try {
      const booking = await run()
      store.applyUpsert(booking)
      return { ok: true, data: booking }
    } catch (error) {
      const apiError = toApiError(error)
      // 409 means the server knows something the UI did not: re-read the day so the grid
      // reflects reality, while the form stays open with the user's input intact.
      if (apiError.isConflict) await refresh(date)
      return { ok: false, error: apiError }
    } finally {
      store.setSubmitting(false)
    }
  }

  async function createBooking(draft: BookingDraft): Promise<ApiResult<Booking>> {
    return mutate(() => api.create(draft), draft.date)
  }

  /** `date` is the day to re-read when the server answers 409. */
  async function updateBooking(
    id: string,
    patch: BookingPatch,
    date: DateString,
  ): Promise<ApiResult<Booking>> {
    return mutate(() => api.update(id, patch), date)
  }

  async function removeBooking(booking: Booking): Promise<ApiResult<void>> {
    store.setSubmitting(true)
    try {
      await api.remove(booking.id)
      store.applyRemoval(booking)
      return { ok: true, data: undefined }
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.code === 'NOT_FOUND') {
        // DELETE is idempotent: the booking is already gone, which is what the user asked for.
        store.applyRemoval(booking)
        return { ok: true, data: undefined }
      }
      store.setListError(apiError)
      return { ok: false, error: apiError }
    } finally {
      store.setSubmitting(false)
    }
  }

  function requestDelete(booking: Booking): void {
    store.requestDelete(booking)
  }

  function cancelDelete(): void {
    store.cancelDelete()
  }

  async function confirmDelete(): Promise<ApiResult<void>> {
    const booking = store.pendingDelete.value
    store.cancelDelete()
    if (!booking) return { ok: true, data: undefined }
    return removeBooking(booking)
  }

  return {
    loadDate,
    loadDates,
    refresh,
    refreshDates,
    createBooking,
    updateBooking,
    removeBooking,
    requestDelete,
    cancelDelete,
    confirmDelete,
  }
}
