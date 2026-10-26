<script setup lang="ts">
import Button from './Button.vue'
import Modal from './Modal.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    busy?: boolean
  }>(),
  { confirmLabel: 'Удалить', cancelLabel: 'Отмена', busy: false },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Modal :open="open" :title="title" width="sm" @close="emit('cancel')">
    <p class="confirm__message">{{ message }}</p>

    <template #footer>
      <!-- The safe action keeps focus, so an accidental Enter cannot destroy data. -->
      <Button variant="ghost" data-autofocus :disabled="busy" @click="emit('cancel')">
        {{ cancelLabel }}
      </Button>
      <Button variant="danger" :loading="busy" @click="emit('confirm')">
        {{ confirmLabel }}
      </Button>
    </template>
  </Modal>
</template>

<style scoped>
.confirm__message {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text);
}
</style>
