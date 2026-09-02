<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const badgeClass = computed(() => {
  const base = 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase'
  const map: Record<string, string> = {
    draft: 'bg-slate-200 text-slate-600',
    ready: 'bg-green-100 text-success',
    generated: 'bg-green-100 text-success',
    closed: 'bg-red-100 text-danger',
    archived: 'bg-red-100 text-danger',
    active: 'bg-green-100 text-success',
    synced: 'bg-green-100 text-success',
    pending: 'bg-amber-100 text-warning',
    error: 'bg-red-100 text-danger',
  }
  return `${base} ${map[props.status] ?? 'bg-slate-200 text-slate-600'}`
})
</script>

<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>
