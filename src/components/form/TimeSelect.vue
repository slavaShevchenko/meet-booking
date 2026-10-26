<script setup lang="ts">
import { computed } from 'vue'
import type { SelectOption } from '../../types/ui'
import Select from '../ui/Select.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    options: SelectOption[]
    error?: string
    hint?: string
    disabled?: boolean
  }>(),
  { error: undefined, hint: undefined, disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const unavailableCount = computed(() => props.options.filter((option) => option.disabled).length)

/**
 * Explains availability without repeating every reason: the options themselves carry the
 * per-slot hint, and this line tells whether the day is tight or completely taken.
 */
const availabilityHint = computed(() => {
  if (props.hint) return props.hint
  if (props.options.length === 0) return 'Нет доступных слотов'
  if (unavailableCount.value === props.options.length) return 'Все слоты недоступны'
  if (unavailableCount.value > 0) return `Недоступно слотов: ${unavailableCount.value}`
  return undefined
})
</script>

<template>
  <Select
    class="time-select"
    :model-value="modelValue"
    :label="label"
    :options="options"
    :error="error"
    :hint="availabilityHint"
    :disabled="disabled"
    placeholder="Выберите время"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<style scoped>
.time-select {
  min-width: 0;
}
</style>
