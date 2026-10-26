<script setup lang="ts">
import type { ButtonSize, ButtonVariant } from '../../types/ui'
import Spinner from './Spinner.vue'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    type?: 'button' | 'submit'
    disabled?: boolean
    loading?: boolean
  }>(),
  { variant: 'secondary', size: 'md', type: 'button', disabled: false, loading: false },
)
</script>

<template>
  <button
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <Spinner v-if="loading" class="btn__spinner" :size="size === 'sm' ? 14 : 16" />
    <span class="btn__label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.btn:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.btn--md {
  padding: 9px 16px;
}

.btn--sm {
  padding: 5px 10px;
  font-size: 0.85rem;
}

.btn--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}

.btn--primary:not(:disabled):hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.btn--secondary {
  background: var(--surface);
  border-color: var(--border-strong);
  color: var(--text-strong);
}

.btn--secondary:not(:disabled):hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--text-muted);
}

.btn--ghost:not(:disabled):hover {
  background: var(--surface-muted);
  color: var(--text-strong);
}

.btn--danger {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}

.btn--danger:not(:disabled):hover {
  background: var(--danger-hover);
  border-color: var(--danger-hover);
}

.btn__spinner {
  color: currentColor;
}
</style>
