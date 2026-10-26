<script setup lang="ts">
import type { ApiError } from '../../types/api'
import type { Booking, DateString, TimeString } from '../../types/booking'
import type { ScheduleColumn } from '../../types/schedule'
import Alert from '../ui/Alert.vue'
import Button from '../ui/Button.vue'
import ScheduleDayColumn from './ScheduleDayColumn.vue'
import TimeAxis from './TimeAxis.vue'

defineProps<{
  columns: ScheduleColumn[]
  loading: boolean
  error: ApiError | null
  gridHeightPx: number
  slotHeightPx: number
}>()

const emit = defineEmits<{
  create: [payload: { date: DateString; start: TimeString | null }]
  edit: [booking: Booking]
  delete: [booking: Booking]
  retry: []
}>()
</script>

<template>
  <div class="schedule">
    <Alert v-if="error" tone="error" title="Не удалось загрузить расписание">
      <p class="schedule__error-text">{{ error.message }}</p>
      <Button size="sm" variant="secondary" :loading="loading" @click="emit('retry')">
        Повторить
      </Button>
    </Alert>

    <div class="schedule__scroll">
      <div
        class="schedule__grid"
        :style="{ '--grid-h': `${gridHeightPx}px`, '--day-columns': columns.length }"
        :aria-busy="loading || undefined"
      >
        <TimeAxis />
        <ScheduleDayColumn
          v-for="column in columns"
          :key="column.date"
          :column="column"
          :slot-height-px="slotHeightPx"
          @create="emit('create', $event)"
          @edit="emit('edit', $event)"
          @delete="emit('delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.schedule__error-text {
  margin: 0 0 8px;
}

.schedule__scroll {
  overflow-x: auto;
  padding-bottom: 4px;
}

.schedule__grid {
  display: grid;
  /* The day count comes from the rendered columns, so it follows VISIBLE_DAYS. */
  grid-template-columns: var(--axis-w) repeat(var(--day-columns, 3), minmax(0, 1fr));
  gap: 10px;
  min-width: 640px;
  align-items: start;
}
</style>
