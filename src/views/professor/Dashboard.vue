<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { mockApi } from "@/mock/mockApi";
import Breadcrumb from "@/components/Breadcrumb.vue";

const auth = useAuthStore();
const stats = ref({ questions: 0, classes: 0, exams: 0, applications: 0, pendingGrades: 0 });

onMounted(async () => {
  const [questions, classes, exams, applications] = await Promise.all([
    mockApi.listQuestions({}),
    mockApi.listClasses({ status: "active" }),
    mockApi.listExams(),
    mockApi.listApplications(),
  ]);
  const pending = await mockApi.listCorrections("app-001", false);
  stats.value = {
    questions: questions.total,
    classes: classes.length,
    exams: exams.length,
    applications: applications.length,
    pendingGrades: pending.length,
  };
});
</script>

<template>
  <div>
    <Breadcrumb class="mb-6" :items="[{ label: `Olá, ${auth.user?.fullName?.split(' ')[0] ?? ''}` }]" />

    <div class="mb-6 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
      <div class="rounded-lg border border-border bg-page p-4 text-center">
        <div class="text-2xl font-semibold text-primary">{{ stats.questions }}</div>
        <div class="mt-1 text-xs uppercase tracking-wide text-muted">Questões</div>
      </div>
      <div class="rounded-lg border border-border bg-page p-4 text-center">
        <div class="text-2xl font-semibold text-primary">{{ stats.classes }}</div>
        <div class="mt-1 text-xs uppercase tracking-wide text-muted">Turmas ativas</div>
      </div>
      <div class="rounded-lg border border-border bg-page p-4 text-center">
        <div class="text-2xl font-semibold text-primary">{{ stats.exams }}</div>
        <div class="mt-1 text-xs uppercase tracking-wide text-muted">Provas</div>
      </div>
      <div class="rounded-lg border border-border bg-page p-4 text-center">
        <div class="text-2xl font-semibold text-primary">{{ stats.applications }}</div>
        <div class="mt-1 text-xs uppercase tracking-wide text-muted">Aplicações</div>
      </div>
      <div class="rounded-lg border border-border bg-page p-4 text-center">
        <div class="text-2xl font-semibold text-primary">{{ stats.pendingGrades }}</div>
        <div class="mt-1 text-xs uppercase tracking-wide text-muted">Notas pendentes</div>
      </div>
    </div>

    <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Ações rápidas</h2>
      <div class="mt-4 flex flex-wrap gap-2">
        <RouterLink
          to="/professor/questions/new"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white no-underline hover:bg-primary-light flex gap-1 items-center"
        >
          <Icon name="ph:plus-bold" class="size-4" />
          <span>Nova questão</span>
        </RouterLink>
        <RouterLink
          to="/professor/classes/new"
          class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page flex gap-1 items-center"
        >
          <Icon name="ph:plus-bold" class="size-4" />
          <span>Nova turma</span>
        </RouterLink>
        <RouterLink
          to="/professor/exams/new"
          class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page flex gap-1 items-center"
        >
          <Icon name="ph:plus-bold" class="size-4" />
          <span>Nova prova</span>
        </RouterLink>
        <RouterLink
          to="/professor/applications/new"
          class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page flex gap-1 items-center"
        >
          <Icon name="ph:plus-bold" class="size-4" />
          <span>Nova aplicação</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
