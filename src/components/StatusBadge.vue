<script setup lang="ts">
import { computed } from 'vue'
import { statusLabel } from '@/shared/utils'

const props = defineProps<{ status: string }>()

const TONES: Record<string, string> = {
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

const tone = computed(() => TONES[props.status] ?? 'bg-slate-200 text-slate-600')
</script>

<template>
  <span :class="['inline-block rounded-full px-2 py-0.5 text-xs font-semibold', tone]">
    <slot>{{ statusLabel(status) }}</slot>
  </span>
</template>
