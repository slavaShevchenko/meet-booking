import { computed, reactive, ref, shallowRef } from 'vue'
import { createGlobalState, useStorage } from '@vueuse/core'
import { UI_STORAGE_KEY } from '../config/schedule'
import { removeBookingById, sortBookings, upsertBooking } from '../lib/booking'
import type { ApiError } from '../types/api'
import type { Booking, DateString, TimeString } from '../types/booking'

export type BookingFormMode = 'create' | 'edit'

/** Only primitives live here, so the form state can be safely proxied and reset. */
export interface BookingFormState {
  open: boolean
  mode: BookingFormMode
  editingId: string | null
  date: DateString
  start: TimeString
  end: TimeString
  title: string
}

export interface UiPreferences {
  /** First day of the visible window. */
  anchorDate: DateString
}

export const useBookingsStore = createGlobalState(() => {
  /**
   * Persistence is limited to UI preferences on purpose: the mock server is the source of
   * truth for bookings, so caching them in localStorage would show a stale day after a reload
   * and hide real conflicts. Only "where the user was looking" is worth remembering.
   */
  const preferences = useStorage<UiPreferences>(UI_STORAGE_KEY, { anchorDate: '' }, localStorage, {
    mergeDefaults: true,
    deep: true,
  })

  /** A date mapped to `undefined` means "not loaded yet"; `[]` means "loaded and empty". */
  const byDate = ref<Record<DateString, Booking[]>>({})
  const selectedDate = ref<DateString>('')
  const loadingCount = ref(0)
  const submitting = ref(false)
  const listError = shallowRef<ApiError | null>(null)
  /** Submit failure of the open form; keeping it outside the form model is what preserves user input. */
  const formError = shallowRef<ApiError | null>(null)
  const pendingDelete = shallowRef<Booking | null>(null)
  const form = reactive<BookingFormState>({
    open: false,
    mode: 'create',
    editingId: null,
    date: '',
    start: '',
    end: '',
    title: '',
  })

  const loading = computed(() => loadingCount.value > 0)

  function bookingsOf(date: DateString): Booking[] {
    return byDate.value[date] ?? []
  }

  function setBookings(date: DateString, bookings: readonly Booking[]): void {
    byDate.value = { ...byDate.value, [date]: sortBookings(bookings) }
  }

  function applyUpsert(booking: Booking): void {
    setBookings(booking.date, upsertBooking(bookingsOf(booking.date), booking))
  }

  function applyRemoval(booking: Booking): void {
    setBookings(booking.date, removeBookingById(bookingsOf(booking.date), booking.id))
  }

  function beginLoading(): void {
    loadingCount.value += 1
  }

  function endLoading(): void {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  function setListError(error: ApiError | null): void {
    listError.value = error
  }

  function setSubmitting(value: boolean): void {
    submitting.value = value
  }

  function openCreateForm(payload: { date: DateString; start: TimeString; end: TimeString }): void {
    Object.assign(form, {
      open: true,
      mode: 'create',
      editingId: null,
      date: payload.date,
      start: payload.start,
      end: payload.end,
      title: '',
    })
    formError.value = null
  }

  function openEditForm(booking: Booking): void {
    Object.assign(form, {
      open: true,
      mode: 'edit',
      editingId: booking.id,
      date: booking.date,
      start: booking.start,
      end: booking.end,
      title: booking.title ?? '',
    })
    formError.value = null
  }

  function patchForm(
    patch: Partial<Pick<BookingFormState, 'date' | 'start' | 'end' | 'title'>>,
  ): void {
    Object.assign(form, patch)
  }

  function closeForm(): void {
    form.open = false
    formError.value = null
  }

  function setFormError(error: ApiError | null): void {
    formError.value = error
  }

  function requestDelete(booking: Booking): void {
    pendingDelete.value = booking
  }

  function cancelDelete(): void {
    pendingDelete.value = null
  }

  function selectDate(date: DateString): void {
    selectedDate.value = date
  }

  function setAnchorDate(date: DateString): void {
    preferences.value.anchorDate = date
  }

  return {
    preferences,
    byDate,
    selectedDate,
    loading,
    submitting,
    listError,
    formError,
    pendingDelete,
    form,
    bookingsOf,
    setBookings,
    applyUpsert,
    applyRemoval,
    beginLoading,
    endLoading,
    setListError,
    setSubmitting,
    openCreateForm,
    openEditForm,
    patchForm,
    closeForm,
    setFormError,
    requestDelete,
    cancelDelete,
    selectDate,
    setAnchorDate,
  }
})
