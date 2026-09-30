<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import { useToastStore } from '@/stores/toast'
import { errorMessage } from '@/shared/api/client'
import { resetPasswordSchema, useZodForm } from '@/shared/validation'
import Breadcrumb from '@/components/Breadcrumb.vue'
import BaseButton from '@/components/BaseButton.vue'
import FormField from '@/components/FormField.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const { fields, validate, errorFor } = useZodForm(resetPasswordSchema, {
  password: '',
  confirmPassword: '',
})
const submitting = ref(false)

async function submit() {
  const data = validate()
  if (!data) return

  submitting.value = true
  try {
    await authApi.resetPassword(token.value, data.password)
    toast.success('Senha redefinida com sucesso.')
    router.push('/login')
  } catch (e) {
    toast.error(errorMessage(e, 'Erro ao redefinir senha'))
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
      { label: 'Nova senha' },
    ]"
  />
  <div v-if="!token" role="alert" class="text-sm">
    <p class="mb-4 text-danger">Link inválido ou expirado.</p>
    <RouterLink to="/forgot-password" class="text-primary-light">Solicitar um novo link</RouterLink>
  </div>
  <form v-else @submit.prevent="submit">
    <FormField
      id="password"
      v-model="fields.password"
      label="Nova senha"
      type="password"
      autocomplete="new-password"
      :error="errorFor('password')"
    />
    <FormField
      id="confirm"
      v-model="fields.confirmPassword"
      label="Confirmar"
      type="password"
      autocomplete="new-password"
      :error="errorFor('confirmPassword')"
    />
    <BaseButton type="submit" class="mt-2" block :loading="submitting">Redefinir</BaseButton>
  </form>
</template>
