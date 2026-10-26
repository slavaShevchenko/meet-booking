import { computed } from 'vue'
import { VISIBLE_DAYS } from '../config/schedule'
import { addDays, dateRange, isBeforeDay, isValidDateKey } from '../lib/date'
import { dayCaption, formatDayMonth, formatWeekday } from '../lib/format'
import { useBookingsStore } from '../store/bookings'
import type { DateString } from '../types/booking'
import type { DayChip } from '../types/schedule'
import { useClock } from './useClock'

/** An anchor remembered from a previous session may point to the past — clamp it to today. */
function resolveAnchor(stored: DateString, today: DateString): DateString {
  return isValidDateKey(stored) && !isBeforeDay(stored, today) ? stored : today
}

/** A window of `VISIBLE_DAYS` days that never starts before today. */
export function useDateNavigation() {
  const store = useBookingsStore()
  const { today } = useClock()

  const anchorDate = computed(() => resolveAnchor(store.preferences.value.anchorDate, today.value))
  const visibleDates = computed(() => dateRange(anchorDate.value, VISIBLE_DAYS))
  const canGoPrev = computed(() => anchorDate.value !== today.value)
  // Going forward is never restricted: the room can be booked arbitrarily far ahead.
  const canGoNext = computed(() => true)

  const selectedDate = computed<DateString>(() =>
    visibleDates.value.includes(store.selectedDate.value)
      ? store.selectedDate.value
      : anchorDate.value,
  )

  const visibleDays = computed<DayChip[]>(() =>
    visibleDates.value.map((date) => ({
      date,
      weekdayLabel: formatWeekday(date, 'short'),
      dayLabel: formatDayMonth(date),
      caption: dayCaption(date, today.value),
      isToday: date === today.value,
      isPast: isBeforeDay(date, today.value),
      isSelected: date === selectedDate.value,
    })),
  )

  function setAnchorDate(date: DateString): void {
    store.setAnchorDate(date)
  }

  function prev(): void {
    if (canGoPrev.value) setAnchorDate(addDays(anchorDate.value, -1))
  }

  function next(): void {
    setAnchorDate(addDays(anchorDate.value, 1))
  }

  function goToToday(): void {
    setAnchorDate(today.value)
  }

  function select(date: DateString): void {
    store.selectDate(date)
  }

  return {
    anchorDate,
    visibleDates,
    visibleDays,
    selectedDate,
    canGoPrev,
    canGoNext,
    prev,
    next,
    goToToday,
    select,
  }
}
