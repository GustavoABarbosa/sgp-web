<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tags: string[]
  max?: number
}>()

const visible = computed(() => (props.max ? props.tags.slice(0, props.max) : props.tags))
const hidden = computed(() => props.tags.length - visible.value.length)

const TAG_CLASS = 'rounded-lg border border-border bg-page px-2.5 py-1 text-xs font-medium capitalize text-text'
</script>

<template>
  <ul class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
    <li v-for="tag in visible" :key="tag" :class="TAG_CLASS">{{ tag }}</li>
    <li v-if="hidden > 0" :class="[TAG_CLASS, 'inline-flex items-center gap-0.5']" :title="tags.slice(visible.length).join(', ')">
      <Icon name="ph:plus-bold" class="size-3" />
      {{ hidden }}
      <span class="sr-only">tags a mais</span>
    </li>
  </ul>
</template>
