<script setup lang="ts">
import { computed } from 'vue'
import { WORK_DAY_END, WORK_DAY_START } from '../../config/schedule'
import { useClock } from '../../composables/useClock'
import { formatClock, formatDayMonth, formatWeekday } from '../../lib/format'
import Button from '../ui/Button.vue'

const emit = defineEmits<{ create: [] }>()

const { now, today } = useClock()

const clock = computed(() => formatClock(now.value))
const todayLabel = computed(() => `${formatWeekday(today.value)}, ${formatDayMonth(today.value)}`)
const workHours = `${WORK_DAY_START}–${WORK_DAY_END}`
</script>

<template>
  <header class="app-header">
    <div class="app-header__text">
      <h1 class="app-header__title">Переговорная комната</h1>
      <p class="app-header__meta">
        <span>{{ todayLabel }}</span>
        <span class="app-header__dot" aria-hidden="true">•</span>
        <span>Сейчас {{ clock }}</span>
        <span class="app-header__dot" aria-hidden="true">•</span>
        <span>Рабочие часы {{ workHours }}</span>
      </p>
    </div>

    <Button variant="primary" @click="emit('create')">Новая бронь</Button>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.app-header__text {
  min-width: 0;
}

.app-header__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.3px;
}

.app-header__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.app-header__dot {
  opacity: 0.6;
}
</style>
