<script setup lang="ts">
import type { AnswerKeyItem } from '@/types'
import { renderMarkdown } from '@/shared/utils'
import MarkdownPreview from './MarkdownPreview.vue'

defineProps<{ items: AnswerKeyItem[] }>()

function correctText(item: AnswerKeyItem) {
  return item.alternatives?.find((a) => a.id === item.correctAlternativeId)?.text
}
</script>

<template>
  <ol class="m-0 list-none p-0">
    <li
      v-for="(item, index) in items"
      :key="item.questionId"
      class="mb-4 border-b border-border pb-4 last:mb-0 last:border-b-0 last:pb-0"
    >
      <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Questão {{ index + 1 }}</p>
      <MarkdownPreview :html="renderMarkdown(item.statement)" />
      <p v-if="item.type === 'objetiva'" class="mt-2 text-sm">
        Resposta correta: <strong>{{ correctText(item) }}</strong>
      </p>
      <p v-else class="mt-2 text-sm">Pontuação máxima: <strong>{{ item.maxScore }}</strong></p>
    </li>
  </ol>
</template>
