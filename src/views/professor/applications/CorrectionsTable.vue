<script setup lang="ts">
import { computed } from "vue";
import type { Correction, User } from "@/types";
import { formatDateTime } from "@/shared/utils";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import StatusBadge from "@/components/StatusBadge.vue";

const props = defineProps<{
  corrections: Correction[];
  students: User[];
}>();

const emit = defineEmits<{ assign: [correction: Correction] }>();

const pending = computed(() => props.corrections.filter((c) => !c.studentId));
const studentNames = computed(() => new Map(props.students.map((s) => [s.id, s.fullName])));

const pendingColumns: Column[] = [
  { key: "totalScore", label: "Nota" },
  { key: "reportedStudentName", label: "Nome informado" },
  { key: "reportedStudentRegistration", label: "Matrícula" },
  { key: "confirmedAt", label: "Data" },
  { key: "actions", label: "Ações", hideLabel: true },
];

const allColumns: Column[] = [
  { key: "student", label: "Aluno" },
  { key: "totalScore", label: "Nota" },
  { key: "assignment", label: "Atribuição" },
  { key: "syncStatus", label: "Sincronização" },
];

function studentLabel(c: Correction) {
  if (c.studentId) return studentNames.value.get(c.studentId) ?? "Aluno removido";
  return c.reportedStudentName ?? "Pendente";
}
</script>

<template>
  <BaseCard title="Correções pendentes de atribuição" class="mt-4">
    <DataTable
      :columns="pendingColumns"
      :rows="pending"
      :row-key="(c: Correction) => c.id"
      empty="Nenhuma correção pendente"
    >
      <template #cell-reportedStudentName="{ row }">{{ row.reportedStudentName ?? "—" }}</template>
      <template #cell-reportedStudentRegistration="{ row }">{{ row.reportedStudentRegistration ?? "—" }}</template>
      <template #cell-confirmedAt="{ row }">{{ formatDateTime(row.confirmedAt) }}</template>
      <template #cell-actions="{ row }">
        <BaseButton size="sm" @click="emit('assign', row)">Atribuir aluno</BaseButton>
      </template>
    </DataTable>
  </BaseCard>

  <BaseCard v-if="corrections.length" title="Todas as correções" class="mt-4">
    <DataTable :columns="allColumns" :rows="corrections" :row-key="(c: Correction) => c.id">
      <template #cell-student="{ row }">{{ studentLabel(row) }}</template>
      <template #cell-assignment="{ row }">{{ row.isAutomaticallyAssigned ? "Automática" : "Manual" }}</template>
      <template #cell-syncStatus="{ row }">
        <StatusBadge :status="row.syncStatus" />
      </template>
    </DataTable>
  </BaseCard>
</template>
