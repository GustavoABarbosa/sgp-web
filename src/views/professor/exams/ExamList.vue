<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Exam } from '@/types'
import { mockApi } from '@/mock/mockApi'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingState from '@/components/LoadingState.vue'
import { statusLabel } from '@/shared/utils'

const router = useRouter()
const exams = ref<Exam[]>([])
const loading = ref(true)
const statusFilter = ref('')

async function load() {
  loading.value = true
  exams.value = await mockApi.listExams(statusFilter.value || undefined)
  loading.value = false
}

async function archive(id: string) {
  if (!confirm('Arquivar esta prova?')) return
  await mockApi.archiveExam(id)
  load()
}

watch(statusFilter, load)
onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Provas</h1>
      <RouterLink
        to="/professor/exams/new"
        class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white no-underline hover:bg-primary-light"
      >
        Nova prova
      </RouterLink>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <select v-model="statusFilter" class="rounded-lg border border-border bg-white px-3 py-2">
        <option value="">Todos</option>
        <option value="draft">Rascunho</option>
        <option value="ready">Pronta</option>
        <option value="closed">Arquivada</option>
      </select>
    </div>

    <LoadingState :loading="loading" :message="exams.length ? '' : 'Nenhuma prova'" />

    <div v-if="exams.length" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Título</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Questões</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Status</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in exams" :key="e.id">
            <td class="border-b border-border px-3 py-2.5">{{ e.title }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ e.questions.length }}</td>
            <td class="border-b border-border px-3 py-2.5">
              <StatusBadge :status="e.status">{{ statusLabel(e.status) }}</StatusBadge>
            </td>
            <td class="border-b border-border px-3 py-2.5">
              <div class="flex flex-wrap gap-2">
                <button
                  v-if="e.status !== 'closed'"
                  class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
                  @click="router.push(`/professor/exams/${e.id}/edit`)"
                >
                  Editar
                </button>
                <button
                  v-if="e.status !== 'closed'"
                  class="inline-flex items-center justify-center rounded-lg bg-danger px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                  @click="archive(e.id)"
                >
                  Arquivar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
