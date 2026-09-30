<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import type { UserRole } from '@/types'
import { errorMessage } from '@/shared/api/client'
import { emailDomainForRole, registerSchema, useZodForm } from '@/shared/validation'
import AuthFormHeader from '@/components/AuthFormHeader.vue'
import BaseButton from '@/components/BaseButton.vue'
import EmailInputGroup from '@/components/EmailInputGroup.vue'
import FormField from '@/components/FormField.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const submitting = ref(false)

const role = computed(() => route.params.role as UserRole)
const isProfessor = computed(() => role.value === 'professor')
const domain = computed(() => emailDomainForRole(role.value))

const { fields, validate, errorFor } = useZodForm(
  computed(() => registerSchema(role.value)),
  {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
)

async function submit() {
  const data = validate()
  if (!data) return

  submitting.value = true
  try {
    await auth.register({
      role: role.value,
      fullName: data.fullName,
      email: data.email,
      password: data.password,
    })
    toast.success('Conta criada com sucesso.')
    router.push(auth.homePath)
  } catch (e) {
    toast.error(errorMessage(e, 'Erro ao cadastrar'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthFormHeader
    logo
    title="Cadastro"
    :description="`${isProfessor ? 'Professor' : 'Aluno'}, use o e-mail ${domain}`"
  />

  <form @submit.prevent="submit">
    <FormField
      id="name"
      v-model="fields.fullName"
      label="Nome completo"
      placeholder="Nome e sobrenome"
      autocomplete="name"
      :error="errorFor('fullName')"
    />
    <EmailInputGroup id="email" v-model="fields.email" label="E-mail" :domain="domain" :error="errorFor('email')" />
    <FormField
      id="password"
      v-model="fields.password"
      label="Senha (mín. 8 caracteres)"
      type="password"
      autocomplete="new-password"
      :error="errorFor('password')"
    />
    <FormField
      id="confirm"
      v-model="fields.confirmPassword"
      label="Confirmar senha"
      type="password"
      autocomplete="new-password"
      :error="errorFor('confirmPassword')"
    />
    <BaseButton type="submit" class="mt-2" block :loading="submitting">Cadastrar</BaseButton>
  </form>
  <p class="mt-5 text-sm">
    <RouterLink to="/login" class="text-primary-light no-underline">Já tenho conta</RouterLink>
  </p>
</template>
