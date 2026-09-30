<script setup lang="ts">
import { computed } from 'vue'

export interface BarDatum {
  label: string
  value: number
  /** Scale reference for this bar; defaults to the largest value in the chart. */
  max?: number
  caption?: string
}

const props = defineProps<{
  data: BarDatum[]
  label: string
}>()

const HEIGHT_PX = 120

const largest = computed(() => Math.max(1, ...props.data.map((d) => d.value)))

function barHeight(d: BarDatum) {
  const max = d.max ?? largest.value
  const ratio = max > 0 ? Math.min(d.value / max, 1) : 0
  return `${Math.max(ratio * HEIGHT_PX, 4)}px`
}
</script>

<template>
  <figure class="m-0">
    <figcaption class="sr-only">{{ label }}</figcaption>
    <ul class="m-0 mt-4 flex h-44 list-none items-end gap-2 p-0">
      <li v-for="(d, i) in data" :key="i" class="flex min-w-0 flex-1 flex-col items-center gap-1">
        <div class="min-h-1 w-full rounded-t bg-primary" :style="{ height: barHeight(d) }" aria-hidden="true" />
        <span class="text-center text-xs text-muted">{{ d.label }}</span>
        <span v-if="d.caption" class="text-xs font-medium text-text">{{ d.caption }}</span>
      </li>
    </ul>
  </figure>
</template>
