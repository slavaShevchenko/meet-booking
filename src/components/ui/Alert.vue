<script setup lang="ts">
import type { AlertTone } from '../../types/ui'

withDefaults(
  defineProps<{
    tone?: AlertTone
    title?: string
    /** `alert` interrupts immediately (errors), `status` waits for a pause (informational). */
    role?: 'alert' | 'status'
    dismissible?: boolean
  }>(),
  { tone: 'info', title: '', role: 'alert', dismissible: false },
)

const emit = defineEmits<{ dismiss: [] }>()
</script>

<template>
  <div class="alert" :class="`alert--${tone}`" :role="role">
    <div class="alert__body">
      <p v-if="title" class="alert__title">{{ title }}</p>
      <div class="alert__text">
        <slot />
      </div>
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="alert__close"
      aria-label="Закрыть уведомление"
      @click="emit('dismiss')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-left-width: 3px;
  border-radius: var(--radius-md);
  background: var(--surface);
  font-size: 0.88rem;
}

.alert__body {
  flex: 1;
  min-width: 0;
}

.alert__title {
  margin: 0 0 4px;
  font-weight: 600;
  color: var(--text-strong);
}

.alert__text {
  color: var(--text);
}

.alert__text :deep(ul) {
  margin: 0;
  padding-left: 18px;
}

.alert__close {
  flex: none;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
}

.alert__close:hover {
  color: var(--text-strong);
  background: var(--surface-muted);
}

.alert__close:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.alert--error {
  border-color: var(--danger);
  background: var(--danger-soft);
}

.alert--warning {
  border-color: var(--warning);
  background: var(--warning-soft);
}

.alert--success {
  border-color: var(--success);
  background: var(--success-soft);
}

.alert--info {
  border-color: var(--border-strong);
  background: var(--surface-muted);
}
</style>
