<script setup lang="ts">
import { computed, useId } from 'vue'
import type { SelectOption } from '../../types/ui'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    options: SelectOption[]
    placeholder?: string
    hint?: string
    error?: string
    disabled?: boolean
  }>(),
  { placeholder: '', hint: undefined, error: undefined, disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
const errorId = `${id}-error`
const hintId = `${id}-hint`
const describedBy = computed(() => {
  if (props.error) return errorId
  return props.hint ? hintId : undefined
})

/** Unavailable options keep their reason visible instead of just being greyed out. */
function optionLabel(option: SelectOption): string {
  return option.hint ? `${option.label} — ${option.hint}` : option.label
}

function onChange(event: Event): void {
  const target = event.target as HTMLSelectElement | null
  emit('update:modelValue', target?.value ?? '')
}
</script>

<template>
  <div class="field">
    <label class="field__label" :for="id">{{ label }}</label>

    <div class="field__wrap">
      <select
        :id="id"
        class="field__control"
        :class="{ 'field__control--invalid': Boolean(error) }"
        :value="modelValue"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        @change="onChange"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ optionLabel(option) }}
        </option>
      </select>
      <span class="field__chevron" aria-hidden="true">▾</span>
    </div>

    <p v-if="error" :id="errorId" class="field__message field__message--error">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="field__message">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field__label {
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-muted);
}

.field__wrap {
  position: relative;
  display: flex;
}

.field__control {
  width: 100%;
  box-sizing: border-box;
  appearance: none;
  padding: 9px 32px 9px 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-strong);
  font: inherit;
}

.field__control:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
  border-color: var(--accent);
}

.field__control:disabled {
  background: var(--surface-muted);
  color: var(--text-muted);
  cursor: not-allowed;
}

.field__control--invalid {
  border-color: var(--danger);
}

.field__chevron {
  position: absolute;
  right: 12px;
  align-self: center;
  pointer-events: none;
  color: var(--text-muted);
}

.field__message {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.field__message--error {
  color: var(--danger);
}
</style>
