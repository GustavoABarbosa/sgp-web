<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { StudentGradeDetail } from '@/types'
import { mockApi, isApiError } from '@/mock/mockApi'
import { formatDateTime, renderMarkdown } from '@/shared/utils'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import LoadingState from '@/components/LoadingState.vue'

const route = useRoute()
const detail = ref<StudentGradeDetail | null>(null)
const error = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    detail.value = await mockApi.studentGradeDetail(String(route.params.applicationId))
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Erro'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Detalhe da prova</h1>
      <RouterLink
        to="/aluno/grades"
        class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page"
      >
        Voltar
      </RouterLink>
    </div>

    <LoadingState :loading="loading" :message="error" />

    <template v-if="detail">
      <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2>{{ detail.examTitle }}</h2>
        <p>{{ detail.className }} — {{ detail.subject }} ({{ detail.term }})</p>
        <p><strong>Nota: {{ detail.totalScore }} / {{ detail.maxScore }}</strong></p>
        <p class="text-sm text-muted">Corrigida em {{ formatDateTime(detail.correctedAt) }} por {{ detail.professorName }}</p>
      </div>

      <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2>Resultados por questão</h2>
        <div
          v-for="r in detail.objectiveResults"
          :key="r.questionId"
          class="flex items-center justify-between border-b border-border py-2 last:border-b-0"
        >
          <span>Questão {{ r.questionId }}</span>
          <span :class="r.correct ? 'text-success' : 'text-danger'">{{ r.correct ? 'Acertou' : 'Errou' }} — {{ r.score }} pts</span>
        </div>
        <div
          v-for="d in detail.discursiveScores"
          :key="d.questionId"
          class="flex items-center justify-between border-b border-border py-2 last:border-b-0"
        >
          <span>Questão discursiva {{ d.questionId }}</span>
          <span>{{ d.score }} pts</span>
        </div>
      </div>

      <div v-if="detail.answerKeyAvailable && detail.answerKey" class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2>Gabarito publicado</h2>
        <div
          v-for="item in detail.answerKey"
          :key="item.questionId"
          class="mb-4 border-b border-border pb-4 last:mb-0 last:border-b-0 last:pb-0"
        >
          <MarkdownPreview :html="renderMarkdown(item.statement)" />
          <p v-if="item.type === 'objetiva'">
            Correta: {{ item.alternatives?.find((a) => a.id === item.correctAlternativeId)?.text }}
          </p>
          <p v-else>Máx: {{ item.maxScore }} pts</p>
        </div>
      </div>
      <div v-else class="mt-4 rounded-lg border border-border bg-page p-4 text-sm text-muted">
        Gabarito ainda não publicado pelo professor.
      </div>
    </template>
  </div>
</template>
