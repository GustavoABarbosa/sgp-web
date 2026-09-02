<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mockApi, isApiError } from '@/mock/mockApi'

const route = useRoute()
const router = useRouter()
const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  if (password.value !== confirm.value) {
    error.value = 'Senhas não conferem'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await mockApi.resetPassword(String(route.query.token ?? ''), password.value)
    router.push('/login')
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
      <h1 class="mb-0 text-3xl font-semibold">Nova senha</h1>
      <form class="mt-6" @submit.prevent="submit">
        <div class="mb-4">
          <label for="password" class="mb-1.5 block text-sm font-medium">Nova senha</label>
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
          <label for="confirm" class="mb-1.5 block text-sm font-medium">Confirmar</label>
          <input
            id="confirm"
            v-model="confirm"
            type="password"
            required
            class="w-full rounded-lg border border-border bg-white px-3 py-2"
          />
        </div>
        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="mt-2 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
        >
          Redefinir
        </button>
      </form>
    </div>
  </div>
</template>
