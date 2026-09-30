<script setup lang="ts">
import type { ApplicationSummary } from "@/types";
import { applicationsApi } from "@/api/applications";
import { useResource } from "@/shared/useResource";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import LoadingState from "@/components/LoadingState.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";

const { data: applications, isLoading, error } = useResource(
  () => applicationsApi.list(),
  "Erro ao carregar aplicações",
);

const columns: Column[] = [
  { key: "examTitle", label: "Prova" },
  { key: "className", label: "Turma" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Ações", hideLabel: true },
];
</script>

<template>
  <div>
    <PageHeader :items="[{ label: 'Aplicações' }]">
      <BaseButton to="/professor/applications/new" icon="ph:plus-bold">Nova aplicação</BaseButton>
    </PageHeader>

    <LoadingState :loading="isLoading && !applications" :message="error" />

    <BaseCard v-if="applications && !error">
      <DataTable
        :columns="columns"
        :rows="applications"
        :row-key="(a: ApplicationSummary) => a.id"
        empty="Nenhuma aplicação"
      >
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" />
        </template>
        <template #cell-actions="{ row }">
          <BaseButton variant="secondary" size="sm" :to="`/professor/applications/${row.id}`">
            Detalhes<span class="sr-only"> de {{ row.examTitle }} — {{ row.className }}</span>
          </BaseButton>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
