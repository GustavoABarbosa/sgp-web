<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { DEMO_CREDENTIALS } from "@/mock/demoCredentials";
import { errorMessage } from "@/shared/api/client";
import { MOCKS_ENABLED } from "@/shared/env";
import { loginSchema, useZodForm } from "@/shared/validation";
import AuthFormHeader from "@/components/AuthFormHeader.vue";
import BaseButton from "@/components/BaseButton.vue";
import EmailInputGroup from "@/components/EmailInputGroup.vue";
import FormField from "@/components/FormField.vue";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const submitting = ref(false);
const { fields, validate, errorFor } = useZodForm(loginSchema, {
  email: "",
  password: "",
});

function safeRedirect() {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
}

async function submit() {
  const data = validate();
  if (!data) return;

  submitting.value = true;
  try {
    await auth.login(data.email, data.password);
    toast.success("Login realizado com sucesso.");
    router.push(safeRedirect() ?? auth.homePath);
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao fazer login"));
  } finally {
    submitting.value = false;
  }
}

function fillDemo(role: "professor" | "estudante") {
  const cred = DEMO_CREDENTIALS[role];
  fields.email = cred.email;
  fields.password = cred.password;
}
</script>

<template>
  <AuthFormHeader title="SGP Católica" description="Sistema de Geração de Provas" logo />

  <form @submit.prevent="submit">
    <EmailInputGroup id="email" v-model="fields.email" label="E-mail" :error="errorFor('email')" />
    <FormField
      id="password"
      v-model="fields.password"
      label="Senha"
      type="password"
      autocomplete="current-password"
      :error="errorFor('password')"
    />
    <BaseButton type="submit" class="mt-2" block :loading="submitting">Entrar</BaseButton>
  </form>

  <div class="mt-5 flex flex-col gap-2 text-sm">
    <RouterLink to="/forgot-password" class="text-primary-light">Esqueci minha senha</RouterLink>
    <RouterLink to="/register/professor" class="text-primary-light">Cadastro professor</RouterLink>
    <RouterLink to="/register/estudante" class="text-primary-light">Cadastro aluno</RouterLink>
    <RouterLink to="/join" class="text-primary-light">Entrar com código de turma</RouterLink>
  </div>

  <div v-if="MOCKS_ENABLED" class="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
    <p class="w-full text-xs text-muted">Dados demo:</p>
    <BaseButton variant="secondary" size="sm" @click="fillDemo('professor')">Professor demo</BaseButton>
    <BaseButton variant="secondary" size="sm" @click="fillDemo('estudante')">Aluno demo</BaseButton>
  </div>
</template>
