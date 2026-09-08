<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

const open = ref(false)
const root = ref<HTMLElement | null>(null)

onClickOutside(root, () => {
  open.value = false
})

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}
</script>

<template>
  <div ref="root" class="relative">
    <slot name="trigger" :open="open" :toggle="toggle">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-full border border-border p-1.5 text-text hover:bg-page"
        :aria-expanded="open"
        aria-haspopup="menu"
        title="Ações"
        @click="toggle"
      >
        <Icon name="ph:dots-three-bold" :class="[
          'size-5 transition-all duration-200',
          open ? 'rotate-90' : ''
        ]" />
      </button>
    </slot>

    <div
      v-if="open"
      role="menu"
      class="absolute right-0 z-50 mt-1 min-w-36 overflow-hidden rounded-lg border border-border bg-surface py-1 text-text shadow-lg"
    >
      <slot :close="close" />
    </div>
  </div>
</template>
