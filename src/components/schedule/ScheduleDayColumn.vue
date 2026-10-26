<script setup lang="ts">
import type { Booking, DateString, TimeString } from '../../types/booking'
import type { CellStatus, DayCell, ScheduleColumn } from '../../types/schedule'
import Button from '../ui/Button.vue'
import Spinner from '../ui/Spinner.vue'
import BookingCard from './BookingCard.vue'

defineProps<{ column: ScheduleColumn; slotHeightPx: number }>()

const emit = defineEmits<{
  create: [payload: { date: DateString; start: TimeString | null }]
  edit: [booking: Booking]
  delete: [booking: Booking]
}>()

const CELL_HINTS: Record<CellStatus, string> = {
  free: 'свободно, нажмите, чтобы забронировать',
  busy: 'занято',
  past: 'время уже прошло',
}

function cellHint(cell: DayCell): string {
  return `${cell.start}–${cell.end}: ${CELL_HINTS[cell.status]}`
}

function onCellClick(date: DateString, cell: DayCell): void {
  if (cell.selectable) emit('create', { date, start: cell.start })
}
</script>

<template>
  <section
    class="day"
    :class="{ 'day--selected': column.isSelected, 'day--past': column.isPast }"
    :aria-labelledby="`day-${column.date}`"
  >
    <header class="day__header">
      <div class="day__heading">
        <h3 :id="`day-${column.date}`" class="day__title">
          <span class="day__weekday">{{ column.weekdayLabel }}</span>
          <span class="day__date">{{ column.dayLabel }}</span>
        </h3>
        <span v-if="column.caption" class="day__badge">{{ column.caption }}</span>
      </div>

      <Button
        size="sm"
        variant="secondary"
        :disabled="column.isPast"
        :title="column.isPast ? 'Прошедший день нельзя бронировать' : undefined"
        @click="emit('create', { date: column.date, start: null })"
      >
        Забронировать
      </Button>
    </header>

    <div class="day__body">
      <div v-if="column.state === 'loading'" class="day__status">
        <Spinner label="Загрузка броней" />
      </div>

      <p v-else-if="column.state === 'error'" class="day__status day__status--text">
        Данные не загружены
      </p>

      <template v-else>
        <!--
          The cell layer is a pointer affordance: its buttons are removed from the tab order
          and hidden from AT, because the equivalent keyboard path is the «Забронировать»
          button above plus the time selects in the form, which announce why a slot is taken.
        -->
        <div class="day__cells" aria-hidden="true">
          <button
            v-for="cell in column.cells"
            :key="cell.start"
            type="button"
            class="cell"
            :class="`cell--${cell.status}`"
            :style="{ height: `${slotHeightPx}px` }"
            :disabled="!cell.selectable"
            :title="cellHint(cell)"
            tabindex="-1"
            @click="onCellClick(column.date, cell)"
          />
        </div>

        <div class="day__bookings">
          <BookingCard
            v-for="card in column.cards"
            :key="card.booking.id"
            :card="card"
            @edit="emit('edit', $event)"
            @delete="emit('delete', $event)"
          />
        </div>

        <p v-if="column.state === 'empty'" class="day__empty">
          {{
            column.isPast ? 'Прошедший день — бронирование недоступно' : 'Нет броней на этот день'
          }}
        </p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.day {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  overflow: hidden;
}

.day--selected {
  border-color: var(--accent-border);
  box-shadow: 0 0 0 1px var(--accent-border);
}

.day--past {
  background: var(--surface-muted);
}

.day__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: var(--day-header-h);
  box-sizing: border-box;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.day__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.day__title {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-strong);
}

.day__weekday {
  text-transform: capitalize;
}

.day__date {
  font-weight: 400;
  font-size: 0.82rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.day__badge {
  align-self: flex-start;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.7rem;
  font-weight: 600;
}

.day__body {
  position: relative;
  height: var(--grid-h);
}

.day__cells {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.cell {
  width: 100%;
  padding: 0;
  border: none;
  border-bottom: 1px dashed var(--border);
  background: transparent;
}

.cell--free {
  cursor: pointer;
}

.cell--free:hover {
  background: var(--accent-soft);
  box-shadow: inset 2px 0 0 var(--accent);
}

.cell--busy,
.cell--past {
  cursor: default;
}

.cell--past {
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 6px,
    var(--surface-muted) 6px,
    var(--surface-muted) 12px
  );
}

.day__bookings {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.day__bookings > * {
  pointer-events: auto;
}

.day__empty,
.day__status {
  position: absolute;
  inset: auto 12px auto 12px;
  bottom: 12px;
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-muted);
  text-align: center;
}

.day__status {
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.day__status--text {
  color: var(--text-muted);
}
</style>
