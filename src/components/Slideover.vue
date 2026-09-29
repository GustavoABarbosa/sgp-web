<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

defineProps<{
  title: string
}>()

const open = defineModel<boolean>({ required: true })

function close() {
  open.value = false
}

onKeyStroke('Escape', () => {
  if (open.value) close()
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 bg-black/45" @click="close" />
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <h2 class="mb-0">{{ title }}</h2>
          <button
            type="button"
            class="rounded-full p-1 text-muted hover:bg-page hover:text-text"
            title="Fechar"
            @click="close"
          >
            <Icon name="ph:x" class="size-5" />
          </button>
        </div>
        <div v-if="$slots.header" class="border-b border-border px-6 py-4">
          <slot name="header" />
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <slot />
        </div>
        <div v-if="$slots.footer" class="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <slot name="footer" :close="close" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
