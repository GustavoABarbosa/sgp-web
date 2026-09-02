<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'
import AuthFormHeader from '@/components/AuthFormHeader.vue'
import { registerSchema, useZodForm } from '@/shared/validation'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const role = computed(() => route.params.role as UserRole)
const isProfessor = computed(() => role.value === 'professor')
const domainHint = computed(() =>
  isProfessor.value ? '@catolicasc.org.br' : '@catolicasc.edu.br',
)

const { fields, validate, errorFor } = useZodForm(registerSchema(role.value), {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

async function submit() {
  const data = validate()
  if (!data) return

  try {
    await auth.register({
      role: role.value,
      fullName: data.fullName,
      email: data.email,
      password: data.password,
    })
    router.push(isProfessor.value ? '/professor/dashboard' : '/aluno/dashboard')
  } catch {
    /* store error */
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-light p-4">
    <div class="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-sm">
      <AuthFormHeader
        logo
        title="Cadastro"
        :description="`${isProfessor ? 'Professor' : 'Aluno'}, use o e-mail ${domainHint}`"
      />

      <form @submit.prevent="submit">
        <div class="mb-4">
          <label for="name" class="mb-1.5 block text-sm font-medium">Nome completo</label>
          <input
            id="name"
            v-model="fields.fullName"
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
            :class="{ 'border-danger': errorFor('fullName') }"
          />
          <p v-if="errorFor('fullName')" class="mt-1 text-sm text-danger">{{ errorFor('fullName') }}</p>
        </div>
        <div class="mb-4">
          <label for="email" class="mb-1.5 block text-sm font-medium">E-mail</label>
          <input
            id="email"
            v-model="fields.email"
            type="email"
            :placeholder="`nome.sobrenome${domainHint}`"
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
            :class="{ 'border-danger': errorFor('email') }"
          />
          <p v-if="errorFor('email')" class="mt-1 text-sm text-danger">{{ errorFor('email') }}</p>
        </div>
        <div class="mb-4">
          <label for="password" class="mb-1.5 block text-sm font-medium">Senha (mín. 8 caracteres)</label>
          <input
            id="password"
            v-model="fields.password"
            type="password"
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
            :class="{ 'border-danger': errorFor('password') }"
          />
          <p v-if="errorFor('password')" class="mt-1 text-sm text-danger">{{ errorFor('password') }}</p>
        </div>
        <div class="mb-4">
          <label for="confirm" class="mb-1.5 block text-sm font-medium">Confirmar senha</label>
          <input
            id="confirm"
            v-model="fields.confirmPassword"
            type="password"
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
            :class="{ 'border-danger': errorFor('confirmPassword') }"
          />
          <p v-if="errorFor('confirmPassword')" class="mt-1 text-sm text-danger">{{ errorFor('confirmPassword') }}</p>
        </div>
        <p v-if="auth.error" class="text-sm text-danger">{{ auth.error }}</p>
        <button
          type="submit"
          :disabled="auth.loading"
          class="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
        >
          Cadastrar
        </button>
      </form>
      <p class="mt-5 text-sm">
        <RouterLink to="/login" class="text-primary-light no-underline">Já tenho conta</RouterLink>
      </p>
    </div>
  </div>
</template>
