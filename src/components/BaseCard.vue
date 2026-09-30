<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <section class="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <h2 v-if="title">{{ title }}</h2>
    <slot />
  </section>
</template>
