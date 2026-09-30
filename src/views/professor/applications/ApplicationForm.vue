<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { applicationsApi } from "@/api/applications";
import { classesApi } from "@/api/classes";
import { examsApi } from "@/api/exams";
import { errorMessage } from "@/shared/api/client";
import { useResource } from "@/shared/useResource";
import { statusLabel } from "@/shared/utils";
import { applicationFormSchema, useZodForm } from "@/shared/validation";
import BaseButton from "@/components/BaseButton.vue";
import FormField from "@/components/FormField.vue";
import LoadingState from "@/components/LoadingState.vue";
import PageHeader from "@/components/PageHeader.vue";

const router = useRouter();
const { data: options, isLoading, error: loadError } = useResource(async () => {
  const [exams, classes] = await Promise.all([examsApi.list(), classesApi.list({ status: "active" })]);
  return { exams: exams.filter((e) => e.status !== "closed"), classes };
});
const exams = computed(() => options.value?.exams ?? []);
const classes = computed(() => options.value?.classes ?? []);

const { fields, validate, errorFor } = useZodForm(applicationFormSchema, {
  examId: "",
  classId: "",
});
const error = ref("");
const saving = ref(false);

async function submit() {
  error.value = "";
  const data = validate();
  if (!data) return;

  saving.value = true;
  try {
    const app = await applicationsApi.create(data);
    router.push(`/professor/applications/${app.id}`);
  } catch (e) {
    error.value = errorMessage(e, "Erro ao criar aplicação");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader :items="[{ label: 'Aplicações', to: '/professor/applications' }, { label: 'Nova aplicação' }]" />

    <LoadingState :loading="isLoading && !options" :message="loadError" />

    <form
      v-if="options"
      class="rounded-lg border border-border bg-surface p-5 shadow-sm"
      novalidate
      @submit.prevent="submit"
    >
      <FormField v-model="fields.examId" as="select" label="Prova" :error="errorFor('examId')">
        <option value="" disabled>Selecione...</option>
        <option v-for="e in exams" :key="e.id" :value="e.id">{{ e.title }} ({{ statusLabel(e.status) }})</option>
      </FormField>
      <FormField v-model="fields.classId" as="select" label="Turma" :error="errorFor('classId')">
        <option value="" disabled>Selecione...</option>
        <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }} — {{ c.subject }}</option>
      </FormField>
      <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <BaseButton variant="secondary" to="/professor/applications">Cancelar</BaseButton>
        <BaseButton type="submit" :loading="saving">Criar aplicação</BaseButton>
      </div>
    </form>
  </div>
</template>
