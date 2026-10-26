<script setup lang="ts">
import type { DateString } from '../../types/booking'
import type { DayChip } from '../../types/schedule'
import Button from '../ui/Button.vue'

defineProps<{
  days: DayChip[]
  canGoPrev: boolean
  canGoNext: boolean
}>()

const emit = defineEmits<{
  prev: []
  next: []
  today: []
  select: [date: DateString]
}>()

function dayAriaLabel(day: DayChip): string {
  const caption = day.caption ? `${day.caption}, ` : ''
  const past = day.isPast ? ', прошедший день' : ''
  return `${caption}${day.weekdayLabel}, ${day.dayLabel}${past}`
}
</script>

<template>
  <nav class="navigator" aria-label="Навигация по дням">
    <div class="navigator__controls">
      <Button
        variant="ghost"
        size="sm"
        :disabled="!canGoPrev"
        aria-label="Предыдущий день"
        title="Предыдущий день"
        @click="emit('prev')"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          <path
            d="M10 3 5 8l5 5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        :disabled="!canGoNext"
        aria-label="Следующий день"
        title="Следующий день"
        @click="emit('next')"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          <path
            d="m6 3 5 5-5 5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </Button>
    </div>

    <ul class="navigator__days">
      <li v-for="day in days" :key="day.date" class="navigator__item">
        <button
          type="button"
          class="navigator__day"
          :class="{
            'navigator__day--selected': day.isSelected,
            'navigator__day--today': day.isToday,
            'navigator__day--past': day.isPast,
          }"
          :aria-pressed="day.isSelected"
          :aria-label="dayAriaLabel(day)"
          @click="emit('select', day.date)"
        >
          <span class="navigator__weekday">{{ day.weekdayLabel }}</span>
          <span class="navigator__date">{{ day.dayLabel }}</span>
          <span v-if="day.caption" class="navigator__caption">{{ day.caption }}</span>
        </button>
      </li>
    </ul>

    <Button v-if="canGoPrev" variant="ghost" size="sm" @click="emit('today')">Сегодня</Button>
  </nav>
</template>

<style scoped>
.navigator {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.navigator__controls {
  display: flex;
  gap: 2px;
  width: 52px;
}

.navigator__controls .btn--sm {
  flex: 1 1 auto;
  padding-left: 0;
  padding-right: 0;
}

.navigator__days {
  display: flex;
  gap: 10px;
  flex: 1 1 320px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
}

.navigator__item {
  flex: 1 1 0;
  min-width: 116px;
}

.navigator__day {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  width: 100%;
  height: 70px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-muted);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.navigator__day:hover {
  border-color: var(--accent-border);
}

.navigator__day:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.navigator__day--selected {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--text-strong);
}

.navigator__day--past {
  opacity: 0.6;
}

.navigator__weekday {
  font-size: 0.78rem;
  text-transform: capitalize;
}

.navigator__date {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-strong);
}

.navigator__caption {
  font-size: 0.7rem;
  color: var(--accent-strong);
}
</style>
