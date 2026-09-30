<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import type {
  ApplicationDetail,
  Correction,
  ExamAssignment,
  ExamVersion,
  PdfGenerationConfig,
  User,
} from "@/types";
import { applicationsApi } from "@/api/applications";
import { classesApi } from "@/api/classes";
import { useToastStore } from "@/stores/toast";
import { errorMessage } from "@/shared/api/client";
import { copyToClipboard, downloadText, statusLabel } from "@/shared/utils";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import LoadingState from "@/components/LoadingState.vue";
import PageHeader from "@/components/PageHeader.vue";
import ApplicationTimeline from "./ApplicationTimeline.vue";
import AssignCorrectionModal from "./AssignCorrectionModal.vue";
import CorrectionsTable from "./CorrectionsTable.vue";
import PdfGenerationPanel from "./PdfGenerationPanel.vue";
import VersionsTable from "./VersionsTable.vue";

const route = useRoute();
const toast = useToastStore();
const applicationId = String(route.params.id);

const detail = ref<ApplicationDetail | null>(null);
const versions = ref<ExamVersion[]>([]);
const assignments = ref<ExamAssignment[]>([]);
const corrections = ref<Correction[]>([]);
const students = ref<User[]>([]);
const loading = ref(true);
const loadError = ref("");
const generating = ref(false);
const showAssignModal = ref(false);
const selectedCorrection = ref<Correction | null>(null);

const app = computed(() => detail.value?.application ?? null);
const versionNumbers = computed(() => new Map(versions.value.map((v) => [v.id, v.versionNumber])));
const pendingCount = computed(() => corrections.value.filter((c) => !c.studentId).length);

const assignmentColumns: Column[] = [
  { key: "studentName", label: "Aluno" },
  { key: "version", label: "Versão" },
];

async function load() {
  try {
    const [value, versionList, assignmentList, correctionList] = await Promise.all([
      applicationsApi.get(applicationId),
      applicationsApi.versions(applicationId),
      applicationsApi.assignments(applicationId),
      applicationsApi.corrections(applicationId),
    ]);
    const enrolled = await classesApi.students(value.class.id);
    detail.value = value;
    versions.value = versionList;
    assignments.value = assignmentList;
    corrections.value = correctionList;
    students.value = enrolled.map((e) => e.student);
    loadError.value = "";
  } catch (e) {
    loadError.value = errorMessage(e, "Erro ao carregar aplicação");
  } finally {
    loading.value = false;
  }
}

async function generatePdf(config: PdfGenerationConfig) {
  generating.value = true;
  try {
    await applicationsApi.generatePdf(applicationId, config);
    toast.success("PDF gerado com sucesso!");
    await load();
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao gerar PDF"));
  } finally {
    generating.value = false;
  }
}

function downloadPdf() {
  downloadText(
    "Prova consolidada (simulação)\n\nO PDF real será fornecido pela API.",
    "prova-consolidada.txt",
  );
}

async function publish(versionId?: string) {
  try {
    await applicationsApi.publishAnswerKey(applicationId, versionId);
    versions.value = await applicationsApi.versions(applicationId);
    toast.success(versionId ? "Gabarito publicado." : "Gabarito publicado para todas as versões.");
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao publicar gabarito"));
  }
}

async function copyPublicLink(publicCode: string) {
  try {
    await copyToClipboard(`${window.location.origin}/gabarito/${publicCode}`);
    toast.success("Link copiado!");
  } catch {
    toast.error("Não foi possível copiar o link");
  }
}

function openAssign(correction: Correction) {
  selectedCorrection.value = correction;
  showAssignModal.value = true;
}

async function reloadCorrections() {
  corrections.value = await applicationsApi.corrections(applicationId);
}

onMounted(load);
</script>

<template>
  <div>
    <PageHeader
      :items="[
        { label: 'Aplicações', to: '/professor/applications' },
        { label: detail?.exam.title ?? (loading ? 'Carregando...' : 'Aplicação') },
      ]"
    />

    <LoadingState :loading="loading" :message="loadError" />

    <template v-if="detail && app">
      <ApplicationTimeline
        :pdf-generated="app.status === 'generated'"
        :answer-key-published="versions.some((v) => v.answerKeyPublished)"
        :correction-count="corrections.length"
        :pending-count="pendingCount"
      />

      <BaseCard>
        <div class="flex flex-wrap gap-2">
          <div class="w-32 rounded-lg border border-border p-2">
            <h2>Status</h2>
            <p>{{ statusLabel(app.status) }}</p>
          </div>
          <div class="rounded-lg border border-border p-2">
            <h2>Turma</h2>
            <p>{{ detail.class.name }} — {{ detail.class.subject }} ({{ detail.class.term }})</p>
          </div>
          <div class="ms-auto">
            <BaseButton
              variant="secondary"
              size="sm"
              :to="{ path: '/professor/reports', query: { applicationId: app.id } }"
            >
              Ir para relatório
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <PdfGenerationPanel
        :generated="app.status === 'generated'"
        :has-pdf="!!app.pdfUrl"
        :generating="generating"
        @generate="generatePdf"
        @download="downloadPdf"
      />

      <VersionsTable v-if="versions.length" :versions="versions" @publish="publish" @copy-link="copyPublicLink" />

      <BaseCard v-if="assignments.length" title="Atribuições aluno ↔ versão" class="mt-4">
        <DataTable :columns="assignmentColumns" :rows="assignments" :row-key="(a: ExamAssignment) => a.id">
          <template #cell-version="{ row }">{{ versionNumbers.get(row.examVersionId) ?? "—" }}</template>
        </DataTable>
      </BaseCard>

      <CorrectionsTable :corrections="corrections" :students="students" @assign="openAssign" />

      <AssignCorrectionModal
        v-model="showAssignModal"
        :application-id="applicationId"
        :correction="selectedCorrection"
        :students="students"
        @assigned="reloadCorrections"
      />
    </template>
  </div>
</template>
