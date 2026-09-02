<script setup lang="ts">
import { ref } from 'vue'
import { mockApi, isApiError } from '@/mock/mockApi'
import { forgotPasswordSchema, useZodForm } from '@/shared/validation'

const { fields, validate, errorFor } = useZodForm(forgotPasswordSchema, { email: '' })
const message = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  const data = validate()
  if (!data) return

  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await mockApi.forgotPassword(data.email)
    message.value = res.message
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Erro'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-light p-4">
    <div class="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h1 class="mb-0 text-3xl font-semibold">Recuperar senha</h1>
      <form class="mt-6" @submit.prevent="submit">
        <div class="mb-4">
          <label for="email" class="mb-1.5 block text-sm font-medium">E-mail</label>
          <input
            id="email"
            v-model="fields.email"
            type="email"
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
            :class="{ 'border-danger': errorFor('email') }"
          />
          <p v-if="errorFor('email')" class="mt-1 text-sm text-danger">{{ errorFor('email') }}</p>
        </div>
        <p v-if="message" class="text-sm text-success">{{ message }}</p>
        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
        >
          Enviar
        </button>
      </form>
      <p class="mt-5 text-sm">
        <RouterLink to="/login" class="text-primary-light no-underline">Voltar ao login</RouterLink>
      </p>
    </div>
  </div>
</template>
