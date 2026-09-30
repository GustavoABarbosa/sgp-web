<script setup lang="ts">
defineProps<{ label: string; value: string | number }>()
</script>

<template>
  <div class="rounded-lg border border-border bg-page p-4 text-center">
    <div class="text-2xl font-semibold text-primary">{{ value }}</div>
    <div class="mt-1 text-xs uppercase tracking-wide text-muted">{{ label }}</div>
  </div>
</template>
