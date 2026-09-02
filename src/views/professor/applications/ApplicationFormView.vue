<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Class, Exam } from '@/types'
import { mockApi, isApiError } from '@/mock/mockApi'
import FormField from '@/components/FormField.vue'
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
      <FormField v-model="fields.examId" as="select" label="Prova" :error="errorFor('examId')">
        <option value="" disabled>Selecione...</option>
        <option v-for="e in exams" :key="e.id" :value="e.id">{{ e.title }} ({{ e.status }})</option>
      </FormField>
      <FormField v-model="fields.classId" as="select" label="Turma" :error="errorFor('classId')">
        <option value="" disabled>Selecione...</option>
        <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }} — {{ c.subject }}</option>
      </FormField>
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
