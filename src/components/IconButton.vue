<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  iconClass?: string
}>()
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center justify-center rounded-full border border-border bg-surface p-1 text-muted hover:bg-page disabled:cursor-not-allowed disabled:opacity-55"
    :aria-label="label"
    :title="label"
  >
    <Icon :name="icon" :class="iconClass ?? 'size-5'" />
  </button>
</template>
