<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { Class } from '@/types'
import { mockApi, isApiError } from '@/mock/mockApi'
import { copyToClipboard } from '@/shared/utils'

const route = useRoute()
const cls = ref<Class | null>(null)
const students = ref<{ enrollment: { id: string }; student: { id: string; fullName: string; email: string } }[]>([])
const inviteCode = ref('')
const enrollEmail = ref('')
const message = ref('')
const error = ref('')

const editName = ref('')
const editSubject = ref('')
const editTerm = ref('')

async function load() {
  const id = String(route.params.id)
  const all = await mockApi.listClasses()
  cls.value = all.find((c) => c.id === id) ?? null
  if (!cls.value) return
  editName.value = cls.value.name
  editSubject.value = cls.value.subject
  editTerm.value = cls.value.term
  const code = await mockApi.getInviteCode(id)
  inviteCode.value = code.inviteCode
  students.value = await mockApi.listClassStudents(id)
}

async function saveEdit() {
  await mockApi.updateClass(String(route.params.id), {
    name: editName.value,
    subject: editSubject.value,
    term: editTerm.value,
  })
  message.value = 'Turma atualizada'
  load()
}

async function enroll() {
  error.value = ''
  try {
    await mockApi.enrollStudent(String(route.params.id), enrollEmail.value)
    enrollEmail.value = ''
    message.value = 'Aluno matriculado'
    load()
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Erro'
  }
}

async function removeStudent(studentId: string) {
  if (!confirm('Remover aluno da turma?')) return
  await mockApi.removeStudent(String(route.params.id), studentId)
  load()
}

async function regenerateCode() {
  if (!confirm('O código anterior será invalidado. Continuar?')) return
  const res = await mockApi.regenerateInviteCode(String(route.params.id))
  inviteCode.value = res.inviteCode
  message.value = 'Novo código gerado'
}

async function copyCode() {
  await copyToClipboard(inviteCode.value)
  message.value = 'Código copiado!'
}

onMounted(load)
</script>

<template>
  <div v-if="cls">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">{{ cls.name }}</h1>
      <RouterLink
        to="/professor/classes"
        class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page"
      >
        Voltar
      </RouterLink>
    </div>

    <p v-if="message" class="mb-4 text-sm text-success">{{ message }}</p>

    <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Editar turma</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-medium">Nome</label>
          <input v-model="editName" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
        </div>
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-medium">Disciplina</label>
          <input v-model="editSubject" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
        </div>
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-medium">Período</label>
          <input v-model="editTerm" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
        </div>
      </div>
      <button
        class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
        @click="saveEdit"
      >
        Salvar alterações
      </button>
    </div>

    <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Código de convite</h2>
      <p class="font-mono text-lg font-semibold tracking-wider">{{ inviteCode }}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
          @click="copyCode"
        >
          Copiar
        </button>
        <button
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
          @click="regenerateCode"
        >
          Regenerar
        </button>
      </div>
      <p class="mt-3 text-sm text-muted">Compartilhe com alunos em <RouterLink to="/join">/join</RouterLink></p>
    </div>

    <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Matricular aluno</h2>
      <div class="flex flex-wrap items-center gap-2">
        <input
          v-model="enrollEmail"
          type="email"
          placeholder="aluno@catolicasc.edu.br"
          class="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2"
        />
        <button
          class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
          @click="enroll"
        >
          Matricular
        </button>
      </div>
      <p v-if="error" class="mt-2 text-sm text-danger">{{ error }}</p>
    </div>

    <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Alunos matriculados ({{ students.length }})</h2>
      <table v-if="students.length" class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Nome</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">E-mail</th>
            <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="{ student } in students" :key="student.id">
            <td class="border-b border-border px-3 py-2.5">{{ student.fullName }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ student.email }}</td>
            <td class="border-b border-border px-3 py-2.5">
              <button
                class="inline-flex items-center justify-center rounded-lg bg-danger px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                @click="removeStudent(student.id)"
              >
                Remover
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-sm text-muted">Nenhum aluno matriculado</p>
    </div>
  </div>
</template>
