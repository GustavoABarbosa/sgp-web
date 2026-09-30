<script setup lang="ts">
import { onMounted, ref, useId, watch } from 'vue'

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

const titleId = useId()
const dialogRef = ref<HTMLDialogElement | null>(null)

function sync(value: boolean) {
  const el = dialogRef.value
  if (!el) return
  if (value && !el.open) el.showModal()
  else if (!value && el.open) el.close()
}

watch(open, sync, { flush: 'post' })
onMounted(() => sync(open.value))

function close() {
  open.value = false
}
</script>

<template>
  <dialog
    ref="dialogRef"
    :aria-labelledby="titleId"
    class="m-auto max-h-[90vh] w-[calc(100%-2rem)] flex-col rounded-lg bg-surface p-0 text-text shadow-2xl backdrop:bg-black/45 open:flex"
    :class="size === 'lg' ? 'max-w-4xl' : 'max-w-md'"
    @close="close"
    @click.self="close"
  >
    <template v-if="open">
      <div class="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <h2 :id="titleId" class="mb-0">{{ title }}</h2>
        <div class="flex items-center gap-2">
          <slot name="actions" :close="close" />
          <button
            type="button"
            class="rounded-full p-1 text-muted hover:bg-page hover:text-text"
            aria-label="Fechar"
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
    </template>
  </dialog>
</template>
