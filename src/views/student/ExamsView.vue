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
    <div v-if="exams.length" class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-180 border-collapse text-xs sm:text-sm">
          <thead>
            <tr>
              <th class="border-b border-border px-3 pb-2.5 pt-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">Prova</th>
              <th class="border-b border-border px-3 pb-2.5 pt-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">Turma</th>
              <th class="border-b border-border px-3 pb-2.5 pt-4 text-left text-xs font-semibold uppercase tracking-wide text-muted">Disciplina</th>
              <th class="border-b border-border px-3 pb-2.5 pt-4 text-center text-xs font-semibold uppercase tracking-wide text-muted">Período</th>
              <th class="border-b border-border px-3 pb-2.5 pt-4 text-center text-xs font-semibold uppercase tracking-wide text-muted">Data</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in exams" :key="e.applicationId">
              <td class="min-w-40 whitespace-nowrap border-b border-border px-3 py-2">{{ e.examTitle }}</td>
              <td class="min-w-40 whitespace-nowrap border-b border-border px-3 py-2">{{ e.className }}</td>
              <td class="min-w-36 whitespace-nowrap border-b border-border px-3 py-2">{{ e.subject }}</td>
              <td class="min-w-20 whitespace-nowrap border-b border-border px-3 py-2 text-center">{{ e.term }}</td>
              <td class="min-w-24 whitespace-nowrap border-b border-border px-3 py-2 text-center">{{ formatDate(e.appliedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
