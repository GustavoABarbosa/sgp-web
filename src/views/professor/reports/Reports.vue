<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import type { ApplicationReport, ApplicationSummary, Class, ConsolidatedReport } from "@/types";
import { applicationsApi } from "@/api/applications";
import { classesApi } from "@/api/classes";
import { reportsApi } from "@/api/reports";
import { errorMessage } from "@/shared/api/client";
import { downloadText, toCsv } from "@/shared/utils";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import FormField from "@/components/FormField.vue";
import LoadingState from "@/components/LoadingState.vue";
import Modal from "@/components/Modal.vue";
import PageHeader from "@/components/PageHeader.vue";
import SimpleBarChart from "@/components/SimpleBarChart.vue";
import StatCard from "@/components/StatCard.vue";
import StatGrid from "@/components/StatGrid.vue";

type Grade = ApplicationReport["grades"][number];

interface StudentStats {
  studentId: string;
  studentName: string;
  examCount: number;
  meanScore: number;
  meanPercent: number;
  best: { score: number; max: number };
  worst: { score: number; max: number };
}

const route = useRoute();
const classes = ref<Class[]>([]);
const applications = ref<ApplicationSummary[]>([]);
const classId = ref("");
const subject = ref("");
const term = ref("");
const applicationId = ref(String(route.query.applicationId ?? ""));
const mode = ref<"single" | "consolidated">(applicationId.value ? "single" : "consolidated");
const report = ref<ApplicationReport | null>(null);
const consolidated = ref<ConsolidatedReport | null>(null);
const loading = ref(false);
const error = ref("");
const showFilters = ref(false);
const canGenerate = computed(() => !loading.value && (mode.value === "consolidated" || !!applicationId.value));

const gradeColumns: Column[] = [
  { key: "studentName", label: "Aluno" },
  { key: "totalScore", label: "Nota" },
  { key: "maxScore", label: "Máx" },
];

const studentColumns: Column[] = [
  { key: "studentName", label: "Aluno" },
  { key: "examCount", label: "Provas", align: "right" },
  { key: "meanScore", label: "Média", align: "right" },
  { key: "meanPercent", label: "Aproveitamento", align: "right" },
  { key: "best", label: "Melhor", align: "right" },
  { key: "worst", label: "Pior", align: "right" },
];

const distribution = computed(() =>
  (report.value?.distribution ?? []).map((d) => ({ label: `${d.range} (${d.count})`, value: d.count })),
);

