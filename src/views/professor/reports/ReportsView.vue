<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ApplicationReport, Class, ConsolidatedReport } from '@/types'
import { mockApi } from '@/mock/mockApi'
import { downloadText } from '@/shared/utils'
import LoadingState from '@/components/LoadingState.vue'

const route = useRoute()
const classes = ref<Class[]>([])
const classId = ref('')
const subject = ref('')
const term = ref('')
const applicationId = ref(String(route.query.applicationId ?? ''))
const report = ref<ApplicationReport | null>(null)
const consolidated = ref<ConsolidatedReport | null>(null)
const mode = ref<'single' | 'consolidated'>(applicationId.value ? 'single' : 'consolidated')
const loading = ref(false)

async function loadSingle() {
  if (!applicationId.value) return
  loading.value = true
  report.value = await mockApi.getApplicationReport(applicationId.value)
  consolidated.value = null
  loading.value = false
}

async function loadConsolidated() {
  loading.value = true
  consolidated.value = await mockApi.getConsolidatedReport({
    classId: classId.value || undefined,
    subject: subject.value || undefined,
    term: term.value || undefined,
  })
  report.value = null
  loading.value = false
}

function exportReport(format: 'csv' | 'xlsx' | 'pdf') {
  const id = applicationId.value || 'consolidated'
  const content = mockApi.exportReport(id, format)
  downloadText(content, `relatorio.${format}`, 'text/plain')
}

watch(mode, (m) => (m === 'single' ? loadSingle() : loadConsolidated()))
onMounted(async () => {
  classes.value = await mockApi.listClasses()
  if (mode.value === 'single') loadSingle()
  else loadConsolidated()
})
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Relatórios</h1>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <label class="flex items-center gap-1.5 text-sm">
        <input v-model="mode" type="radio" value="single" /> Por aplicação
      </label>
      <label class="flex items-center gap-1.5 text-sm">
        <input v-model="mode" type="radio" value="consolidated" /> Consolidado
      </label>

      <template v-if="mode === 'single'">
        <input
          v-model="applicationId"
          placeholder="ID da aplicação (ex: app-001)"
          class="rounded-lg border border-border bg-white px-3 py-2"
        />
        <button
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
          @click="loadSingle"
        >
          Carregar
        </button>
      </template>

      <template v-else>
        <select v-model="classId" class="rounded-lg border border-border bg-white px-3 py-2">
          <option value="">Todas as turmas</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model="subject" placeholder="Disciplina" class="rounded-lg border border-border bg-white px-3 py-2" />
        <input v-model="term" placeholder="Período (2026/1)" class="rounded-lg border border-border bg-white px-3 py-2" />
        <button
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
          @click="loadConsolidated"
        >
          Filtrar
        </button>
      </template>
    </div>

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
            class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
            @click="exportReport('csv')"
          >
            Export CSV
          </button>
          <button
            class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
            @click="exportReport('xlsx')"
          >
            Export Excel
          </button>
          <button
            class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
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
              <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Aluno</th>
              <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Nota</th>
              <th class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Máx</th>
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
    </template>
  </div>
</template>
