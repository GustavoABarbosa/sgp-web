<script setup lang="ts">
import { ref } from 'vue'
import { mockApi, isApiError } from '@/mock/mockApi'
import FormField from '@/components/FormField.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import EmailInputGroup from '@/components/EmailInputGroup.vue'
import { forgotPasswordSchema, useZodForm } from '@/shared/validation'
import { useToast } from '@/shared/useToast'

const toast = useToast()
const { fields, validate, errorFor } = useZodForm(forgotPasswordSchema, { email: '' })
const loading = ref(false)

async function submit() {
  const data = validate()
  if (!data) return

  loading.value = true
  try {
    const res = await mockApi.forgotPassword(data.email)
    toast.success(res.message)
  } catch (e) {
    toast.error(isApiError(e) ? e.message : 'Erro ao enviar recuperação')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-light p-4">
    <div class="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-sm">
      <Breadcrumb
        class="mb-6"
        :items="[
          { label: 'Login', to: '/login' },
          { label: 'Recuperar senha' },
        ]"
      />
      <form @submit.prevent="submit">
        <EmailInputGroup
          id="email"
          v-model="fields.email"
          label="E-mail"
          :error="errorFor('email')"
        />
        <button
          type="submit"
          :disabled="loading"
          class="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
        >
          Enviar
        </button>
      </form>
    </div>
  </div>
</template>
