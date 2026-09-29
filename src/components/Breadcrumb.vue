<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  to?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
    <template v-for="(item, index) in items" :key="`${item.label}-${index}`">
      <span v-if="index > 0" class="select-none px-0.5 text-lg text-muted/50" aria-hidden="true">/</span>
      <h1
        v-if="index === 0"
        class="mb-0 text-2xl font-semibold"
      >
        <RouterLink
          v-if="item.to"
          :to="item.to"
          class="text-text/70 no-underline transition-all duration-300 hover:text-primary"
        >
          {{ item.label }}
        </RouterLink>
        <template v-else>{{ item.label }}</template>
      </h1>
      <h2
        v-else
        class="mb-0 text-lg"
      >
        <RouterLink
          v-if="item.to"
          :to="item.to"
          class="text-text/70 no-underline transition-all duration-300 hover:text-primary"
        >
          {{ item.label }}
        </RouterLink>
        <template v-else>{{ item.label }}</template>
      </h2>
    </template>
  </nav>
</template>
