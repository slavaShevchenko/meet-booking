<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useEventListener, useScrollLock } from '@vueuse/core'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    width?: 'sm' | 'md'
  }>(),
  { description: '', width: 'md' },
)

const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLElement | null>(null)
const titleId = useId()
const descriptionId = `${titleId}-description`
const scrollLock = useScrollLock(document.body)

let restoreFocusTo: HTMLElement | null = null

function focusableElements(): HTMLElement[] {
  const root = dialogRef.value
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.offsetWidth > 0 || element.offsetHeight > 0,
  )
}

async function moveFocusInside(): Promise<void> {
  await nextTick()
  const elements = focusableElements()
  const preferred = elements.find((element) => element.dataset.autofocus !== undefined)
  const target = preferred ?? elements[0] ?? dialogRef.value
  target?.focus()
}

function restoreFocus(): void {
  const target = restoreFocusTo
  restoreFocusTo = null
  // The trigger may have been re-rendered while the dialog was open.
  if (target?.isConnected) target.focus()
}

function rememberTrigger(): void {
  restoreFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
}

watch(
  () => props.open,
  (open) => {
    scrollLock.value = open
    if (open) {
      rememberTrigger()
      void moveFocusInside()
    } else {
      restoreFocus()
    }
  },
)

onMounted(() => {
  if (props.open) {
    scrollLock.value = true
    rememberTrigger()
    void moveFocusInside()
  }
})

onBeforeUnmount(() => {
  scrollLock.value = false
  restoreFocus()
})

// Focus trap: Tab cycles inside the dialog, Escape closes it and returns the focus.
useEventListener(document, 'keydown', (event: KeyboardEvent) => {
  if (!props.open) return

  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key !== 'Tab') return

  const elements = focusableElements()
  if (elements.length === 0) {
    event.preventDefault()
    dialogRef.value?.focus()
    return
  }

  const first = elements[0]
  const last = elements[elements.length - 1]
  if (!first || !last) return

  const active = document.activeElement

  if (event.shiftKey && (active === first || active === dialogRef.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal">
        <div class="modal__backdrop" @click="emit('close')" />

        <div
          ref="dialogRef"
          class="modal__dialog"
          :class="`modal__dialog--${width}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
        >
          <header class="modal__header">
            <h2 :id="titleId" class="modal__title">{{ title }}</h2>
            <button
              type="button"
              class="modal__close"
              aria-label="Закрыть диалог"
              @click="emit('close')"
            >
              ×
            </button>
          </header>

          <p v-if="description" :id="descriptionId" class="modal__description">{{ description }}</p>

          <div class="modal__content">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}

.modal__backdrop {
  position: absolute;
  inset: 0;
  background: var(--overlay);
  backdrop-filter: blur(2px);
}

.modal__dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-height: calc(100svh - 32px);
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg);
  box-shadow: var(--shadow);
}

.modal__dialog:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.modal__dialog--sm {
  max-width: 420px;
}

.modal__dialog--md {
  max-width: 520px;
}

.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-strong);
}

.modal__close {
  flex: none;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 1.4rem;
  line-height: 1;
  padding: 0 4px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.modal__close:hover {
  color: var(--text-strong);
  background: var(--surface-muted);
}

.modal__close:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.modal__description {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.modal__content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

@media (min-width: 640px) {
  .modal {
    align-items: center;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}

.modal-enter-active .modal__dialog,
.modal-leave-active .modal__dialog {
  transition: transform 0.18s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal__dialog,
.modal-leave-to .modal__dialog {
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal__dialog,
  .modal-leave-active .modal__dialog {
    transition: none;
  }
}
</style>
