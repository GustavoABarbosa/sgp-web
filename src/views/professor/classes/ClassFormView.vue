<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { mockApi, isApiError } from '@/mock/mockApi'

const router = useRouter()
const name = ref('')
const subject = ref('')
const term = ref('2026/1')
const error = ref('')

async function submit() {
  error.value = ''
  try {
    const cls = await mockApi.createClass({ name: name.value, subject: subject.value, term: term.value })
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
        <input v-model="name" required class="w-full rounded-lg border border-border bg-white px-3 py-2" />
      </div>
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Disciplina</label>
        <input v-model="subject" required class="w-full rounded-lg border border-border bg-white px-3 py-2" />
      </div>
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Período / Ano letivo</label>
        <input v-model="term" required placeholder="2026/1" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
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
