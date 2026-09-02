<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { StudentGrade } from '@/types'
import { mockApi } from '@/mock/mockApi'
import { formatDate } from '@/shared/utils'
import LoadingState from '@/components/LoadingState.vue'

const router = useRouter()
const grades = ref<StudentGrade[]>([])
const loading = ref(true)
const subject = ref('')
const term = ref('')

async function load() {
  loading.value = true
  grades.value = await mockApi.studentGrades({
    subject: subject.value || undefined,
    term: term.value || undefined,
  })
  loading.value = false
}

watch([subject, term], load)
onMounted(load)

const chartPoints = ref<{ label: string; score: number; max: number }[]>([])

watch(grades, (g) => {
  chartPoints.value = [...g]
    .sort((a, b) => new Date(a.correctedAt).getTime() - new Date(b.correctedAt).getTime())
    .map((gr) => ({
      label: gr.examTitle.slice(0, 12),
      score: gr.totalScore,
      max: gr.maxScore,
    }))
})
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Histórico de notas</h1>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <input
        v-model="subject"
        placeholder="Filtrar disciplina"
        class="rounded-lg border border-border bg-white px-3 py-2"
      />
      <input
        v-model="term"
        placeholder="Filtrar período"
        class="rounded-lg border border-border bg-white px-3 py-2"
      />
    </div>

    <div v-if="chartPoints.length" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Evolução</h2>
      <div class="mt-4 flex h-44 items-end gap-2">
        <div v-for="(p, i) in chartPoints" :key="i" class="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div class="w-full min-h-1 rounded-t bg-primary" :style="{ height: `${(p.score / p.max) * 100}px` }" />
          <span class="text-center text-xs text-muted">{{ p.label }}</span>
          <span class="text-xs font-medium text-text">{{ p.score }}/{{ p.max }}</span>
        </div>
      </div>
    </div>

    <LoadingState :loading="loading" :message="grades.length ? '' : 'Nenhuma nota registrada'" />

    <div v-if="grades.length" class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Prova</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Disciplina</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Nota</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Professor</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Data</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in grades" :key="g.applicationId">
            <td class="border-b border-border px-3 py-2.5">{{ g.examTitle }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ g.subject }}</td>
            <td class="border-b border-border px-3 py-2.5"><strong>{{ g.totalScore }}</strong> / {{ g.maxScore }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ g.professorName }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ formatDate(g.correctedAt) }}</td>
            <td class="border-b border-border px-3 py-2.5">
              <button
                class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
                @click="router.push(`/aluno/grades/${g.applicationId}`)"
              >
                Detalhes
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
