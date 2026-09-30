<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  to?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()

const LINK_CLASS = 'text-text/70 no-underline transition-all duration-300 hover:text-primary'
const itemClass = (index: number) => (index === 0 ? 'mb-0 text-2xl font-semibold' : 'mb-0 text-lg')
</script>

<template>
  <h1 v-if="items.length === 1" :class="['flex flex-wrap items-baseline', itemClass(0)]">{{ items[0]!.label }}</h1>
  <nav v-else aria-label="Navegação estrutural">
    <ol class="m-0 flex list-none flex-wrap items-baseline gap-x-2 gap-y-1 p-0">
      <li
        v-for="(item, index) in items"
        :key="`${item.label}-${index}`"
        class="flex items-baseline gap-x-2"
        :aria-current="index === items.length - 1 ? 'page' : undefined"
      >
        <span v-if="index > 0" class="select-none px-0.5 text-lg text-muted/50" aria-hidden="true">/</span>
        <h1 v-if="index === items.length - 1" :class="itemClass(index)">{{ item.label }}</h1>
        <span v-else :class="itemClass(index)">
          <RouterLink v-if="item.to" :to="item.to" :class="LINK_CLASS">{{ item.label }}</RouterLink>
          <template v-else>{{ item.label }}</template>
        </span>
      </li>
    </ol>
  </nav>
</template>
