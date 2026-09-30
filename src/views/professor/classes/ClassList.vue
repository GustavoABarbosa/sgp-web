<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import type { Class } from "@/types";
import { classesApi } from "@/api/classes";
import { useToastStore } from "@/stores/toast";
import { errorMessage } from "@/shared/api/client";
import { useConfirm } from "@/shared/useConfirm";
import { useResource } from "@/shared/useResource";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import LoadingState from "@/components/LoadingState.vue";
import MenuItem from "@/components/MenuItem.vue";
import PageHeader from "@/components/PageHeader.vue";
import SelectField from "@/components/SelectField.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import TextFilter from "@/components/TextFilter.vue";

const toast = useToastStore();
const confirm = useConfirm();
const filterName = ref("");
const filterSubject = ref("");
const filterStatus = ref<"" | Class["status"]>("");
const filterTerm = ref("");

const { data: allClasses, reload: reloadTerms } = useResource(() => classesApi.list());
const { data: classes, isLoading, error, reload } = useResource(
  () =>
    classesApi.list({
      status: filterStatus.value,
      name: filterName.value,
      subject: filterSubject.value,
      term: filterTerm.value,
    }),
  "Erro ao carregar turmas",
);

const termOptions = computed(() => [...new Set((allClasses.value ?? []).map((c) => c.term))].sort());

const columns: Column[] = [
  { key: "name", label: "Nome" },
  { key: "subject", label: "Disciplina" },
  { key: "term", label: "Período" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Ações", hideLabel: true, align: "right" },
];

async function requestArchive(id: string) {
  const ok = await confirm({
    title: "Arquivar turma",
    message: "Deseja arquivar esta turma? Ela deixará de aparecer na listagem ativa.",
    confirmLabel: "Arquivar",
  });
  if (!ok) return;
  try {
    await classesApi.archive(id);
    toast.success("Turma arquivada.");
    reloadTerms();
    reload();
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao arquivar"));
  }
}

watch([filterStatus, filterTerm], reload);
watchDebounced([filterName, filterSubject], reload, { debounce: 400 });
</script>

<template>
  <div>
    <PageHeader :items="[{ label: 'Turmas' }]">
      <BaseButton to="/professor/classes/new" icon="ph:plus-bold">Nova turma</BaseButton>
    </PageHeader>

    <div class="mb-4 flex flex-wrap items-center justify-end gap-3">
      <SelectField v-model="filterStatus" label="Status" hide-label>
        <option value="">Todos os status</option>
        <option value="active">Ativa</option>
        <option value="archived">Arquivada</option>
      </SelectField>
      <SelectField v-model="filterTerm" label="Período" hide-label>
        <option value="">Todos os períodos</option>
        <option v-for="term in termOptions" :key="term" :value="term">{{ term }}</option>
      </SelectField>
      <TextFilter v-model="filterName" label="Buscar nome" />
      <TextFilter v-model="filterSubject" label="Buscar disciplina" />
    </div>

    <LoadingState :loading="isLoading && !classes" :message="error" />

    <BaseCard v-if="classes && !error">
      <DataTable
        :columns="columns"
        :rows="classes"
        :row-key="(c: Class) => c.id"
        :row-to="(c: Class) => `/professor/classes/${c.id}`"
        empty="Nenhuma turma encontrada"
      >
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" />
        </template>
        <template #cell-actions="{ row }">
          <div class="inline-flex items-center justify-end">
            <DropdownMenu :label="`Ações da turma ${row.name}`">
              <MenuItem icon="ph:gear" :to="`/professor/classes/${row.id}`">Gerenciar</MenuItem>
              <MenuItem v-if="row.status === 'active'" icon="ph:archive" danger @select="requestArchive(row.id)">
                Arquivar
              </MenuItem>
            </DropdownMenu>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
