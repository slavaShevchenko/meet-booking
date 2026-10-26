import { computed } from 'vue'
import { WORK_DAY_START } from '../config/schedule'
import { toDraft } from '../lib/booking'
import { isBeforeDay } from '../lib/date'
import { formatDayMonth, formatWeekday } from '../lib/format'
import {
  buildEndOptions,
  buildStartOptions,
  defaultEndFor,
  firstBookableStart,
  resolveEndForStart,
  type ScheduleContext,
} from '../lib/schedule'
import { EMPTY_VALIDATION, validateBookingInput } from '../lib/validation'
import { useBookingsStore } from '../store/bookings'
import type { Booking, BookingInput, DateString, TimeString } from '../types/booking'
import type { BookingField, ValidationResult } from '../types/validation'
import { useBookings } from './useBookings'
import { useClock } from './useClock'

/** Create/edit form: model, live validation, slot options and submit — no API calls of its own. */
export function useBookingForm() {
  const store = useBookingsStore()
  const { now, today } = useClock()
  const { createBooking, updateBooking } = useBookings()

  const isOpen = computed(() => store.form.open)
  const isEdit = computed(() => store.form.mode === 'edit')
  const heading = computed(() => (isEdit.value ? 'Редактирование брони' : 'Новая бронь'))
  const dateLabel = computed(() => {
    const date = store.form.date
    return date ? `${formatWeekday(date)}, ${formatDayMonth(date)}` : ''
  })
  const isPastDay = computed(() => isBeforeDay(store.form.date, today.value))
  const isSubmitting = computed(() => store.submitting.value)
  const submitError = computed(() => store.formError.value)

  const input = computed<BookingInput>(() => ({
    date: store.form.date,
    start: store.form.start,
    end: store.form.end,
    title: store.form.title,
  }))

  const context = computed<ScheduleContext>(() => ({
    date: store.form.date,
    bookings: store.bookingsOf(store.form.date),
    editingId: store.form.editingId,
    now: now.value,
  }))

  const validation = computed<ValidationResult>(() =>
    isOpen.value ? validateBookingInput(input.value, context.value) : EMPTY_VALIDATION,
  )
  const startOptions = computed(() => buildStartOptions(context.value))
  const endOptions = computed(() =>
    buildEndOptions(store.form.start, context.value, store.form.end),
  )
  const canSubmit = computed(() => validation.value.valid && !isSubmitting.value)

  function fieldError(field: BookingField): string | undefined {
    return validation.value.fieldErrors[field]
  }

  function openCreate(payload: { date: DateString; start?: TimeString | null }): void {
    const contextForDate: ScheduleContext = {
      date: payload.date,
      bookings: store.bookingsOf(payload.date),
      now: now.value,
    }
    const start = payload.start ?? firstBookableStart(contextForDate) ?? WORK_DAY_START
    store.openCreateForm({ date: payload.date, start, end: defaultEndFor(start) })
  }

  function openEdit(booking: Booking): void {
    store.openEditForm(booking)
  }

  function close(): void {
    store.closeForm()
  }

  function setStart(start: TimeString): void {
    // The end follows the start: keeping the old one would silently produce an invalid range.
    store.patchForm({ start, end: resolveEndForStart(start, store.form.end, context.value) })
  }

  function setEnd(end: TimeString): void {
    store.patchForm({ end })
  }

  function setTitle(title: string): void {
    store.patchForm({ title })
  }

  async function submit(): Promise<boolean> {
    if (!validation.value.valid) return false

    store.setFormError(null)
    const draft = toDraft(input.value)
    const result =
      isEdit.value && store.form.editingId
        ? await updateBooking(store.form.editingId, draft, draft.date)
        : await createBooking(draft)

    if (!result.ok) {
      // The form stays open and untouched — only the error is added (rule 8).
      store.setFormError(result.error)
      return false
    }

    close()
    return true
  }

  return {
    isOpen,
    isEdit,
    heading,
    dateLabel,
    isPastDay,
    isSubmitting,
    submitError,
    input,
    validation,
    startOptions,
    endOptions,
    canSubmit,
    fieldError,
    openCreate,
    openEdit,
    close,
    setStart,
    setEnd,
    setTitle,
    submit,
  }
}
