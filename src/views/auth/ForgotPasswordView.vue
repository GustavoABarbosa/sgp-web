<script setup lang="ts">
import { ref } from 'vue'
import { mockApi, isApiError } from '@/mock/mockApi'

const email = ref('')
const message = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    const res = await mockApi.forgotPassword(email.value)
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
            v-model="email"
            type="email"
            required
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
          />
        </div>
        <p v-if="message" class="text-sm text-success">{{ message }}</p>
        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
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
