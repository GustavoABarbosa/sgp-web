<script setup lang="ts">
import ConfirmModal from './ConfirmModal.vue'
import { confirmState, settleConfirm } from '@/shared/useConfirm'
</script>

<template>
  <ConfirmModal
    :model-value="confirmState.open"
    :title="confirmState.options.title"
    :confirm-label="confirmState.options.confirmLabel"
    :confirm-danger="confirmState.options.danger ?? true"
    @confirm="settleConfirm(true)"
    @cancel="settleConfirm(false)"
  >
    {{ confirmState.options.message }}
  </ConfirmModal>
</template>
