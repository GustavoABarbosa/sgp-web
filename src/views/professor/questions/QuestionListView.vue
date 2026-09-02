<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Question } from '@/types'
import { mockApi, isApiError } from '@/mock/mockApi'
import { renderMarkdown } from '@/shared/utils'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import LoadingState from '@/components/LoadingState.vue'

const router = useRouter()
const questions = ref<Question[]>([])
const loading = ref(true)
const error = ref('')
const filterType = ref('')
const filterSearch = ref('')
const filterTag = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await mockApi.listQuestions({
      type: filterType.value || undefined,
      search: filterSearch.value || undefined,
      tag: filterTag.value || undefined,
    })
    questions.value = res.data
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Erro'
  } finally {
    loading.value = false
  }
}

async function remove(id: string) {
  if (!confirm('Excluir esta questão?')) return
  await mockApi.deleteQuestion(id)
  load()
}

watch([filterType, filterSearch, filterTag], load)
onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Questões</h1>
      <RouterLink
        to="/professor/questions/new"
        class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white no-underline hover:bg-primary-light"
      >
        Nova questão
      </RouterLink>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <select v-model="filterType" class="rounded-lg border border-border bg-white px-3 py-2">
        <option value="">Todos os tipos</option>
        <option value="objetiva">Objetiva</option>
        <option value="discursiva">Discursiva</option>
      </select>
      <input v-model="filterSearch" placeholder="Buscar enunciado..." class="rounded-lg border border-border bg-white px-3 py-2" />
      <input v-model="filterTag" placeholder="Filtrar tag..." class="rounded-lg border border-border bg-white px-3 py-2" />
    </div>

    <LoadingState :loading="loading" :message="error || (questions.length ? '' : 'Nenhuma questão encontrada')" />

    <div v-if="!loading && questions.length" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Enunciado</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Tipo</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Tags</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="q in questions" :key="q.id">
            <td class="border-b border-border px-3 py-2.5"><MarkdownPreview :html="renderMarkdown(q.statement)" /></td>
            <td class="border-b border-border px-3 py-2.5">{{ q.type }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ q.tags.join(', ') }}</td>
            <td class="border-b border-border px-3 py-2.5">
              <div class="flex flex-wrap gap-2">
                <button
                  class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
                  @click="router.push(`/professor/questions/${q.id}/edit`)"
                >
                  Editar
                </button>
                <button
                  class="inline-flex items-center justify-center rounded-lg bg-danger px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                  @click="remove(q.id)"
                >
                  Excluir
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
