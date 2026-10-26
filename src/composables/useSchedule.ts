import { computed, watch } from 'vue'
import type { ApiError } from '../types/api'
import {
  GRID_HEIGHT_PX,
  SLOT_HEIGHT_PX,
  buildCardModel,
  buildDayCells,
  type ScheduleContext,
} from '../lib/schedule'
import { useBookingsStore } from '../store/bookings'
import type { Booking, DateString } from '../types/booking'
import type { ColumnState, ScheduleColumn } from '../types/schedule'
import { useBookings } from './useBookings'
import { useClock } from './useClock'
import { useDateNavigation } from './useDateNavigation'

function resolveColumnState(bookings: Booking[] | undefined, error: ApiError | null): ColumnState {
  if (bookings === undefined) return error ? 'error' : 'loading'
  return bookings.length === 0 ? 'empty' : 'ready'
}

/**
 * Turns store data into ready-to-render view models and keeps the visible days in sync with
 * the server, so the grid components stay purely presentational.
 */
export function useSchedule() {
  const store = useBookingsStore()
  const { now } = useClock()
  const navigation = useDateNavigation()
  const { loadDates, refreshDates } = useBookings()

  const columns = computed<ScheduleColumn[]>(() =>
    navigation.visibleDays.value.map((day) => {
      const bookings = store.byDate.value[day.date]
      const context: ScheduleContext = {
        date: day.date,
        bookings: bookings ?? [],
        now: now.value,
      }
      return {
        ...day,
        state: resolveColumnState(bookings, store.listError.value),
        cells: buildDayCells(context),
        // A past day cannot be booked any more, so its cards are read-only.
        cards: (bookings ?? []).map((booking) => buildCardModel(booking, !day.isPast)),
      }
    }),
  )

  const selectedDate = computed<DateString>(() => navigation.selectedDate.value)
  const gridHeightPx = GRID_HEIGHT_PX
  const slotHeightPx = SLOT_HEIGHT_PX

  watch(
    navigation.visibleDates,
    (dates) => {
      void loadDates(dates)
    },
    { immediate: true },
  )

  function reload(): void {
    void refreshDates(navigation.visibleDates.value)
  }

  return {
    columns,
    visibleDays: navigation.visibleDays,
    selectedDate,
    anchorDate: navigation.anchorDate,
    canGoPrev: navigation.canGoPrev,
    canGoNext: navigation.canGoNext,
    prev: navigation.prev,
    next: navigation.next,
    goToToday: navigation.goToToday,
    select: navigation.select,
    loading: store.loading,
    error: store.listError,
    pendingDelete: store.pendingDelete,
    submitting: store.submitting,
    gridHeightPx,
    slotHeightPx,
    reload,
  }
}
