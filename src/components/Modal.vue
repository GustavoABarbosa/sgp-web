<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    size?: 'md' | 'lg'
  }>(),
  {
    size: 'md',
  },
)

const open = defineModel<boolean>({ required: true })

function close() {
  open.value = false
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
    @click.self="close"
  >
    <div
      class="flex max-h-[90vh] w-full flex-col rounded-lg bg-surface shadow-2xl"
      :class="size === 'lg' ? 'max-w-4xl' : 'max-w-md'"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <h2 class="mb-0">{{ title }}</h2>
        <div class="flex items-center gap-2">
          <slot name="actions" :close="close" />
          <button
            type="button"
            class="rounded-full p-1 text-muted hover:bg-page hover:text-text"
            title="Fechar"
            @click="close"
          >
            <Icon name="ph:x" class="size-5" />
          </button>
        </div>
      </div>
      <div class="overflow-y-auto px-6 py-4">
        <slot />
      </div>
      <div v-if="$slots.footer" class="flex justify-end gap-2 border-t border-border px-6 py-4">
        <slot name="footer" :close="close" />
      </div>
    </div>
  </div>
</template>
