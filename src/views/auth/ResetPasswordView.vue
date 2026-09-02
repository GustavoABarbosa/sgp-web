<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mockApi, isApiError } from '@/mock/mockApi'
import FormField from '@/components/FormField.vue'
import { resetPasswordSchema, useZodForm } from '@/shared/validation'

const route = useRoute()
const router = useRouter()
const { fields, validate, errorFor } = useZodForm(resetPasswordSchema, {
  password: '',
  confirmPassword: '',
})
const error = ref('')
const loading = ref(false)

async function submit() {
  const data = validate()
  if (!data) return

  loading.value = true
  error.value = ''
  try {
    await mockApi.resetPassword(String(route.query.token ?? ''), data.password)
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
        <FormField
          id="password"
          v-model="fields.password"
          label="Nova senha"
          type="password"
          :error="errorFor('password')"
        />
        <FormField
          id="confirm"
          v-model="fields.confirmPassword"
          label="Confirmar"
          type="password"
          :error="errorFor('confirmPassword')"
        />
        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
        >
          Redefinir
        </button>
      </form>
    </div>
  </div>
</template>
