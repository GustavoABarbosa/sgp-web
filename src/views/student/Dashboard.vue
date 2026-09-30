<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { studentApi } from "@/api/student";
import { useResource } from "@/shared/useResource";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatCard from "@/components/StatCard.vue";

const auth = useAuthStore();
const { data, error } = useResource(() => Promise.all([studentApi.exams(), studentApi.grades()]));

const exams = computed(() => data.value?.[0] ?? []);
const grades = computed(() => data.value?.[1] ?? []);
const meanPercent = computed(() => {
  const scored = grades.value.filter((g) => g.maxScore > 0);
  if (!scored.length) return "--";
  const mean = scored.reduce((sum, g) => sum + g.totalScore / g.maxScore, 0) / scored.length;
  return `${Math.round(mean * 100)}%`;
});
const firstName = computed(() => auth.user?.fullName.split(" ")[0] ?? "");
</script>

<template>
  <div>
    <PageHeader :items="[{ label: `Olá, ${firstName}` }]" />

    <p v-if="error" role="alert" class="mb-4 text-sm text-danger">{{ error }}</p>

    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Provas atribuídas" :value="exams.length || '--'" />
      <StatCard label="Notas lançadas" :value="grades.length || '--'" />
      <StatCard label="Aproveitamento médio" :value="meanPercent" />
    </div>

    <BaseCard title="Atalhos">
      <div class="mt-4 flex flex-wrap gap-2">
        <BaseButton variant="secondary" to="/aluno/exams">Ver minhas provas</BaseButton>
        <BaseButton variant="secondary" to="/aluno/grades">Ver notas</BaseButton>
      </div>
    </BaseCard>
  </div>
</template>
