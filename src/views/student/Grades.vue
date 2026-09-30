<script setup lang="ts">
import { computed, ref } from "vue";
import type { StudentGrade } from "@/types";
import { studentApi } from "@/api/student";
import { formatDate } from "@/shared/utils";
import { useResource } from "@/shared/useResource";
import BaseCard from "@/components/BaseCard.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import LoadingState from "@/components/LoadingState.vue";
import PageHeader from "@/components/PageHeader.vue";
import SelectField from "@/components/SelectField.vue";
import SimpleBarChart from "@/components/SimpleBarChart.vue";

const { data, isLoading, error } = useResource(studentApi.grades);
const subject = ref("");
const term = ref("");

const allGrades = computed(() => data.value ?? []);
const subjects = computed(() => [...new Set(allGrades.value.map((g) => g.subject))].sort());
const terms = computed(() => [...new Set(allGrades.value.map((g) => g.term))].sort());

const grades = computed(() =>
  allGrades.value.filter((g) => (!subject.value || g.subject === subject.value) && (!term.value || g.term === term.value)),
);

const chartData = computed(() =>
  [...grades.value]
    .sort((a, b) => new Date(a.correctedAt).getTime() - new Date(b.correctedAt).getTime())
    .map((g) => ({ label: g.examTitle, value: g.totalScore, max: g.maxScore, caption: `${g.totalScore}/${g.maxScore}` })),
);

const columns: Column[] = [
  { key: "examTitle", label: "Prova", class: "min-w-40" },
  { key: "subject", label: "Disciplina", class: "min-w-40" },
  { key: "score", label: "Nota", align: "center", class: "min-w-20" },
  { key: "professorName", label: "Professor", class: "min-w-40" },
  { key: "correctedAt", label: "Data", align: "center", class: "min-w-20" },
];
</script>

<template>
  <div>
    <PageHeader :items="[{ label: 'Histórico de notas' }]" />

    <div class="mb-4 flex flex-wrap gap-3">
      <SelectField v-model="subject" label="Disciplina" hide-label size="md">
        <option value="">Todas as disciplinas</option>
        <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
      </SelectField>
      <SelectField v-model="term" label="Período" hide-label size="md">
        <option value="">Todos os períodos</option>
        <option v-for="t in terms" :key="t" :value="t">{{ t }}</option>
      </SelectField>
    </div>

    <BaseCard v-if="chartData.length" title="Evolução">
      <SimpleBarChart :data="chartData" label="Nota de cada prova em relação à nota máxima, em ordem cronológica" />
    </BaseCard>

    <LoadingState :loading="isLoading && !data" :message="error" />

    <BaseCard v-if="data" class="mt-4">
      <DataTable
        :columns="columns"
        :rows="grades"
        :row-key="(g: StudentGrade) => g.applicationId"
        :row-to="(g: StudentGrade) => `/aluno/grades/${g.applicationId}`"
        empty="Nenhuma nota registrada"
      >
        <template #cell-score="{ row }"><strong>{{ row.totalScore }}</strong> / {{ row.maxScore }}</template>
        <template #cell-correctedAt="{ row }">{{ formatDate(row.correctedAt) }}</template>
      </DataTable>
    </BaseCard>
  </div>
</template>
