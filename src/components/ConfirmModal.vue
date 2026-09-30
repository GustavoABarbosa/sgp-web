<script setup lang="ts">
import Modal from './Modal.vue'
import BaseButton from './BaseButton.vue'

const open = defineModel<boolean>({ required: true })

withDefaults(
  defineProps<{
    title: string
    confirmLabel?: string
    cancelLabel?: string
    confirmDanger?: boolean
    loading?: boolean
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

function cancel() {
  open.value = false
  emit('cancel')
}

function onOpenChange(value: boolean) {
  if (!value) cancel()
}
</script>

<template>
  <Modal :model-value="open" :title="title" @update:model-value="onOpenChange">
    <div class="text-sm text-text">
      <slot />
    </div>
    <template #footer>
      <BaseButton variant="secondary" :disabled="loading" @click="cancel">{{ cancelLabel }}</BaseButton>
      <BaseButton :variant="confirmDanger ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </Modal>
</template>
