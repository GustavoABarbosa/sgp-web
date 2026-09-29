<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { Exam } from "@/types";
import { mockApi, isApiError } from "@/mock/mockApi";
import StatusBadge from "@/components/StatusBadge.vue";
import LoadingState from "@/components/LoadingState.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import Breadcrumb from "@/components/Breadcrumb.vue";
import { statusLabel } from "@/shared/utils";

const router = useRouter();
const exams = ref<Exam[]>([]);
const loading = ref(true);
const statusFilter = ref("");
const showArchiveModal = ref(false);
const examToArchive = ref<string | null>(null);
const archiveError = ref("");

async function load() {
  loading.value = true;
  exams.value = await mockApi.listExams(statusFilter.value || undefined);
  loading.value = false;
}

function requestArchive(id: string) {
  examToArchive.value = id;
  showArchiveModal.value = true;
}

async function confirmArchive() {
  if (!examToArchive.value) return;
  try {
    await mockApi.archiveExam(examToArchive.value);
    showArchiveModal.value = false;
    examToArchive.value = null;
    archiveError.value = "";
    load();
  } catch (e) {
    archiveError.value = isApiError(e) ? e.message : "Erro ao arquivar";
  }
}

function cancelArchive() {
  examToArchive.value = null;
  archiveError.value = "";
}

watch(statusFilter, load);
onMounted(load);
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <Breadcrumb :items="[{ label: 'Provas' }]" />
      <RouterLink
        to="/professor/exams/new"
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white no-underline hover:bg-primary-light flex gap-1 items-center"
      >
        <Icon name="ph:plus-bold" class="size-4" />
        <span>Nova prova</span>
      </RouterLink>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <select v-model="statusFilter" class="rounded-lg border border-border bg-white px-3 py-2">
        <option value="">Todos</option>
        <option value="draft">Rascunho</option>
        <option value="ready">Pronta</option>
        <option value="closed">Arquivada</option>
      </select>
    </div>

    <LoadingState :loading="loading" :message="exams.length ? '' : 'Nenhuma prova'" />

    <div v-if="exams.length" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Título
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Questões
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Status
            </th>
            <th
              class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
            ></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in exams" :key="e.id">
            <td class="border-b border-border px-3 py-2.5">{{ e.title }}</td>
            <td class="border-b border-border px-3 py-2.5 text-center">{{ e.questions.length }}</td>
            <td class="border-b border-border px-3 py-2.5 text-center">
              <StatusBadge :status="e.status">{{ statusLabel(e.status) }}</StatusBadge>
            </td>
            <td class="border-b border-border px-3 py-2.5">
              <div class="flex justify-end gap-2">
                <button
                  v-if="e.status !== 'closed'"
                  class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
                  @click="router.push(`/professor/exams/${e.id}/edit`)"
                >
                  Editar
                </button>
                <button
                  v-if="e.status !== 'closed'"
                  class="rounded-lg bg-danger px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                  @click="requestArchive(e.id)"
                >
                  Arquivar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmModal
      v-model="showArchiveModal"
      title="Arquivar prova"
      confirm-label="Arquivar"
      @cancel="cancelArchive"
      @confirm="confirmArchive"
    >
      <p>Deseja arquivar esta prova? Ela não poderá mais ser editada.</p>
      <p v-if="archiveError" class="text-sm text-danger">{{ archiveError }}</p>
    </ConfirmModal>
  </div>
</template>
