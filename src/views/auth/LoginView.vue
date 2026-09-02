<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { DEMO_CREDENTIALS } from '@/mock/initialDb'

const logoUrl = '/images/catolicaLogo.svg'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')

async function submit() {
  try {
    await auth.login(email.value, password.value)
    router.push(auth.isProfessor ? '/professor/dashboard' : '/aluno/dashboard')
  } catch {
    /* error in store */
  }
}

function fillDemo(role: 'professor' | 'estudante') {
  const cred = DEMO_CREDENTIALS[role]
  email.value = cred.email
  password.value = cred.password
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-light p-4">
    <div class="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div class="flex items-center gap-2 mb-6">
        <img :src="logoUrl" alt="SGP Católica" />
        <div>
          <h1 class="mb-0 text-3xl font-semibold">SGP Católica</h1>
          <p class="text-muted">Sistema de Geração de Provas</p>
        </div>
      </div>

      <form @submit.prevent="submit">
        <div class="mb-4">
          <label for="email" class="mb-1.5 block text-sm font-medium">E-mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
          />
        </div>
        <div class="mb-4">
          <label for="password" class="mb-1.5 block text-sm font-medium">Senha</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
          />
        </div>
        <p v-if="auth.error" class="mt-2 text-sm text-danger">{{ auth.error }}</p>
        <button
          type="submit"
          :disabled="auth.loading"
          class="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
        >
          {{ auth.loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="mt-5 flex flex-col gap-2 text-sm">
        <RouterLink to="/forgot-password" class="text-primary-light">Esqueci minha senha</RouterLink>
        <RouterLink to="/register/professor" class="text-primary-light">Cadastro professor</RouterLink>
        <RouterLink to="/register/estudante" class="text-primary-light">Cadastro aluno</RouterLink>
        <RouterLink to="/join" class="text-primary-light">Entrar com código de turma</RouterLink>
      </div>

      <!-- @TODO: Remover após desenvolvimento e testes -->
      <div class="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <p class="w-full text-xs text-muted">Dados demo:</p>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
          @click="fillDemo('professor')"
        >
          Professor demo
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
          @click="fillDemo('estudante')"
        >
          Aluno demo
        </button>
      </div>
    </div>
  </div>
</template>
