<script setup lang="ts">
import { computed } from 'vue'
import type { Booking } from '../../types/booking'
import type { BookingCardModel } from '../../types/schedule'

const props = defineProps<{ card: BookingCardModel }>()

const emit = defineEmits<{
  edit: [booking: Booking]
  delete: [booking: Booking]
}>()

const style = computed(() => ({
  top: `${props.card.topPx}px`,
  height: `${props.card.heightPx}px`,
}))

/** A 30-minute card is too short for three lines, so the duration is dropped. */
const isCompact = computed(() => props.card.heightPx < 48)

const editLabel = computed(() => `Изменить бронь «${props.card.title}», ${props.card.timeLabel}`)
const deleteLabel = computed(() => `Удалить бронь «${props.card.title}», ${props.card.timeLabel}`)
</script>

<template>
  <article
    class="booking-card"
    :class="{ 'booking-card--compact': isCompact, 'booking-card--readonly': !card.editable }"
    :style="style"
  >
    <div class="booking-card__content">
      <span class="booking-card__time">{{ card.timeLabel }}</span>
      <span class="booking-card__title">{{ card.title }}</span>
      <span v-if="card.durationLabel" class="booking-card__duration">{{ card.durationLabel }}</span>
    </div>

    <template v-if="card.editable">
      <!-- A transparent sibling button covers the card: no interactive element is nested
           inside another one, and the delete button stays reachable on top of it. -->
      <button
        type="button"
        class="booking-card__hit"
        :aria-label="editLabel"
        @click="emit('edit', card.booking)"
      />
      <button
        type="button"
        class="booking-card__delete"
        :aria-label="deleteLabel"
        @click="emit('delete', card.booking)"
      >
        ×
      </button>
    </template>
  </article>
</template>

<style scoped>
.booking-card {
  position: absolute;
  left: 4px;
  right: 4px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--accent-border);
  border-left-width: 3px;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--text-strong);
}

.booking-card--readonly {
  border-color: var(--border-strong);
  background: var(--surface-muted);
  color: var(--text-muted);
}

.booking-card__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 26px 5px 8px;
  pointer-events: none;
}

.booking-card__time {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
}

.booking-card__title {
  font-size: 0.8rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.booking-card__duration {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.booking-card--compact .booking-card__content {
  flex-direction: row;
  align-items: baseline;
  gap: 6px;
  padding-top: 7px;
}

.booking-card--compact .booking-card__duration {
  display: none;
}

.booking-card__hit {
  position: absolute;
  inset: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: inherit;
}

.booking-card__hit:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.booking-card__delete {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 1;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

.booking-card__delete:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

.booking-card__delete:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}
</style>
