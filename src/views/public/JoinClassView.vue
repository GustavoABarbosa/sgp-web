<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { mockApi, isApiError } from '@/mock/mockApi'
import { useAuthStore } from '@/stores/auth'
import FormField from '@/components/FormField.vue'
import { joinClassSchema, useZodForm } from '@/shared/validation'

const router = useRouter()
const auth = useAuthStore()
const { fields, validate, errorFor } = useZodForm(joinClassSchema, {
  inviteCode: '',
  email: '',
  fullName: '',
  password: '',
  needsRegister: false,
})
const error = ref('')
const message = ref('')

async function submit() {
  error.value = ''
  const data = validate()
  if (!data) return

  try {
    const res = await mockApi.joinByCode(
      data.inviteCode,
      data.email,
      data.needsRegister ? data.fullName : undefined,
      data.needsRegister ? data.password : undefined,
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
    if (msg.includes('Informe nome')) fields.needsRegister = true
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
        <FormField
          v-model="fields.inviteCode"
          label="Código de convite"
          placeholder="WEB2026A"
          :error="errorFor('inviteCode')"
        />
        <FormField
          v-model="fields.email"
          label="E-mail (@catolicasc.edu.br)"
          type="email"
          :error="errorFor('email')"
        />
        <template v-if="fields.needsRegister">
          <FormField
            v-model="fields.fullName"
            label="Nome completo"
            :error="errorFor('fullName')"
          />
          <FormField
            v-model="fields.password"
            label="Senha (mín. 8 caracteres)"
            type="password"
            :error="errorFor('password')"
          />
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
