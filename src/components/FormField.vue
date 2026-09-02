<script setup lang="ts">
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label: string
    error?: string
    id?: string
    type?: string
    as?: 'input' | 'textarea' | 'select'
    modelModifiers?: { number?: boolean }
  }>(),
  {
    error: '',
    type: 'text',
    as: 'input',
  },
)

const model = defineModel<string | number>({ required: true })
const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
const hasError = computed(() => Boolean(props.error))

const controlClass = computed(() => [
  'w-full rounded-lg border bg-white px-3 py-2',
  hasError.value ? 'border-danger' : 'focus-visible:border-neutral-400 border-neutral-300',
])
</script>

<template>
  <div class="mb-4">
    <label
      :for="fieldId"
      :class="['block text-sm font-medium', hasError ? 'text-danger' : '']"
    >
      {{ label }}
    </label>

    <select
      v-if="as === 'select'"
      :id="fieldId"
      v-model="model"
      :class="controlClass"
      v-bind="$attrs"
    >
      <slot />
    </select>

    <textarea
      v-else-if="as === 'textarea'"
      :id="fieldId"
      v-model="model"
      :class="controlClass"
      v-bind="$attrs"
    />

    <input
      v-else
      :id="fieldId"
      v-model="model"
      :type="type"
      :class="controlClass"
      v-bind="$attrs"
    />

    <p v-if="error" class="mt-0.5 font-medium text-xs text-danger">{{ error }}</p>
  </div>
</template>
