<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { ApiError, errorMessage } from '@/shared/api/client'
import { STUDENT_EMAIL_DOMAIN, joinClassSchema, useZodForm } from '@/shared/validation'
import BaseButton from '@/components/BaseButton.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import EmailInputGroup from '@/components/EmailInputGroup.vue'
import FormField from '@/components/FormField.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const auth = useAuthStore()
const submitting = ref(false)

const { fields, validate, errorFor } = useZodForm(joinClassSchema, {
  inviteCode: typeof route.query.code === 'string' ? route.query.code : '',
  email: auth.user?.email ?? '',
  fullName: '',
  password: '',
  needsRegister: false,
})

async function submit() {
  const data = validate()
  if (!data) return

  submitting.value = true
  try {
    const res = await authApi.joinClass(
      auth.isAuthenticated
        ? { inviteCode: data.inviteCode }
        : {
            inviteCode: data.inviteCode,
            email: data.email,
            ...(data.needsRegister ? { fullName: data.fullName, password: data.password } : {}),
          },
    )
    if (res.session) auth.startSession(res.session)
    toast.success(`Matriculado em ${res.class.name}!`)
    router.push('/aluno/dashboard')
  } catch (e) {
    if (e instanceof ApiError && e.code === 'ACCOUNT_REQUIRED') {
      fields.needsRegister = true
      toast.info(e.message)
    } else if (e instanceof ApiError && e.code === 'LOGIN_REQUIRED') {
      toast.info(e.message)
      router.push({ name: 'login', query: { redirect: `/join?code=${encodeURIComponent(data.inviteCode)}` } })
    } else {
      toast.error(errorMessage(e, 'Erro ao entrar na turma'))
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Breadcrumb
    class="mb-2"
    :items="[
      { label: auth.isAuthenticated ? 'Início' : 'Login', to: auth.isAuthenticated ? auth.homePath : '/login' },
      { label: 'Entrar na turma' },
    ]"
  />
  <p class="mb-6 text-muted">Informe o código de convite recebido do professor</p>

  <form @submit.prevent="submit">
    <FormField
      v-model="fields.inviteCode"
      label="Código de convite"
      placeholder="WEB2026A"
      autocomplete="off"
      :error="errorFor('inviteCode')"
    />
    <p v-if="auth.isAuthenticated" class="mb-4 text-sm text-muted">
      Entrando como <strong class="text-text">{{ auth.user?.email }}</strong>
    </p>
    <EmailInputGroup
      v-else
      v-model="fields.email"
      label="E-mail"
      :domain="STUDENT_EMAIL_DOMAIN"
      :error="errorFor('email')"
    />
    <template v-if="fields.needsRegister">
      <FormField
        v-model="fields.fullName"
        label="Nome completo"
        autocomplete="name"
        :error="errorFor('fullName')"
      />
      <FormField
        v-model="fields.password"
        label="Senha (mín. 8 caracteres)"
        type="password"
        autocomplete="new-password"
        :error="errorFor('password')"
      />
    </template>
    <BaseButton type="submit" class="mt-2" block :loading="submitting">Entrar na turma</BaseButton>
  </form>
</template>
