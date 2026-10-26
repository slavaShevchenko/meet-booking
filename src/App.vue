<script setup lang="ts">
import { computed } from 'vue'
import BookingForm from './components/form/BookingForm.vue'
import AppHeader from './components/layout/AppHeader.vue'
import DateNavigator from './components/layout/DateNavigator.vue'
import ScheduleGrid from './components/schedule/ScheduleGrid.vue'
import ConfirmDialog from './components/ui/ConfirmDialog.vue'
import { useBookingForm } from './composables/useBookingForm'
import { useBookings } from './composables/useBookings'
import { useSchedule } from './composables/useSchedule'
import { displayTitle } from './lib/booking'
import { formatTimeRange } from './lib/format'
import type { Booking, DateString, TimeString } from './types/booking'

const {
  columns,
  visibleDays,
  selectedDate,
  canGoPrev,
  canGoNext,
  prev,
  next,
  goToToday,
  select,
  loading,
  error,
  pendingDelete,
  submitting,
  gridHeightPx,
  slotHeightPx,
  reload,
} = useSchedule()

const { openCreate, openEdit } = useBookingForm()
const { requestDelete, cancelDelete, confirmDelete } = useBookings()

const isDeleteDialogOpen = computed(() => pendingDelete.value !== null)

const deleteMessage = computed(() => {
  const booking = pendingDelete.value
  if (!booking) return ''
  return `«${displayTitle(booking)}», ${formatTimeRange(booking)}. Отменить удаление будет нельзя.`
})

function handleCreate(payload: { date: DateString; start: TimeString | null }): void {
  select(payload.date)
  openCreate({ date: payload.date, start: payload.start })
}

function handleEdit(booking: Booking): void {
  select(booking.date)
  openEdit(booking)
}

function handleHeaderCreate(): void {
  openCreate({ date: selectedDate.value })
}

async function handleDeleteConfirm(): Promise<void> {
  await confirmDelete()
}
</script>

<template>
  <div class="app">
    <a class="skip-link" href="#schedule">Перейти к расписанию</a>

    <AppHeader @create="handleHeaderCreate" />

    <main id="schedule" class="app__main" tabindex="-1">
      <DateNavigator
        :days="visibleDays"
        :can-go-prev="canGoPrev"
        :can-go-next="canGoNext"
        @prev="prev"
        @next="next"
        @today="goToToday"
        @select="select"
      />

      <ScheduleGrid
        :columns="columns"
        :loading="loading"
        :error="error"
        :grid-height-px="gridHeightPx"
        :slot-height-px="slotHeightPx"
        @create="handleCreate"
        @edit="handleEdit"
        @delete="requestDelete"
        @retry="reload"
      />
    </main>

    <!-- Always mounted: the modal inside owns its open state and focus transitions. -->
    <BookingForm />

    <ConfirmDialog
      :open="isDeleteDialogOpen"
      title="Удалить бронь?"
      :message="deleteMessage"
      :busy="submitting"
      @confirm="handleDeleteConfirm"
      @cancel="cancelDelete"
    />
  </div>
</template>
