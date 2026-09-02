<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { AnswerKey } from '@/types'
import { mockApi, isApiError } from '@/mock/mockApi'
import { renderMarkdown } from '@/shared/utils'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import LoadingState from '@/components/LoadingState.vue'

const route = useRoute()
const answerKey = ref<AnswerKey | null>(null)
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    answerKey.value = await mockApi.getPublicAnswerKey(String(route.params.publicCode))
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Gabarito não disponível'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex min-h-screen justify-center bg-page p-4">
    <div class="w-full max-w-3xl rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h1 class="mb-0 text-3xl font-semibold">Gabarito — Versão {{ answerKey?.versionNumber ?? '?' }}</h1>
      <LoadingState :loading="loading" :message="error" />

      <template v-if="answerKey">
        <p class="font-mono text-sm text-muted">Código: {{ answerKey.publicCode }}</p>
        <div
          v-for="item in answerKey.items"
          :key="item.questionId"
          class="mb-4 border-b border-border pb-4 last:mb-0 last:border-b-0 last:pb-0"
        >
          <MarkdownPreview :html="renderMarkdown(item.statement)" />
          <p v-if="item.type === 'objetiva'" class="mt-2 text-sm">
            Resposta correta:
            <strong>{{ item.alternatives?.find((a) => a.id === item.correctAlternativeId)?.text }}</strong>
          </p>
          <p v-else class="mt-2 text-sm">Pontuação máxima: <strong>{{ item.maxScore }}</strong></p>
        </div>
      </template>
    </div>
  </div>
</template>
