<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const role = computed(() => route.params.role as UserRole)
const isProfessor = computed(() => role.value === 'professor')
const domainHint = computed(() =>
  isProfessor.value ? '@catolicasc.org.br' : '@catolicasc.edu.br',
)

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const localError = ref('')

async function submit() {
  localError.value = ''
  if (password.value !== confirmPassword.value) {
    localError.value = 'Senhas não conferem'
    return
  }
  try {
    await auth.register({
      role: role.value,
      fullName: fullName.value,
      email: email.value,
      password: password.value,
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
      <h1 class="mb-0 text-3xl font-semibold">Cadastro — {{ isProfessor ? 'Professor' : 'Aluno' }}</h1>
      <p class="mb-6 text-muted">Use e-mail {{ domainHint }}</p>

      <form @submit.prevent="submit">
        <div class="mb-4">
          <label for="name" class="mb-1.5 block text-sm font-medium">Nome completo</label>
          <input
            id="name"
            v-model="fullName"
            required
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
          />
        </div>
        <div class="mb-4">
          <label for="email" class="mb-1.5 block text-sm font-medium">E-mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            :placeholder="`nome${domainHint}`"
            required
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
          />
        </div>
        <div class="mb-4">
          <label for="password" class="mb-1.5 block text-sm font-medium">Senha (mín. 8 caracteres)</label>
          <input
            id="password"
            v-model="password"
            type="password"
            minlength="8"
            required
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
          />
        </div>
        <div class="mb-4">
          <label for="confirm" class="mb-1.5 block text-sm font-medium">Confirmar senha</label>
          <input
            id="confirm"
            v-model="confirmPassword"
            type="password"
            required
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
          />
        </div>
        <p v-if="localError || auth.error" class="text-sm text-danger">{{ localError || auth.error }}</p>
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