const studentStats = computed<StudentStats[]>(() => {
  if (!consolidated.value) return [];
  const byStudent = new Map<string, { name: string; grades: { score: number; max: number }[] }>();
  for (const app of consolidated.value.applications) {
    for (const g of app.grades) {
      const entry = byStudent.get(g.studentId) ?? { name: g.studentName, grades: [] };
      entry.grades.push({ score: g.totalScore, max: g.maxScore });
      byStudent.set(g.studentId, entry);
    }
  }
  const percent = (g: { score: number; max: number }) => (g.max > 0 ? (g.score / g.max) * 100 : 0);
  return [...byStudent.entries()]
    .map(([studentId, { name, grades }]) => {
      const sorted = [...grades].sort((a, b) => percent(b) - percent(a));
      return {
        studentId,
        studentName: name,
        examCount: grades.length,
        meanScore: grades.reduce((s, g) => s + g.score, 0) / grades.length,
        meanPercent: grades.reduce((s, g) => s + percent(g), 0) / grades.length,
        best: sorted[0]!,
        worst: sorted[sorted.length - 1]!,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
});

async function generate() {
  if (!canGenerate.value) return;
  loading.value = true;
  error.value = "";
  try {
    if (mode.value === "single") {
      report.value = await reportsApi.application(applicationId.value);
      consolidated.value = null;
    } else {
      consolidated.value = await reportsApi.consolidated({
        classId: classId.value || undefined,
        subject: subject.value.trim() || undefined,
        term: term.value.trim() || undefined,
      });
      report.value = null;
    }
    showFilters.value = false;
  } catch (e) {
    error.value = errorMessage(e, "Erro ao carregar relatório");
  } finally {
    loading.value = false;
  }
}

function exportCsv() {
  if (report.value) {
    const rows = [
      ["Aluno", "Nota", "Máx"],
      ...report.value.grades.map((g: Grade) => [g.studentName, g.totalScore, g.maxScore]),
    ];
    downloadText(toCsv(rows), `relatorio-${report.value.applicationId}.csv`, "text/csv;charset=utf-8");
  } else if (consolidated.value) {
    const rows = [
      ["Aluno", "Provas", "Média", "Aproveitamento (%)", "Melhor", "Pior"],
      ...studentStats.value.map((s) => [
        s.studentName,
        s.examCount,
        s.meanScore.toFixed(1),
        s.meanPercent.toFixed(0),
        `${s.best.score}/${s.best.max}`,
        `${s.worst.score}/${s.worst.max}`,
      ]),
    ];
    downloadText(toCsv(rows), "relatorio-consolidado.csv", "text/csv;charset=utf-8");
  }
}

onMounted(async () => {
  try {
    [classes.value, applications.value] = await Promise.all([classesApi.list(), applicationsApi.list()]);
  } catch (e) {
    error.value = errorMessage(e, "Erro ao carregar filtros");
  }
  generate();
});
</script>

<template>
  <div>
    <PageHeader :items="[{ label: 'Relatórios' }]">
      <BaseButton icon="ph:chart-bar" @click="showFilters = true">Gerar relatório</BaseButton>
    </PageHeader>

    <Modal v-model="showFilters" title="Gerar relatório">
      <form id="report-filters" class="space-y-4" @submit.prevent="generate">
        <fieldset>
          <legend class="mb-1.5 text-sm font-medium">Tipo de relatório</legend>
          <div class="flex gap-4">
            <label class="flex items-center gap-1.5 text-sm">
              <input v-model="mode" type="radio" value="single" class="accent-primary" /> Por aplicação
            </label>
            <label class="flex items-center gap-1.5 text-sm">
              <input v-model="mode" type="radio" value="consolidated" class="accent-primary" /> Consolidado
            </label>
          </div>
        </fieldset>

        <FormField v-if="mode === 'single'" v-model="applicationId" as="select" label="Aplicação">
          <option value="" disabled>Selecione...</option>
          <option v-for="a in applications" :key="a.id" :value="a.id">{{ a.examTitle }} — {{ a.className }}</option>
        </FormField>

        <template v-else>
          <FormField v-model="classId" as="select" label="Turma">
            <option value="">Todas as turmas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </FormField>
          <FormField v-model="subject" label="Disciplina" />
          <FormField v-model="term" label="Período" placeholder="ex: 2026/1" />
        </template>

        <p v-if="error && showFilters" role="alert" class="text-sm text-danger">{{ error }}</p>
      </form>

      <template #footer="{ close }">
        <BaseButton variant="secondary" @click="close">Cancelar</BaseButton>
        <BaseButton type="submit" form="report-filters" :disabled="!canGenerate" :loading="loading">Gerar</BaseButton>
      </template>
    </Modal>

    <LoadingState :loading="loading && !showFilters" :message="showFilters ? '' : error" />

    <template v-if="report">
      <BaseCard :title="`${report.examTitle} — ${report.className}`">
        <StatGrid>
          <StatCard label="Média" :value="report.stats.mean.toFixed(1)" />
          <StatCard label="Mediana" :value="report.stats.median.toFixed(1)" />
          <StatCard label="Desvio padrão" :value="report.stats.stdDev.toFixed(2)" />
          <StatCard label="Alunos" :value="report.stats.count" />
        </StatGrid>

        <h3>Distribuição de notas</h3>
        <SimpleBarChart :data="distribution" label="Distribuição de notas por faixa de aproveitamento" />

        <div class="mt-4 flex justify-end">
          <BaseButton variant="secondary" size="sm" icon="ph:file-csv" @click="exportCsv">Exportar CSV</BaseButton>
        </div>
      </BaseCard>

      <BaseCard class="mt-4">
        <DataTable
          :columns="gradeColumns"
          :rows="report.grades"
          :row-key="(g: Grade) => g.studentId"
          empty="Nenhuma nota lançada"
        />
      </BaseCard>
    </template>

    <template v-if="consolidated">
      <BaseCard title="Relatório consolidado">
        <StatGrid>
          <StatCard label="Média geral" :value="consolidated.totals.mean.toFixed(1)" />
          <StatCard label="Mediana geral" :value="consolidated.totals.median.toFixed(1)" />
          <StatCard label="Total de notas" :value="consolidated.totals.count" />
        </StatGrid>
        <div class="flex justify-end items-center gap-2">
          <p class="text-sm text-muted">{{ consolidated.applications.length }} {{ consolidated.applications.length > 1 ? 'aplicações' : 'aplicação' }} no relatório</p>
          <BaseButton
            v-if="studentStats.length"
            variant="secondary"
            size="sm"
            icon="ph:file-csv"
            @click="exportCsv"
          >
            Exportar CSV
          </BaseButton>
        </div>
      </BaseCard>

      <BaseCard title="Alunos" class="mt-4">
        <DataTable
          :columns="studentColumns"
          :rows="studentStats"
          :row-key="(s: StudentStats) => s.studentId"
          empty="Nenhuma nota encontrada para os filtros"
        >
          <template #cell-meanScore="{ row }">{{ row.meanScore.toFixed(1) }}</template>
          <template #cell-meanPercent="{ row }">
            <div class="flex items-center justify-end gap-2">
              <div class="h-1.5 w-16 overflow-hidden rounded-full bg-page" aria-hidden="true">
                <div class="h-full rounded-full bg-primary" :style="{ width: `${row.meanPercent}%` }" />
              </div>
              <span class="w-12">{{ row.meanPercent.toFixed(0) }}%</span>
            </div>
          </template>
          <template #cell-best="{ row }">{{ row.best.score }}/{{ row.best.max }}</template>
          <template #cell-worst="{ row }">{{ row.worst.score }}/{{ row.worst.max }}</template>
        </DataTable>
      </BaseCard>
    </template>
  </div>
</template>
