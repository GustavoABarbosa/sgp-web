<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { ApplicationReport, Class, ConsolidatedReport } from "@/types";
import { mockApi, isApiError } from "@/mock/mockApi";
import { downloadText } from "@/shared/utils";
import LoadingState from "@/components/LoadingState.vue";
import Breadcrumb from "@/components/Breadcrumb.vue";
import Modal from "@/components/Modal.vue";

const route = useRoute();
const classes = ref<Class[]>([]);
const classId = ref("");
const subject = ref("");
const term = ref("");
const applicationId = ref(String(route.query.applicationId ?? ""));
const report = ref<ApplicationReport | null>(null);
const consolidated = ref<ConsolidatedReport | null>(null);
const mode = ref<"single" | "consolidated">(applicationId.value ? "single" : "consolidated");
const loading = ref(false);
const searchStatus = ref<"idle" | "loading" | "found" | "error">("idle");
const searchError = ref("");
const showFilters = ref(false);
const canGenerate = computed(() =>
  mode.value === "single" ? !!applicationId.value.trim() && searchStatus.value !== "loading" : !loading.value,
);

interface StudentStats {
  studentId: string;
  studentName: string;
  examCount: number;
  meanScore: number;
  meanPercent: number;
  best: { score: number; max: number };
  worst: { score: number; max: number };
}

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

async function loadSingle() {
  const id = applicationId.value.trim();
  if (!id) return;
  searchStatus.value = "loading";
  searchError.value = "";
  consolidated.value = null;
  try {
    report.value = await mockApi.getApplicationReport(id);
    searchStatus.value = "found";
  } catch (e) {
    report.value = null;
    searchError.value = isApiError(e) ? e.message : "Erro ao carregar relatório";
    searchStatus.value = "error";
  }
}

async function loadConsolidated() {
  loading.value = true;
  try {
    consolidated.value = await mockApi.getConsolidatedReport({
      classId: classId.value || undefined,
      subject: subject.value || undefined,
      term: term.value || undefined,
    });
    report.value = null;
  } finally {
    loading.value = false;
  }
}

async function generate() {
  if (!canGenerate.value) return;
  if (mode.value === "single") {
    await loadSingle();
    if (searchStatus.value === "found") showFilters.value = false;
  } else {
    await loadConsolidated();
    showFilters.value = false;
  }
}

function exportReport(format: "csv" | "xlsx" | "pdf") {
  const id = applicationId.value || "consolidated";
  const content = mockApi.exportReport(id, format);
  downloadText(content, `relatorio.${format}`, "text/plain");
}

