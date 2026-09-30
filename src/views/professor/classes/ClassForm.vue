<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { classesApi } from "@/api/classes";
import { errorMessage } from "@/shared/api/client";
import { classFormSchema, useZodForm } from "@/shared/validation";
import BaseButton from "@/components/BaseButton.vue";
import FormField from "@/components/FormField.vue";
import PageHeader from "@/components/PageHeader.vue";

const router = useRouter();
const { fields, validate, errorFor } = useZodForm(classFormSchema, {
  name: "",
  subject: "",
  term: "2026/1",
});
const error = ref("");
const saving = ref(false);

async function submit() {
  error.value = "";
  const data = validate();
  if (!data) return;

  saving.value = true;
  try {
    const cls = await classesApi.create(data);
    router.push(`/professor/classes/${cls.id}`);
  } catch (e) {
    error.value = errorMessage(e, "Erro ao criar turma");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader :items="[{ label: 'Turmas', to: '/professor/classes' }, { label: 'Nova turma' }]" />
    <form class="rounded-lg border border-border bg-surface p-5 shadow-sm" novalidate @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <FormField v-model="fields.name" label="Nome" :error="errorFor('name')" />
        </div>
        <FormField v-model="fields.subject" label="Disciplina" :error="errorFor('subject')" />
        <FormField v-model="fields.term" label="Período / Ano letivo" placeholder="2026/1" :error="errorFor('term')" />
      </div>
      <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <BaseButton variant="secondary" to="/professor/classes">Cancelar</BaseButton>
        <BaseButton type="submit" :loading="saving">Criar turma</BaseButton>
      </div>
    </form>
  </div>
</template>
