<script setup lang="ts">
import { useRoute } from 'vue-router'
import { studentApi } from '@/api/student'
import { formatDateTime } from '@/shared/utils'
import { useResource } from '@/shared/useResource'
import AnswerKeyList from '@/components/AnswerKeyList.vue'
import BaseCard from '@/components/BaseCard.vue'
import LoadingState from '@/components/LoadingState.vue'
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const { data: detail, isLoading, error } = useResource(() =>
  studentApi.gradeDetail(String(route.params.applicationId)),
)
</script>

<template>
  <div>
    <PageHeader
      :items="[
        { label: 'Histórico de notas', to: '/aluno/grades' },
        { label: detail?.examTitle ?? 'Detalhe da prova' },
      ]"
    />

    <LoadingState :loading="isLoading" :message="error" />

    <template v-if="detail">
      <BaseCard>
        <p>{{ detail.className }} — {{ detail.subject }} ({{ detail.term }})</p>
        <p><strong>Nota: {{ detail.totalScore }} / {{ detail.maxScore }}</strong></p>
        <p class="text-sm text-muted">
          Corrigida em {{ formatDateTime(detail.correctedAt) }} por {{ detail.professorName }}
        </p>
      </BaseCard>

      <BaseCard title="Resultados por questão" class="mt-4">
        <ul class="m-0 list-none p-0">
          <li
            v-for="r in detail.results"
            :key="r.questionId"
            class="flex items-center justify-between border-b border-border py-2 last:border-b-0"
          >
            <span>Questão {{ r.number }}<span v-if="r.type === 'discursiva'" class="text-muted"> (discursiva)</span></span>
            <span v-if="r.type === 'objetiva'" :class="r.correct ? 'text-success' : 'text-danger'">
              {{ r.correct ? 'Acertou' : 'Errou' }} — {{ r.score }}/{{ r.maxScore }} pts
            </span>
            <span v-else>{{ r.score }}/{{ r.maxScore }} pts</span>
          </li>
        </ul>
      </BaseCard>

      <BaseCard v-if="detail.answerKeyAvailable && detail.answerKey" title="Gabarito publicado" class="mt-4">
        <AnswerKeyList :items="detail.answerKey" />
      </BaseCard>
      <div v-else class="mt-4 rounded-lg border border-border bg-page p-4 text-sm text-muted">
        Gabarito ainda não publicado pelo professor.
      </div>
    </template>
  </div>
</template>
