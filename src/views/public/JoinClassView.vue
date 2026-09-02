<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { mockApi, isApiError } from '@/mock/mockApi'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const inviteCode = ref('')
const email = ref('')
const fullName = ref('')
const password = ref('')
const needsRegister = ref(false)
const error = ref('')
const message = ref('')

async function submit() {
  error.value = ''
  try {
    const res = await mockApi.joinByCode(
      inviteCode.value.toUpperCase(),
      email.value,
      needsRegister.value ? fullName.value : undefined,
      needsRegister.value ? password.value : undefined,
    )
    if (res.tokens) {
      auth.setUser(res.user)
    } else if (auth.isAuthenticated) {
      /* already logged in */
    }
    message.value = `Matriculado em ${res.class.name}!`
    setTimeout(() => router.push('/aluno/dashboard'), 1500)
  } catch (e) {
    const msg = isApiError(e) ? e.message : 'Erro'
    if (msg.includes('Informe nome')) needsRegister.value = true
    error.value = msg
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-light p-4">
    <div class="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h1 class="mb-0 text-3xl font-semibold">Entrar na turma</h1>
      <p class="mb-6 text-muted">Informe o código de convite recebido do professor</p>

      <form @submit.prevent="submit">
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-medium">Código de convite</label>
          <input
            v-model="inviteCode"
            required
            placeholder="WEB2026A"
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
          />
        </div>
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-medium">E-mail (@catolicasc.edu.br)</label>
          <input v-model="email" type="email" required class="w-full rounded-lg border border-border bg-white px-3 py-2" />
        </div>
        <template v-if="needsRegister">
          <div class="mb-4">
            <label class="mb-1.5 block text-sm font-medium">Nome completo</label>
            <input v-model="fullName" required class="w-full rounded-lg border border-border bg-white px-3 py-2" />
          </div>
          <div class="mb-4">
            <label class="mb-1.5 block text-sm font-medium">Senha (mín. 8 caracteres)</label>
            <input v-model="password" type="password" minlength="8" required class="w-full rounded-lg border border-border bg-white px-3 py-2" />
          </div>
        </template>
        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <p v-if="message" class="text-sm text-success">{{ message }}</p>
        <button
          type="submit"
          class="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        >
          Entrar na turma
        </button>
      </form>
      <p class="mt-5 text-sm">
        <RouterLink to="/login" class="text-primary-light no-underline">Voltar ao login</RouterLink>
      </p>
    </div>
  </div>
</template>
