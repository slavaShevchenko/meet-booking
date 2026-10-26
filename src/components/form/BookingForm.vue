<script setup lang="ts">
import { computed } from 'vue'
import { TITLE_MAX_LENGTH } from '../../config/schedule'
import { useBookingForm } from '../../composables/useBookingForm'
import { formatDuration } from '../../lib/format'
import { durationMinutes } from '../../lib/time'
import Alert from '../ui/Alert.vue'
import Button from '../ui/Button.vue'
import Input from '../ui/Input.vue'
import Modal from '../ui/Modal.vue'
import TimeSelect from './TimeSelect.vue'

const {
  isOpen,
  isEdit,
  heading,
  dateLabel,
  isPastDay,
  isSubmitting,
  submitError,
  input,
  validation,
  startOptions,
  endOptions,
  canSubmit,
  fieldError,
  close,
  setStart,
  setEnd,
  setTitle,
  submit,
} = useBookingForm()

const durationLabel = computed(() => formatDuration(durationMinutes(input.value)))
const submitErrorTitle = computed(() =>
  submitError.value?.isConflict ? 'Слот уже занят' : 'Не удалось сохранить бронь',
)
const submitAction = computed(() => (isEdit.value ? 'Сохранить' : 'Забронировать'))

async function onSubmit(): Promise<void> {
  await submit()
}
</script>

<template>
  <Modal :open="isOpen" :title="heading" :description="dateLabel" @close="close">
    <form id="booking-form" class="booking-form" novalidate @submit.prevent="onSubmit">
      <Alert v-if="isPastDay" tone="warning" role="status">
        Прошедший день — создавать и менять брони нельзя.
      </Alert>

      <Alert
        v-if="submitError"
        :tone="submitError.isConflict ? 'warning' : 'error'"
        :title="submitErrorTitle"
      >
        <p class="booking-form__message">{{ submitError.message }}</p>
        <p v-if="submitError.isConflict" class="booking-form__note">
          Расписание обновлено с сервера. Введённые данные сохранены — выберите другое время.
        </p>
      </Alert>

      <Alert
        v-else-if="!validation.valid"
        tone="error"
        :title="`Проверьте данные (${validation.errors.length})`"
      >
        <ul class="booking-form__issues">
          <li v-for="message in validation.errors" :key="message">{{ message }}</li>
        </ul>
      </Alert>

      <Input
        :model-value="input.title"
        label="Название встречи"
        placeholder="Например, Синхрон команды"
        hint="Необязательно"
        :maxlength="TITLE_MAX_LENGTH"
        :error="fieldError('title')"
        :disabled="isSubmitting"
        @update:model-value="setTitle"
      />

      <div class="booking-form__row">
        <TimeSelect
          :model-value="input.start"
          label="Начало"
          :options="startOptions"
          :error="fieldError('start')"
          :disabled="isSubmitting || isPastDay"
          @update:model-value="setStart"
        />
        <TimeSelect
          :model-value="input.end"
          label="Окончание"
          :options="endOptions"
          :error="fieldError('end')"
          :disabled="isSubmitting || isPastDay || !input.start"
          @update:model-value="setEnd"
        />
      </div>

      <p class="booking-form__summary">
        Длительность:
        <strong>{{ durationLabel || '—' }}</strong>
      </p>
    </form>

    <template #footer>
      <Button variant="ghost" :disabled="isSubmitting" @click="close">Отмена</Button>
      <!-- The submit button lives in the modal footer, outside the form element. -->
      <Button
        type="submit"
        form="booking-form"
        variant="primary"
        :loading="isSubmitting"
        :disabled="!canSubmit"
      >
        {{ submitAction }}
      </Button>
    </template>
  </Modal>
</template>

<style scoped>
.booking-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.booking-form__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.booking-form__message {
  margin: 0 0 4px;
}

.booking-form__note {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.booking-form__issues {
  margin: 0;
  padding-left: 18px;
}

.booking-form__summary {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.booking-form__summary strong {
  color: var(--text-strong);
  font-weight: 600;
}

@media (max-width: 480px) {
  .booking-form__row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
