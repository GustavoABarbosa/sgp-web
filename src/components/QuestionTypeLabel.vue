<script setup lang="ts">
import type { Question } from '@/types'

defineProps<{ type: Question['type'] }>()
</script>

<template>
  <span class="inline-flex items-center gap-1 capitalize">
    <Icon :name="type === 'objetiva' ? 'ph:check-circle' : 'ph:pencil-simple-line'" class="size-4" />
    {{ type }}
  </span>
</template>
