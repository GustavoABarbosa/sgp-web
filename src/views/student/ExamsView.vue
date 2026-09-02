<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { StudentExam } from '@/types'
import { mockApi } from '@/mock/mockApi'
import { formatDate } from '@/shared/utils'
import LoadingState from '@/components/LoadingState.vue'

const exams = ref<StudentExam[]>([])
const loading = ref(true)

onMounted(async () => {
  exams.value = await mockApi.studentExams()
  loading.value = false
})
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Minhas provas</h1>
    </div>
    <LoadingState :loading="loading" :message="exams.length ? '' : 'Nenhuma prova atribuída'" />
    <div v-if="exams.length" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Prova</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Turma</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Disciplina</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Período</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in exams" :key="e.applicationId">
            <td class="border-b border-border px-3 py-2.5">{{ e.examTitle }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ e.className }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ e.subject }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ e.term }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ formatDate(e.appliedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
