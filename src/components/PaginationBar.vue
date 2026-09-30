<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps<{
  total: number
  limit: number
}>()

const page = defineModel<number>({ required: true })
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))
</script>

<template>
  <nav v-if="pages > 1" aria-label="Paginação" class="mt-4 flex items-center justify-end gap-2 text-sm">
    <BaseButton variant="secondary" size="sm" icon="ph:caret-left" :disabled="page <= 1" @click="page--">
      Anterior
    </BaseButton>
    <span class="text-muted" aria-live="polite">Página {{ page }} de {{ pages }}</span>
    <BaseButton variant="secondary" size="sm" :disabled="page >= pages" @click="page++">
      Próxima
      <Icon name="ph:caret-right" class="size-3.5" />
    </BaseButton>
  </nav>
</template>
