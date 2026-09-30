<script setup lang="ts" generic="T extends string">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    label: string
    /** Filters keep the label for screen readers only, matching the compact toolbar layout. */
    hideLabel?: boolean
    size?: 'sm' | 'md'
  }>(),
  { size: 'sm' },
)

const model = defineModel<T>({ required: true })
</script>

<template>
  <label class="relative block">
    <span :class="hideLabel ? 'sr-only' : 'mb-1.5 block text-sm font-medium'">{{ label }}</span>
    <span class="relative block">
      <select
        v-model="model"
        class="w-full appearance-none rounded-lg border border-border bg-white bg-none pl-3 pr-10"
        :class="size === 'sm' ? 'py-1' : 'py-2'"
        v-bind="$attrs"
      >
        <slot />
      </select>
      <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
        <Icon name="ph:caret-down" class="size-4" />
      </span>
    </span>
  </label>
</template>
