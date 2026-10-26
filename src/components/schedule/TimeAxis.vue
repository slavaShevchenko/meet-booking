<script setup lang="ts">
import { computed } from 'vue'
import { buildTimeAxis, minuteOffsetToPx } from '../../lib/schedule'

const marks = computed(() =>
  buildTimeAxis().map((mark) => ({ time: mark.time, topPx: minuteOffsetToPx(mark.offsetMin) })),
)
</script>

<template>
  <!-- The axis duplicates the times shown on the cards, so it is hidden from AT. -->
  <div class="time-axis" aria-hidden="true">
    <div class="time-axis__spacer" />
    <div class="time-axis__marks">
      <span
        v-for="mark in marks"
        :key="mark.time"
        class="time-axis__mark"
        :style="{ top: `${mark.topPx}px` }"
      >
        {{ mark.time }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.time-axis {
  display: flex;
  flex-direction: column;
}

.time-axis__spacer {
  height: var(--day-header-h);
}

.time-axis__marks {
  position: relative;
  height: var(--grid-h);
}

.time-axis__mark {
  position: absolute;
  right: 8px;
  transform: translateY(-50%);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.time-axis__mark:first-child {
  transform: none;
}

.time-axis__mark:last-child {
  transform: translateY(-100%);
}
</style>
