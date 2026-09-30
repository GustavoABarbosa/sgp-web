<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{ label: string }>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <label class="block">
    <span class="sr-only">{{ label }}</span>
    <input
      v-model="model"
      type="search"
      :placeholder="label"
      class="rounded-lg border border-border bg-white px-3 py-1"
      v-bind="$attrs"
    />
  </label>
</template>
