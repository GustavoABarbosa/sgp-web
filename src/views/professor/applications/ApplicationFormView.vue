<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Class, Exam } from '@/types'
import { mockApi, isApiError } from '@/mock/mockApi'
import { applicationFormSchema, useZodForm } from '@/shared/validation'

const router = useRouter()
const exams = ref<Exam[]>([])
const classes = ref<Class[]>([])
const { fields, validate, errorFor } = useZodForm(applicationFormSchema, {
  examId: '',
  classId: '',
})
const error = ref('')

onMounted(async () => {
  exams.value = (await mockApi.listExams()).filter((e) => e.status !== 'closed')
  classes.value = await mockApi.listClasses('active')
})

async function submit() {
  error.value = ''
  const data = validate()
  if (!data) return

  try {
    const app = await mockApi.createApplication(data.examId, data.classId)
    router.push(`/professor/applications/${app.id}`)
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Erro'
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Nova aplicação</h1>
    </div>
    <form class="rounded-lg border border-border bg-surface p-5 shadow-sm" @submit.prevent="submit">
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Prova</label>
        <select
          v-model="fields.examId"
          class="w-full rounded-lg border border-border bg-white px-3 py-2"
          :class="{ 'border-danger': errorFor('examId') }"
        >
          <option value="" disabled>Selecione...</option>
          <option v-for="e in exams" :key="e.id" :value="e.id">{{ e.title }} ({{ e.status }})</option>
        </select>
        <p v-if="errorFor('examId')" class="mt-1 text-sm text-danger">{{ errorFor('examId') }}</p>
      </div>
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Turma</label>
        <select
          v-model="fields.classId"
          class="w-full rounded-lg border border-border bg-white px-3 py-2"
          :class="{ 'border-danger': errorFor('classId') }"
        >
          <option value="" disabled>Selecione...</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }} — {{ c.subject }}</option>
        </select>
        <p v-if="errorFor('classId')" class="mt-1 text-sm text-danger">{{ errorFor('classId') }}</p>
      </div>
      <p v-if="error" class="text-sm text-danger">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <RouterLink
          to="/professor/applications"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page"
        >
          Cancelar
        </RouterLink>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        >
          Criar aplicação
        </button>
      </div>
    </form>
  </div>
</template>