watch(applicationId, () => {
  if (searchStatus.value !== "loading") searchStatus.value = "idle";
});
onMounted(async () => {
  classes.value = await mockApi.listClasses();
  if (mode.value === "single") loadSingle();
  else loadConsolidated();
});
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <Breadcrumb :items="[{ label: 'Relatórios' }]" />
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        @click="showFilters = true"
      >
        <Icon name="ph:chart-bar" class="size-4" />
        Gerar relatório
      </button>
    </div>

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

        <label v-if="mode === 'single'" class="block">
          <span class="mb-1.5 block text-sm font-medium">ID da aplicação</span>
          <div class="relative">
            <input
              v-model="applicationId"
              placeholder="ex: app-001"
              class="w-full rounded-lg border bg-white py-2 pl-3 pr-9"
              :class="searchStatus === 'error' ? 'border-danger' : 'border-border'"
              :aria-invalid="searchStatus === 'error'"
            />
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center" aria-live="polite">
              <Icon v-if="searchStatus === 'loading'" name="ph:spinner-gap" class="size-4 animate-spin text-muted" />
              <Icon v-else-if="searchStatus === 'found'" name="ph:check" class="size-4 text-success" />
              <Icon v-else-if="searchStatus === 'error'" name="ph:warning-circle" class="size-4 text-danger" />
            </span>
          </div>
          <span v-if="searchStatus === 'error'" class="mt-1 block text-xs text-danger">{{ searchError }}</span>
        </label>

        <template v-else>
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium">Turma</span>
            <select v-model="classId" class="w-full rounded-lg border border-border bg-white px-3 py-2">
              <option value="">Todas as turmas</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium">Disciplina</span>
            <input v-model="subject" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
          </label>
          <label class="block">
            <span class="mb-1.5 block text-sm font-medium">Período</span>
            <input
              v-model="term"
              placeholder="ex: 2026/1"
              class="w-full rounded-lg border border-border bg-white px-3 py-2"
            />
          </label>
        </template>
      </form>

      <template #footer="{ close }">
        <button
          type="button"
          class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-page"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="report-filters"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
          :disabled="!canGenerate"
        >
          Gerar
        </button>
      </template>
    </Modal>

    <LoadingState :loading="loading" />

    <template v-if="report">
      <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2>{{ report.examTitle }} — {{ report.className }}</h2>
        <div class="mb-6 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
          <div class="rounded-lg border border-border bg-page p-4 text-center">
            <div class="text-2xl font-semibold text-primary">{{ report.stats.mean.toFixed(1) }}</div>
            <div class="mt-1 text-xs uppercase tracking-wide text-muted">Média</div>
          </div>
          <div class="rounded-lg border border-border bg-page p-4 text-center">
            <div class="text-2xl font-semibold text-primary">{{ report.stats.median.toFixed(1) }}</div>
            <div class="mt-1 text-xs uppercase tracking-wide text-muted">Mediana</div>
          </div>
          <div class="rounded-lg border border-border bg-page p-4 text-center">
            <div class="text-2xl font-semibold text-primary">{{ report.stats.stdDev.toFixed(2) }}</div>
            <div class="mt-1 text-xs uppercase tracking-wide text-muted">Desvio padrão</div>
          </div>
          <div class="rounded-lg border border-border bg-page p-4 text-center">
            <div class="text-2xl font-semibold text-primary">{{ report.stats.count }}</div>
            <div class="mt-1 text-xs uppercase tracking-wide text-muted">Alunos</div>
          </div>
        </div>

        <h3>Distribuição de notas</h3>
        <div class="mt-4 flex h-44 items-end gap-2">
          <div v-for="d in report.distribution" :key="d.range" class="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div class="w-full min-h-1 rounded-t bg-primary" :style="{ height: `${Math.max(d.count * 20, 4)}px` }" />
            <span class="text-center text-xs text-muted">{{ d.range }} ({{ d.count }})</span>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
            @click="exportReport('csv')"
          >
            Export CSV
          </button>
          <button
            class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
            @click="exportReport('xlsx')"
          >
            Export Excel
          </button>
          <button
            class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
            @click="exportReport('pdf')"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Aluno
              </th>
              <th
                class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Nota
              </th>
              <th
                class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Máx
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in report.grades" :key="g.studentId">
              <td class="border-b border-border px-3 py-2.5">{{ g.studentName }}</td>
              <td class="border-b border-border px-3 py-2.5">{{ g.totalScore }}</td>
              <td class="border-b border-border px-3 py-2.5">{{ g.maxScore }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-if="consolidated">
      <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2>Relatório consolidado</h2>
        <div class="mb-6 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
          <div class="rounded-lg border border-border bg-page p-4 text-center">
            <div class="text-2xl font-semibold text-primary">{{ consolidated.totals.mean.toFixed(1) }}</div>
            <div class="mt-1 text-xs uppercase tracking-wide text-muted">Média geral</div>
          </div>
          <div class="rounded-lg border border-border bg-page p-4 text-center">
            <div class="text-2xl font-semibold text-primary">{{ consolidated.totals.median.toFixed(1) }}</div>
            <div class="mt-1 text-xs uppercase tracking-wide text-muted">Mediana geral</div>
          </div>
          <div class="rounded-lg border border-border bg-page p-4 text-center">
            <div class="text-2xl font-semibold text-primary">{{ consolidated.totals.count }}</div>
            <div class="mt-1 text-xs uppercase tracking-wide text-muted">Total de notas</div>
          </div>
        </div>
        <p>{{ consolidated.applications.length }} aplicação(ões) no relatório</p>
      </div>

      <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2>Alunos</h2>
        <p v-if="!studentStats.length" class="text-sm text-muted">Nenhuma nota encontrada para os filtros</p>
        <table v-else class="w-full border-collapse text-sm">
          <thead>
            <tr class="[&>th]:border-b [&>th]:border-border [&>th]:px-3 [&>th]:py-2.5 [&>th]:text-xs [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-muted">
              <th class="text-left">Aluno</th>
              <th class="text-right">Provas</th>
              <th class="text-right">Média</th>
              <th class="text-right">Aproveitamento</th>
              <th class="text-right">Melhor</th>
              <th class="text-right">Pior</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in studentStats"
              :key="s.studentId"
              class="[&>td]:border-b [&>td]:border-border [&>td]:px-3 [&>td]:py-2.5"
            >
              <td>{{ s.studentName }}</td>
              <td class="text-right">{{ s.examCount }}</td>
              <td class="text-right">{{ s.meanScore.toFixed(1) }}</td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <div class="h-1.5 w-16 overflow-hidden rounded-full bg-page">
                    <div class="h-full rounded-full bg-primary" :style="{ width: `${s.meanPercent}%` }" />
                  </div>
                  <span class="w-12">{{ s.meanPercent.toFixed(0) }}%</span>
                </div>
              </td>
              <td class="text-right">{{ s.best.score }}/{{ s.best.max }}</td>
              <td class="text-right">{{ s.worst.score }}/{{ s.worst.max }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
