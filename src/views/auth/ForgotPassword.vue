<script setup lang="ts">
import { ref } from 'vue'
import { authApi } from '@/api/auth'
import { useToastStore } from '@/stores/toast'
import { errorMessage } from '@/shared/api/client'
import { forgotPasswordSchema, useZodForm } from '@/shared/validation'
import Breadcrumb from '@/components/Breadcrumb.vue'
import BaseButton from '@/components/BaseButton.vue'
import EmailInputGroup from '@/components/EmailInputGroup.vue'

const toast = useToastStore()
const { fields, validate, errorFor } = useZodForm(forgotPasswordSchema, { email: '' })
const submitting = ref(false)
const sentMessage = ref('')

async function submit() {
  const data = validate()
  if (!data) return

  submitting.value = true
  try {
    sentMessage.value = (await authApi.forgotPassword(data.email)).message
  } catch (e) {
    toast.error(errorMessage(e, 'Erro ao enviar recuperação'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Breadcrumb
    class="mb-6"
    :items="[
      { label: 'Login', to: '/login' },
      { label: 'Recuperar senha' },
    ]"
  />
  <p v-if="sentMessage" role="status" class="rounded-lg border border-border bg-page p-4 text-sm text-text">
    {{ sentMessage }}
  </p>
  <form v-else @submit.prevent="submit">
    <EmailInputGroup id="email" v-model="fields.email" label="E-mail" :error="errorFor('email')" />
    <BaseButton type="submit" class="mt-2" block :loading="submitting">Enviar</BaseButton>
  </form>
</template>
