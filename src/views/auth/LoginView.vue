<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { DEMO_CREDENTIALS } from '@/mock/initialDb'
import AuthFormHeader from '@/components/AuthFormHeader.vue'
import { loginSchema, useZodForm } from '@/shared/validation'

const auth = useAuthStore()
const router = useRouter()
const { fields, validate, errorFor } = useZodForm(loginSchema, {
  email: '',
  password: '',
})

async function submit() {
  const data = validate()
  if (!data) return

  try {
    await auth.login(data.email, data.password)
    router.push(auth.isProfessor ? '/professor/dashboard' : '/aluno/dashboard')
  } catch {
    /* error in store */
  }
}

function fillDemo(role: 'professor' | 'estudante') {
  const cred = DEMO_CREDENTIALS[role]
  fields.email = cred.email
  fields.password = cred.password
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-light p-4">
    <div class="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-sm">
      <AuthFormHeader title="SGP Católica" description="Sistema de Geração de Provas" logo />

      <form @submit.prevent="submit">
        <div class="mb-4">
          <label for="email" class="mb-1.5 block text-sm font-medium">E-mail</label>
          <input
            id="email"
            v-model="fields.email"
            type="email"
            autocomplete="email"
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
            :class="{ 'border-danger': errorFor('email') }"
          />
          <p v-if="errorFor('email')" class="mt-1 text-sm text-danger">{{ errorFor('email') }}</p>
        </div>
        <div class="mb-4">
          <label for="password" class="mb-1.5 block text-sm font-medium">Senha</label>
          <input
            id="password"
            v-model="fields.password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
            :class="{ 'border-danger': errorFor('password') }"
          />
          <p v-if="errorFor('password')" class="mt-1 text-sm text-danger">{{ errorFor('password') }}</p>
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
