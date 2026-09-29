<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import type { Application, Class, Correction, Exam, ExamAssignment, ExamVersion } from "@/types";
import { mockApi, isApiError } from "@/mock/mockApi";
import StatusBadge from "@/components/StatusBadge.vue";
import Breadcrumb from "@/components/Breadcrumb.vue";
import { copyToClipboard, downloadText, formatDateTime, statusLabel } from "@/shared/utils";
import { useToast } from "@/shared/useToast";

const route = useRoute();
const toast = useToast();
const app = ref<Application | null>(null);
const exam = ref<Exam | null>(null);
const cls = ref<Class | null>(null);
const versions = ref<ExamVersion[]>([]);
const assignments = ref<ExamAssignment[]>([]);
const corrections = ref<Correction[]>([]);
const pendingCorrections = ref<Correction[]>([]);
const students = ref<{ id: string; fullName: string; email: string }[]>([]);

const versionCount = ref(1);
const versionConfigs = ref([{ shuffleQuestions: true, shuffleAlternatives: true, withStudentIdentification: true }]);
const generating = ref(false);
const showAssignModal = ref(false);
const selectedCorrection = ref<Correction | null>(null);
const assignStudentId = ref("");
const assignNotes = ref("");

const steps = computed(() => {
  const hasPdf = app.value?.status === "generated";
  const hasPublished = versions.value.some((v) => v.answerKeyPublished);
  const hasCorrections = corrections.value.length > 0;
  const allAssigned = pendingCorrections.value.length === 0;
  const items = [
    { label: "Criada", done: true },
    { label: "PDF gerado", done: hasPdf },
    { label: "Gabarito publicado", done: hasPublished },
    { label: "Corrigido", done: hasCorrections },
    { label: "Notas lançadas", done: hasCorrections && allAssigned },
  ];
  const currentIndex = items.findIndex((s) => !s.done);
  return items.map((s, i) => ({ ...s, current: i === currentIndex }));
});

function syncVersionConfigs() {
  while (versionConfigs.value.length < versionCount.value) {
    versionConfigs.value.push({
      shuffleQuestions: true,
      shuffleAlternatives: false,
      withStudentIdentification: true,
    });
  }
  versionConfigs.value = versionConfigs.value.slice(0, versionCount.value);
}

async function load() {
  const id = String(route.params.id);
  app.value = await mockApi.getApplication(id);
  const [exams, classes] = await Promise.all([mockApi.listExams(), mockApi.listClasses()]);
  exam.value = exams.find((e) => e.id === app.value!.examId) ?? null;
  cls.value = classes.find((c) => c.id === app.value!.classId) ?? null;
  versions.value = await mockApi.listVersions(id);
  assignments.value = await mockApi.listAssignments(id);
  corrections.value = await mockApi.listCorrections(id);
  pendingCorrections.value = await mockApi.listCorrections(id, false);
  const enrolled = await mockApi.listClassStudents(app.value!.classId);
  students.value = enrolled.map((e) => e.student);
}

async function generatePdf() {
  generating.value = true;
  try {
    syncVersionConfigs();
    app.value = await mockApi.generatePdf(String(route.params.id), { versions: versionConfigs.value });
    toast.success("PDF gerado com sucesso!");
    load();
  } catch (e) {
    toast.error(isApiError(e) ? e.message : "Erro ao gerar PDF");
  } finally {
    generating.value = false;
  }
}

function downloadPdf() {
  if (!app.value?.pdfUrl) return;
  downloadText(
    "PDF mock — prova consolidada\n\nEste é um arquivo simulado.",
    "prova-consolidada.pdf",
    "application/pdf",
  );
}

async function publishAll() {
  try {
    await mockApi.publishAnswerKey(String(route.params.id));
    toast.success("Gabarito publicado para todas as versões");
    load();
  } catch (e) {
    toast.error(isApiError(e) ? e.message : "Erro ao publicar gabarito");
  }
}

async function publishVersion(versionId: string) {
  try {
    await mockApi.publishAnswerKey(String(route.params.id), versionId);
    toast.success("Gabarito publicado");
    load();
  } catch (e) {
    toast.error(isApiError(e) ? e.message : "Erro ao publicar gabarito");
  }
}

