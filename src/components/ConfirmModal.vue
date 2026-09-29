<script setup lang="ts">
const open = defineModel<boolean>({ required: true })

withDefaults(
  defineProps<{
    title: string
    confirmLabel?: string
    cancelLabel?: string
    confirmDanger?: boolean
  }>(),
  {
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    confirmDanger: true,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function close() {
  open.value = false
  emit('cancel')
}

function onConfirm() {
  emit('confirm')
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
    @click.self="close"
  >
    <div class="w-full max-w-md rounded-lg bg-surface p-6 shadow-2xl" role="dialog" aria-modal="true">
      <h2>{{ title }}</h2>
      <div class="text-sm text-text">
        <slot />
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-page"
          @click="close"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-white"
          :class="confirmDanger ? 'bg-danger hover:bg-red-700' : 'bg-primary hover:bg-primary-light'"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
