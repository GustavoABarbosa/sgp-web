<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { StudentExam } from '@/types'
import { mockApi } from '@/mock/mockApi'
import { formatDate } from '@/shared/utils'
import LoadingState from '@/components/LoadingState.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'

const exams = ref<StudentExam[]>([])
const loading = ref(true)

onMounted(async () => {
  exams.value = await mockApi.studentExams()
  loading.value = false
})
</script>

<template>
  <div>
    <Breadcrumb class="mb-6" :items="[{ label: 'Minhas provas' }]" />
    <LoadingState :loading="loading" :message="exams.length ? '' : 'Nenhuma prova atribuída'" />
    <div v-if="exams.length" class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-180 border-collapse text-xs sm:text-sm">
          <thead>
            <tr class="[&>th]:border-b [&>th]:border-border [&>th]:px-3 [&>th]:pb-2.5 [&>th]:pt-4 [&>th]:text-xs [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-muted">
              <th class="text-left">Prova</th>
              <th class="text-left">Turma</th>
              <th class="text-left">Disciplina</th>
              <th class="text-center">Período</th>
              <th class="text-center">Data</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in exams"
              :key="e.applicationId"
              class="border-b border-border [&>td]:px-3 [&>td]:py-2.5"
            >
              <td class="min-w-40 whitespace-nowrap border-b border-border px-3 py-2">{{ e.examTitle }}</td>
              <td class="min-w-40 whitespace-nowrap border-b border-border px-3 py-2">{{ e.className }}</td>
              <td class="min-w-36 whitespace-nowrap border-b border-border px-3 py-2">{{ e.subject }}</td>
              <td class="min-w-20 whitespace-nowrap border-b border-border px-3 py-2 text-center">{{ e.term }}</td>
              <td class="min-w-24 whitespace-nowrap border-b border-border px-3 py-2 text-center">{{ formatDate(e.appliedAt) }}</td>
              <td>
                <RouterLink :to="`/aluno/grades/${e.applicationId}`">
                  <button
                    type="button"
                    class="rounded-lg border border-border bg-surface px-2.5 py-1 hover:bg-page"
                  >
                    <Icon name="ph:eye" class="size-4" />
                  </button>
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
