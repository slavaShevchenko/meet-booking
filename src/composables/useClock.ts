import { computed, shallowRef } from 'vue'
import { createGlobalState, useIntervalFn } from '@vueuse/core'
import { CLOCK_INTERVAL_MS } from '../config/schedule'
import { todayKey } from '../lib/date'
import { nowMinutes } from '../lib/time'

/**
 * One shared clock for the whole app: every "is this slot already in the past?" decision has
 * to agree on the current minute, and a single interval keeps re-renders predictable.
 * VueUse v15 replaced `useNow({ interval })` with a scheduler, so the tick is explicit here.
 */
export const useClock = createGlobalState(() => {
  const now = shallowRef(new Date())

  useIntervalFn(() => {
    now.value = new Date()
  }, CLOCK_INTERVAL_MS)

  const today = computed(() => todayKey(now.value))
  const minutesOfDay = computed(() => nowMinutes(now.value))

  return { now, today, minutesOfDay }
})
