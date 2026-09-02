<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { mockApi } from '@/mock/mockApi'
import type { StudentExam, StudentGrade } from '@/types'

const auth = useAuthStore()
const exams = ref<StudentExam[]>([])
const grades = ref<StudentGrade[]>([])

onMounted(async () => {
  exams.value = await mockApi.studentExams()
  grades.value = await mockApi.studentGrades()
})
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Olá, {{ auth.user?.fullName?.split(' ')[0] }}</h1>
    </div>

    <div class="mb-6 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
      <div class="rounded-lg border border-border bg-surface p-4 text-center">
        <div class="text-2xl font-semibold text-primary">{{ exams.length || '--' }}</div>
        <div class="mt-1 text-xs uppercase tracking-wide text-muted font-medium">Provas atribuídas</div>
      </div>
      <div class="rounded-lg border border-border bg-surface p-4 text-center">
        <div class="text-2xl font-semibold text-primary">{{ grades.length || '--' }}</div>
        <div class="mt-1 text-xs uppercase tracking-wide text-muted font-medium">Notas lançadas</div>
      </div>
      <div class="rounded-lg border border-border bg-surface p-4 text-center">
        <div class="text-2xl font-semibold text-primary">
          {{ grades.length ? (grades.reduce((s, g) => s + g.totalScore, 0) / grades.length).toFixed(1) : '--' }}
        </div>
        <div class="mt-1 text-xs uppercase tracking-wide text-muted font-medium">Média</div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Atalhos</h2>
      <div class="mt-4 flex flex-wrap gap-2">
        <RouterLink
          to="/aluno/exams"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page"
        >
          Ver minhas provas
        </RouterLink>
        <RouterLink
          to="/aluno/grades"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page"
        >
          Ver notas
        </RouterLink>
      </div>
    </div>
  </div>
</template>
