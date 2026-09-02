<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { mockApi, isApiError } from '@/mock/mockApi'
import { classFormSchema, useZodForm } from '@/shared/validation'

const router = useRouter()
const { fields, validate, errorFor } = useZodForm(classFormSchema, {
  name: '',
  subject: '',
  term: '2026/1',
})
const error = ref('')

async function submit() {
  error.value = ''
  const data = validate()
  if (!data) return

  try {
    const cls = await mockApi.createClass(data)
    router.push(`/professor/classes/${cls.id}`)
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Erro'
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Nova turma</h1>
    </div>
    <form class="rounded-lg border border-border bg-surface p-5 shadow-sm" @submit.prevent="submit">
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Nome</label>
        <input
          v-model="fields.name"
          class="w-full rounded-lg border border-border bg-white px-3 py-2"
          :class="{ 'border-danger': errorFor('name') }"
        />
        <p v-if="errorFor('name')" class="mt-1 text-sm text-danger">{{ errorFor('name') }}</p>
      </div>
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Disciplina</label>
        <input
          v-model="fields.subject"
          class="w-full rounded-lg border border-border bg-white px-3 py-2"
          :class="{ 'border-danger': errorFor('subject') }"
        />
        <p v-if="errorFor('subject')" class="mt-1 text-sm text-danger">{{ errorFor('subject') }}</p>
      </div>
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Período / Ano letivo</label>
        <input
          v-model="fields.term"
          placeholder="2026/1"
          class="w-full rounded-lg border border-border bg-white px-3 py-2"
          :class="{ 'border-danger': errorFor('term') }"
        />
        <p v-if="errorFor('term')" class="mt-1 text-sm text-danger">{{ errorFor('term') }}</p>
      </div>
      <p v-if="error" class="text-sm text-danger">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <RouterLink
          to="/professor/classes"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page"
        >
          Cancelar
        </RouterLink>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        >
          Criar turma
        </button>
      </div>
    </form>
  </div>
</template>
