<script setup lang="ts">
import Breadcrumb, { type BreadcrumbItem } from './Breadcrumb.vue'

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <Breadcrumb :items="items" />
    <div v-if="$slots.default" class="flex flex-wrap items-center gap-2">
      <slot />
    </div>
  </div>
</template>
