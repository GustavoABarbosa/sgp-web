<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'

defineProps<{
  name: string
}>()
</script>

<template>
  <IconifyIcon :icon="name" aria-hidden="true" />
</template>
