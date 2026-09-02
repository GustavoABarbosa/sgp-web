<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Class } from '@/types'
import { mockApi } from '@/mock/mockApi'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingState from '@/components/LoadingState.vue'
import { statusLabel } from '@/shared/utils'

const classes = ref<Class[]>([])
const loading = ref(true)
const showArchived = ref(false)

async function load() {
  loading.value = true
  classes.value = await mockApi.listClasses(showArchived.value ? undefined : 'active')
  loading.value = false
}

async function archive(id: string) {
  if (!confirm('Arquivar esta turma?')) return
  await mockApi.archiveClass(id)
  load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Turmas</h1>
      <RouterLink
        to="/professor/classes/new"
        class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white no-underline hover:bg-primary-light"
      >
        Nova turma
      </RouterLink>
    </div>

    <label class="mb-4 flex items-center gap-2 text-sm">
      <input v-model="showArchived" type="checkbox" @change="load" /> Mostrar arquivadas
    </label>

    <LoadingState :loading="loading" :message="classes.length ? '' : 'Nenhuma turma'" />

    <div v-if="classes.length" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Nome</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Disciplina</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Período</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Status</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in classes" :key="c.id">
            <td class="border-b border-border px-3 py-2.5">{{ c.name }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ c.subject }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ c.term }}</td>
            <td class="border-b border-border px-3 py-2.5">
              <StatusBadge :status="c.status">{{ statusLabel(c.status) }}</StatusBadge>
            </td>
            <td class="border-b border-border px-3 py-2.5">
              <div class="flex flex-wrap gap-2">
                <RouterLink
                  :to="`/professor/classes/${c.id}`"
                  class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text no-underline hover:bg-page"
                >
                  Gerenciar
                </RouterLink>
                <button
                  v-if="c.status === 'active'"
                  class="inline-flex items-center justify-center rounded-lg bg-danger px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                  @click="archive(c.id)"
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
