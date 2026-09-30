<script setup lang="ts">
import { ref, watch } from "vue";
import type { Exam } from "@/types";
import { examsApi } from "@/api/exams";
import { useToastStore } from "@/stores/toast";
import { errorMessage } from "@/shared/api/client";
import { useConfirm } from "@/shared/useConfirm";
import { useResource } from "@/shared/useResource";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import LoadingState from "@/components/LoadingState.vue";
import PageHeader from "@/components/PageHeader.vue";
import SelectField from "@/components/SelectField.vue";
import StatusBadge from "@/components/StatusBadge.vue";

const toast = useToastStore();
const confirm = useConfirm();
const statusFilter = ref<"" | Exam["status"]>("");

const { data: exams, isLoading, error, reload } = useResource(
  () => examsApi.list(statusFilter.value || undefined),
  "Erro ao carregar provas",
);

const columns: Column[] = [
  { key: "title", label: "Título" },
  { key: "questions", label: "Questões", align: "center" },
  { key: "status", label: "Status", align: "center" },
  { key: "actions", label: "Ações", hideLabel: true, align: "right" },
];

async function requestArchive(exam: Exam) {
  const ok = await confirm({
    title: "Arquivar prova",
    message: "Deseja arquivar esta prova? Ela não poderá mais ser editada.",
    confirmLabel: "Arquivar",
  });
  if (!ok) return;
  try {
    await examsApi.archive(exam.id);
    toast.success("Prova arquivada.");
    reload();
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao arquivar"));
  }
}

watch(statusFilter, reload);
</script>

<template>
  <div>
    <PageHeader :items="[{ label: 'Provas' }]">
      <BaseButton to="/professor/exams/new" icon="ph:plus-bold">Nova prova</BaseButton>
    </PageHeader>

    <div class="mb-4 flex flex-wrap gap-3">
      <SelectField v-model="statusFilter" label="Status" hide-label size="md">
        <option value="">Todos</option>
        <option value="draft">Rascunho</option>
        <option value="ready">Pronta</option>
        <option value="closed">Arquivada</option>
      </SelectField>
    </div>

    <LoadingState :loading="isLoading && !exams" :message="error" />

    <BaseCard v-if="exams && !error">
      <DataTable :columns="columns" :rows="exams" :row-key="(e: Exam) => e.id" empty="Nenhuma prova">
        <template #cell-questions="{ row }">{{ row.questions.length }}</template>
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" />
        </template>
        <template #cell-actions="{ row }">
          <div v-if="row.status !== 'closed'" class="flex justify-end gap-2">
            <BaseButton variant="secondary" size="sm" :to="`/professor/exams/${row.id}/edit`">
              Editar<span class="sr-only"> {{ row.title }}</span>
            </BaseButton>
            <BaseButton variant="danger" size="sm" @click="requestArchive(row)">
              Arquivar<span class="sr-only"> {{ row.title }}</span>
            </BaseButton>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
