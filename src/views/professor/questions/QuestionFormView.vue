<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { QuestionAlternative } from '@/types'
import { mockApi, isApiError } from '@/mock/mockApi'
import { renderMarkdown } from '@/shared/utils'
import MarkdownPreview from '@/components/MarkdownPreview.vue'

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const error = ref('')

const type = ref<'objetiva' | 'discursiva'>('objetiva')
const statement = ref('')
const tagsInput = ref('')
const maxScore = ref(5)
const alternatives = ref<QuestionAlternative[]>([
  { id: 'new-a', text: '' },
  { id: 'new-b', text: '' },
])
const correctId = ref('')

const preview = computed(() => renderMarkdown(statement.value))

function addAlternative() {
  if (alternatives.value.length >= 5) return
  alternatives.value.push({ id: `new-${crypto.randomUUID().slice(0, 4)}`, text: '' })
}

function removeAlternative(id: string) {
  if (alternatives.value.length <= 2) return
  alternatives.value = alternatives.value.filter((a) => a.id !== id)
  if (correctId.value === id) correctId.value = ''
}

async function load() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const res = await mockApi.listQuestions({})
    const q = res.data.find((x) => x.id === route.params.id)
    if (!q) throw new Error('Questão não encontrada')
    type.value = q.type
    statement.value = q.statement
    tagsInput.value = q.tags.join(', ')
    if (q.type === 'discursiva') maxScore.value = q.maxScore ?? 5
    else {
      alternatives.value = q.alternatives ?? []
      correctId.value = q.correctAlternativeId ?? ''
    }
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Erro ao carregar'
  } finally {
    loading.value = false
  }
}

async function submit() {
  error.value = ''
  const tags = tagsInput.value.split(',').map((t) => t.trim()).filter(Boolean)
  try {
    if (type.value === 'objetiva') {
      if (!correctId.value) {
        error.value = 'Selecione a alternativa correta'
        return
      }
      const idMap = new Map<string, string>()
      const alts = alternatives.value.map((a) => {
        const newId = a.id.startsWith('new-') ? uid('alt') : a.id
        idMap.set(a.id, newId)
        return { id: newId, text: a.text }
      })
      const mappedCorrect = idMap.get(correctId.value) ?? correctId.value
      const data = {
        type: type.value as 'objetiva',
        statement: statement.value,
        tags,
        alternatives: alts,
        correctAlternativeId: mappedCorrect,
      }
      if (isEdit.value) await mockApi.updateQuestion(String(route.params.id), data)
      else await mockApi.createQuestion(data)
    } else {
      const data = { type: type.value, statement: statement.value, tags, maxScore: maxScore.value }
      if (isEdit.value) await mockApi.updateQuestion(String(route.params.id), data)
      else await mockApi.createQuestion(data)
    }
    router.push('/professor/questions')
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Erro ao salvar'
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">{{ isEdit ? 'Editar' : 'Nova' }} questão</h1>
    </div>

    <form class="rounded-lg border border-border bg-surface p-5 shadow-sm" @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-medium">Tipo</label>
          <select v-model="type" :disabled="isEdit" class="w-full rounded-lg border border-border bg-white px-3 py-2">
            <option value="objetiva">Objetiva</option>
            <option value="discursiva">Discursiva</option>
          </select>
        </div>
        <div v-if="type === 'discursiva'" class="mb-4">
          <label class="mb-1.5 block text-sm font-medium">Pontuação máxima</label>
          <input v-model.number="maxScore" type="number" min="0.5" step="0.5" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
        </div>
      </div>

      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Enunciado (Markdown básico: **negrito**, *itálico*, `code`)</label>
        <textarea v-model="statement" required rows="4" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
      </div>

      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Tags (separadas por vírgula)</label>
        <input v-model="tagsInput" placeholder="matematica, prova1" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
      </div>

      <div v-if="type === 'objetiva'" class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Alternativas (2–5)</label>
        <div v-for="alt in alternatives" :key="alt.id" class="mb-2 flex flex-wrap items-center gap-2">
          <input v-model="alt.text" required placeholder="Texto da alternativa" class="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2" />
          <label class="flex items-center gap-1.5 whitespace-nowrap text-sm">
            <input v-model="correctId" type="radio" :value="alt.id" /> Correta
          </label>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
            @click="removeAlternative(alt.id)"
          >
            −
          </button>
        </div>
        <button
          v-if="alternatives.length < 5"
          type="button"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
          @click="addAlternative"
        >
          + Alternativa
        </button>
      </div>

      <div class="mt-4 rounded-lg border border-border bg-page p-5 shadow-sm">
        <h3>Preview</h3>
        <MarkdownPreview :html="preview" />
      </div>

      <p v-if="error" class="mt-4 text-sm text-danger">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <RouterLink
          to="/professor/questions"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page"
        >
          Cancelar
        </RouterLink>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        >
          Salvar
        </button>
      </div>
    </form>
  </div>
</template>
