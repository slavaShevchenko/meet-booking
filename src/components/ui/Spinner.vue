<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Accessible name; also read out by screen readers via `role="status"`. */
    label?: string
    size?: number
  }>(),
  { label: 'Загрузка', size: 18 },
)
</script>

<template>
  <span class="spinner" role="status" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg class="spinner__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle class="spinner__track" cx="12" cy="12" r="10" />
      <circle class="spinner__arc" cx="12" cy="12" r="10" />
    </svg>
    <span class="visually-hidden">{{ label }}</span>
  </span>
</template>

<style scoped>
.spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner__svg {
  width: 100%;
  height: 100%;
  animation: spinner-rotate 0.9s linear infinite;
}

.spinner__track,
.spinner__arc {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
}

.spinner__track {
  stroke: var(--border-strong);
}

.spinner__arc {
  stroke: currentColor;
  stroke-dasharray: 46 64;
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
