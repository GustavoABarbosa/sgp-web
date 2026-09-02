<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ExamQuestion, Question } from '@/types'
import { mockApi, isApiError } from '@/mock/mockApi'
import FormField from '@/components/FormField.vue'
import { examFormSchema, getZodFieldErrors } from '@/shared/validation'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const title = ref('')
const description = ref('')
const selectedQuestions = ref<ExamQuestion[]>([])
const availableQuestions = ref<Question[]>([])
const targetTotal = ref(10)
const error = ref('')
const fieldErrors = ref<Partial<Record<string, string>>>({})

const totalScore = computed(() => selectedQuestions.value.reduce((s, q) => s + q.score, 0))
const scoreWarning = computed(() => Math.abs(totalScore.value - targetTotal.value) > 0.01)

async function load() {
  availableQuestions.value = (await mockApi.listQuestions({})).data
  if (isEdit.value) {
    const exam = await mockApi.getExam(String(route.params.id))
    title.value = exam.title
    description.value = exam.description ?? ''
    selectedQuestions.value = [...exam.questions].sort((a, b) => a.order - b.order)
  }
}

function addQuestion(q: Question) {
  if (selectedQuestions.value.length >= 20) {
    error.value = 'Máximo de 20 questões'
    return
  }
  if (selectedQuestions.value.some((x) => x.questionId === q.id)) return
  error.value = ''
  selectedQuestions.value.push({
    questionId: q.id,
    order: selectedQuestions.value.length + 1,
    score: q.type === 'discursiva' ? (q.maxScore ?? 5) : 2,
  })
}

function removeQuestion(questionId: string) {
  selectedQuestions.value = selectedQuestions.value
    .filter((q) => q.questionId !== questionId)
    .map((q, i) => ({ ...q, order: i + 1 }))
}

function moveUp(index: number) {
  if (index === 0) return
  const arr = [...selectedQuestions.value]
  ;[arr[index - 1], arr[index]] = [arr[index]!, arr[index - 1]!]
  selectedQuestions.value = arr.map((q, i) => ({ ...q, order: i + 1 }))
}

function moveDown(index: number) {
  if (index >= selectedQuestions.value.length - 1) return
  const arr = [...selectedQuestions.value]
  ;[arr[index], arr[index + 1]] = [arr[index + 1]!, arr[index]!]
  selectedQuestions.value = arr.map((q, i) => ({ ...q, order: i + 1 }))
}

function questionLabel(id: string) {
  const q = availableQuestions.value.find((x) => x.id === id)
  return q ? q.statement.slice(0, 60) + (q.statement.length > 60 ? '...' : '') : id
}

async function submit() {
  error.value = ''
  fieldErrors.value = {}

  const result = examFormSchema.safeParse({
    title: title.value,
    description: description.value,
    questions: selectedQuestions.value,
  })

  if (!result.success) {
    fieldErrors.value = getZodFieldErrors(result.error)
    error.value = result.error.issues[0]?.message ?? 'Dados inválidos'
    return
  }

  try {
    const payload = result.data
    if (isEdit.value) await mockApi.updateExam(String(route.params.id), payload)
    else await mockApi.createExam(payload)
    router.push('/professor/exams')
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Erro'
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">{{ isEdit ? 'Editar' : 'Nova' }} prova</h1>
    </div>

    <form class="rounded-lg border border-border bg-surface p-5 shadow-sm" @submit.prevent="submit">
      <FormField v-model="title" label="Título" :error="fieldErrors.title" />
      <FormField v-model="description" as="textarea" label="Descrição" rows="2" />

      <div
        class="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-page p-3 text-sm"
        :class="scoreWarning ? 'border border-warning text-warning' : ''"
      >
        <span>Total: <strong>{{ totalScore.toFixed(1) }}</strong> pts</span>
        <span>
          Meta desejada:
          <input v-model.number="targetTotal" type="number" step="0.5" class="w-20 rounded-lg border border-border bg-white px-2 py-1" />
          pts
        </span>
        <span v-if="scoreWarning">A soma não coincide com a meta (responsabilidade do professor)</span>
      </div>

      <h2>Questões selecionadas ({{ selectedQuestions.length }}/20)</h2>
      <div v-if="selectedQuestions.length" class="mb-4">
        <div
          v-for="(eq, idx) in selectedQuestions"
          :key="eq.questionId"
          class="flex flex-wrap items-center gap-2 border-b border-border py-2"
        >
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{{ eq.order }}</span>
          <span class="min-w-0 flex-1">{{ questionLabel(eq.questionId) }}</span>
          <input v-model.number="eq.score" type="number" step="0.5" min="0" class="w-20 rounded-lg border border-border bg-white px-2 py-1" />
          <div class="flex gap-1">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
              @click="moveUp(idx)"
            >
              ↑
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
              @click="moveDown(idx)"
            >
              ↓
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-danger px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
              @click="removeQuestion(eq.questionId)"
            >
              ×
            </button>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-muted">Nenhuma questão adicionada</p>

      <h2>Banco de questões</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="q in availableQuestions"
          :key="q.id"
          type="button"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page disabled:cursor-not-allowed disabled:opacity-55"
          :disabled="selectedQuestions.some((x) => x.questionId === q.id)"
          @click="addQuestion(q)"
        >
          + {{ q.type }} — {{ q.statement.slice(0, 40) }}...
        </button>
      </div>

      <p v-if="error" class="mt-4 text-sm text-danger">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <RouterLink
          to="/professor/exams"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page"
        >
          Cancelar
        </RouterLink>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        >
          Salvar prova
        </button>
      </div>
    </form>
  </div>
</template>