async function copyPublicLink(publicCode: string) {
  const url = `${window.location.origin}/gabarito/${publicCode}`;
  try {
    await copyToClipboard(url);
    toast.success("Link copiado!");
  } catch {
    toast.error("Não foi possível copiar o link");
  }
}

function openAssign(correction: Correction) {
  selectedCorrection.value = correction;
  assignStudentId.value = "";
  assignNotes.value = "";
  showAssignModal.value = true;
}

async function confirmAssign() {
  if (!selectedCorrection.value || !assignStudentId.value) return;
  try {
    await mockApi.assignCorrection(
      String(route.params.id),
      selectedCorrection.value.id,
      assignStudentId.value,
      assignNotes.value || undefined,
    );
    showAssignModal.value = false;
    toast.success("Nota atribuída ao aluno");
    load();
  } catch (e) {
    toast.error(isApiError(e) ? e.message : "Erro ao atribuir nota");
  }
}

onMounted(load);
</script>

<template>
  <div v-if="app && exam && cls">
    <Breadcrumb class="mb-6" :items="[{ label: 'Aplicações', to: '/professor/applications' }, { label: exam.title }]" />

    <ol class="mx-auto mb-6 flex max-w-215 items-center overflow-x-auto">
      <template v-for="(s, i) in steps" :key="s.label">
        <li
          v-if="i > 0"
          aria-hidden="true"
          class="mx-1 h-0.5 min-w-6 flex-1 rounded-full"
          :class="s.done ? 'bg-success' : 'bg-border'"
        />
        <li
          class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
          :class="
            s.current
              ? 'border-primary bg-primary text-white'
              : s.done
                ? 'border-success bg-success/10 text-success'
                : 'border-border bg-white text-muted'
          "
          :aria-current="s.current ? 'step' : undefined"
        >
          <Icon v-if="s.done && !s.current" name="ph:check-bold" class="size-3" />
          <span
            v-else
            class="flex size-4 items-center justify-center rounded-full text-[10px]"
            :class="s.current ? 'bg-white/20' : 'bg-page'"
          >
            {{ i + 1 }}
          </span>
          {{ s.label }}
        </li>
      </template>
    </ol>

    <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div class="flex flex-wrap gap-2">
        <div class="p-2 border border-border rounded-lg w-32">
          <h2>Status</h2>
          <p>{{ statusLabel(app.status) }}</p>
        </div>
        <div class="p-2 border border-border rounded-lg">
          <h2>Turma</h2>
          <p>{{ cls.name }} — {{ cls.subject }} ({{ cls.term }})</p>
        </div>
        <div class="ms-auto">
          <RouterLink
            :to="`/professor/reports?applicationId=${app.id}`"
            class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text no-underline hover:bg-page"
          >
            Ir para relatório
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Geração de PDF</h2>
      <div class="mb-4">
        <label class="mb-1.5 block text-sm font-medium">Quantidade de versões</label>
        <input
          v-model.number="versionCount"
          type="number"
          min="1"
          max="10"
          class="w-full rounded-lg border border-border bg-white px-3 py-2"
          @change="syncVersionConfigs"
        />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="(v, i) in versionConfigs.slice(0, versionCount)"
          :key="i"
          class="mb-4 space-y-2 rounded-lg border border-border bg-page p-4"
        >
          <h3 class="mb-2 text-sm font-semibold">Versão {{ i + 1 }}</h3>
          <label class="flex items-center gap-2 text-sm"
            ><input v-model="v.shuffleQuestions" type="checkbox" /> Embaralhar questões</label
          >
          <label class="flex items-center gap-2 text-sm"
            ><input v-model="v.shuffleAlternatives" type="checkbox" /> Embaralhar alternativas</label
          >
          <label class="flex items-center gap-2 text-sm"
            ><input v-model="v.withStudentIdentification" type="checkbox" /> Com identificação do aluno</label
          >
        </div>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
          :disabled="generating"
          @click="generatePdf"
        >
          {{ generating ? "Gerando..." : app.status === "generated" ? "Regenerar PDF" : "Gerar PDF" }}
        </button>
        <button
          v-if="app.pdfUrl"
          class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-page"
          @click="downloadPdf"
        >
          Download PDF
        </button>
      </div>
    </div>

    <div v-if="versions.length" class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Versões geradas</h2>
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Versão
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Embaralhamento
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Identificação
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Gabarito
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            ></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in versions" :key="v.id">
            <td class="border-b border-border px-3 py-2.5">{{ v.versionNumber }}</td>
            <td class="border-b border-border px-3 py-2.5">
              Q:{{ v.shuffleQuestions ? "Sim" : "Não" }} / A:{{ v.shuffleAlternatives ? "Sim" : "Não" }}
            </td>
            <td class="border-b border-border px-3 py-2.5">{{ v.withStudentIdentification ? "Sim" : "Não" }}</td>
            <td class="border-b border-border px-3 py-2.5">
              <StatusBadge :status="v.answerKeyPublished ? 'ready' : 'draft'">
                {{ v.answerKeyPublished ? "Publicado" : "Não publicado" }}
              </StatusBadge>
            </td>
            <td class="border-b border-border px-3 py-2.5">
              <div class="flex flex-wrap gap-2">
                <button
                  v-if="!v.answerKeyPublished"
                  class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
                  @click="publishVersion(v.id)"
                >
                  Publicar
                </button>
                <button
                  class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
                  @click="copyPublicLink(v.publicCode)"
                >
                  Copiar link gabarito
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <button
        class="mt-3 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
        @click="publishAll"
      >
        Publicar todos os gabaritos
      </button>
    </div>

    <div v-if="assignments.length" class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Atribuições aluno ↔ versão</h2>
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
              Versão
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in assignments" :key="a.id">
            <td class="border-b border-border px-3 py-2.5">{{ a.studentName }}</td>
            <td class="border-b border-border px-3 py-2.5">
              {{ versions.find((v) => v.id === a.examVersionId)?.versionNumber ?? "—" }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Correções pendentes de atribuição</h2>
      <p v-if="!pendingCorrections.length" class="text-sm text-muted">Nenhuma correção pendente</p>
      <table v-else class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Nota
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Nome informado
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Matrícula
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Data
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            ></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in pendingCorrections" :key="c.id">
            <td class="border-b border-border px-3 py-2.5">{{ c.totalScore }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ c.reportedStudentName ?? "—" }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ c.reportedStudentRegistration ?? "—" }}</td>
            <td class="border-b border-border px-3 py-2.5">{{ formatDateTime(c.confirmedAt) }}</td>
            <td class="border-b border-border px-3 py-2.5">
              <button
                class="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-light"
                @click="openAssign(c)"
              >
                Atribuir aluno
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="corrections.length" class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Todas as correções</h2>
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
              Atribuição
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Sync
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in corrections" :key="c.id">
            <td class="border-b border-border px-3 py-2.5">
              {{
                c.studentId
                  ? (students.find((s) => s.id === c.studentId)?.fullName ?? c.studentId)
                  : (c.reportedStudentName ?? "Pendente")
              }}
            </td>
            <td class="border-b border-border px-3 py-2.5">{{ c.totalScore }}</td>
            <td class="border-b border-border px-3 py-2.5">
              {{ c.isAutomaticallyAssigned ? "Automática" : "Manual" }}
            </td>
            <td class="border-b border-border px-3 py-2.5">
              <StatusBadge :status="c.syncStatus">{{ statusLabel(c.syncStatus) }}</StatusBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showAssignModal && selectedCorrection"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      @click.self="showAssignModal = false"
    >
      <div class="w-full max-w-md rounded-lg bg-surface p-6 shadow-2xl">
        <h2>Atribuir nota ao aluno</h2>
        <p>
          Nota calculada: <strong>{{ selectedCorrection.totalScore }}</strong>
        </p>
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-medium">Aluno da turma</label>
          <select v-model="assignStudentId" required class="w-full rounded-lg border border-border bg-white px-3 py-2">
            <option value="" disabled>Selecione...</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.fullName }} — {{ s.email }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="mb-1.5 block text-sm font-medium">Observações</label>
          <textarea v-model="assignNotes" rows="2" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
        </div>
        <div class="flex justify-end gap-2">
          <button
            class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-page"
            @click="showAssignModal = false"
          >
            Cancelar
          </button>
          <button
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
            :disabled="!assignStudentId"
            @click="confirmAssign"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
