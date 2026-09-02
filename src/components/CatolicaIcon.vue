<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: 'SGP Católica',
  },
)
</script>

<template>
  <svg
    class="inline-block w-auto shrink-0"
    viewBox="0 0 96 101"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    :aria-label="title"
  >
    <title>{{ title }}</title>
    <path d="M45 49V100.5L0 73.5V20.5L45 49Z" />
    <path d="M45 15V42L22 28.5V0L45 15Z" />
    <path d="M50.5 49V100.5L95.5 73.5V20.5L50.5 49Z" />
    <path d="M50.5 15V42L73.5 28.5V0L50.5 15Z" />
  </svg>
</template>
