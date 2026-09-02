<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { DEMO_CREDENTIALS } from '@/mock/initialDb'
import AuthFormHeader from '@/components/AuthFormHeader.vue'
import FormField from '@/components/FormField.vue'
import { loginSchema, useZodForm } from '@/shared/validation'
import { useToast } from '@/shared/useToast'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const { fields, validate, errorFor } = useZodForm(loginSchema, {
  email: '',
  password: '',
})

async function submit() {
  const data = validate()
  if (!data) return

  try {
    await auth.login(data.email, data.password)
    toast.success('Login realizado com sucesso.')
    router.push(auth.isProfessor ? '/professor/dashboard' : '/aluno/dashboard')
  } catch {
    toast.error(auth.error ?? 'Erro ao fazer login')
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
        <FormField
          id="email"
          v-model="fields.email"
          label="E-mail"
          type="email"
          autocomplete="email"
          :error="errorFor('email')"
        />
        <FormField
          id="password"
          v-model="fields.password"
          label="Senha"
          type="password"
          autocomplete="current-password"
          :error="errorFor('password')"
        />
        <button
          type="submit"
          :disabled="auth.loading"
          class="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
        >
          {{ auth.loading ? '...' : 'Entrar' }}
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
