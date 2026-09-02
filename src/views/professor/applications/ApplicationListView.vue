<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Application, Class, Exam } from '@/types'
import { mockApi } from '@/mock/mockApi'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingState from '@/components/LoadingState.vue'
import { statusLabel } from '@/shared/utils'

const applications = ref<(Application & { exam?: Exam; class?: Class })[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  const [apps, exams, classes] = await Promise.all([
    mockApi.listApplications(),
    mockApi.listExams(),
    mockApi.listClasses('active'),
  ])
  applications.value = apps.map((a) => ({
    ...a,
    exam: exams.find((e) => e.id === a.examId),
    class: classes.find((c) => c.id === a.classId),
  }))
  loading.value = false
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Aplicações</h1>
      <RouterLink
        to="/professor/applications/new"
        class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white no-underline hover:bg-primary-light"
      >
        Nova aplicação
      </RouterLink>
    </div>

    <LoadingState :loading="loading" :message="applications.length ? '' : 'Nenhuma aplicação'" />

    <div v-if="applications.length" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Prova</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Turma</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Status</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in applications" :key="a.id">
            <td class="border-b border-border px-3 py-2.5">{{ a.exam?.title ?? a.examId }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ a.class?.name ?? a.classId }}</td>
            <td class="border-b border-border px-3 py-2.5">
              <StatusBadge :status="a.status">{{ statusLabel(a.status) }}</StatusBadge>
            </td>
            <td class="border-b border-border px-3 py-2.5">
              <RouterLink
                :to="`/professor/applications/${a.id}`"
                class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text no-underline hover:bg-page"
              >
                Detalhes
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
