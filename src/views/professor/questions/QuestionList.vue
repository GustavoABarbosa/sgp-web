<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useRouter } from "vue-router";
import type { Question } from "@/types";
import { questionsApi } from "@/api/questions";
import { useToastStore } from "@/stores/toast";
import { errorMessage } from "@/shared/api/client";
import { useConfirm } from "@/shared/useConfirm";
import { useResource } from "@/shared/useResource";
import { plainTextFromMarkdown } from "@/shared/markdown";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import LoadingState from "@/components/LoadingState.vue";
import MenuItem from "@/components/MenuItem.vue";
import PageHeader from "@/components/PageHeader.vue";
import PaginationBar from "@/components/PaginationBar.vue";
import QuestionTypeLabel from "@/components/QuestionTypeLabel.vue";
import SelectField from "@/components/SelectField.vue";
import TagList from "@/components/TagList.vue";
import TextFilter from "@/components/TextFilter.vue";
import QuestionViewModal from "./QuestionViewModal.vue";

const PAGE_SIZE = 10;

const router = useRouter();
const toast = useToastStore();
const confirm = useConfirm();
const filterType = ref<"" | Question["type"]>("");
const filterSearch = ref("");
const filterTag = ref("");
const page = ref(1);
const viewing = ref<Question | null>(null);
const showViewModal = ref(false);

const { data, isLoading, error, reload } = useResource(() =>
  questionsApi.list({
    type: filterType.value,
    search: filterSearch.value,
    tag: filterTag.value,
    page: page.value,
    limit: PAGE_SIZE,
  }),
);
const questions = computed(() => data.value?.data ?? []);

const columns: Column[] = [
  { key: "statement", label: "Enunciado", class: "max-w-md min-w-0" },
  { key: "type", label: "Tipo", align: "center" },
  { key: "tags", label: "Tags" },
  { key: "actions", label: "Ações", hideLabel: true, align: "right" },
];

function resetPageAndReload() {
  if (page.value === 1) reload();
  else page.value = 1;
}

function viewQuestion(question: Question) {
  viewing.value = question;
  showViewModal.value = true;
}

function editQuestion(id: string) {
  showViewModal.value = false;
  router.push(`/professor/questions/${id}/edit`);
}

async function requestDelete(id: string) {
  showViewModal.value = false;
  const ok = await confirm({
    title: "Excluir questão",
    message: "Esta ação não pode ser desfeita. Deseja excluir esta questão?",
    confirmLabel: "Excluir",
  });
  if (!ok) return;
  try {
    await questionsApi.remove(id);
    toast.success("Questão excluída.");
    if (questions.value.length === 1 && page.value > 1) page.value--;
    else reload();
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao excluir"));
  }
}

watch(filterType, resetPageAndReload);
watch(page, reload);
watchDebounced([filterSearch, filterTag], resetPageAndReload, { debounce: 400 });
watch(showViewModal, (open) => {
  if (!open) viewing.value = null;
});
</script>

<template>
  <div>
    <PageHeader :items="[{ label: 'Questões' }]">
      <BaseButton to="/professor/questions/new" icon="ph:plus-bold">Nova questão</BaseButton>
    </PageHeader>

    <div class="mb-4 flex flex-wrap items-center justify-end gap-3">
      <SelectField v-model="filterType" label="Tipo" hide-label>
        <option value="">Todos os tipos</option>
        <option value="objetiva">Objetiva</option>
        <option value="discursiva">Discursiva</option>
      </SelectField>
      <TextFilter v-model="filterSearch" label="Buscar enunciado" />
      <TextFilter v-model="filterTag" label="Filtrar tag" />
    </div>

    <LoadingState :loading="isLoading && !data" :message="error" />

    <BaseCard v-if="data">
      <DataTable
        :columns="columns"
        :rows="questions"
        :row-key="(q: Question) => q.id"
        clickable
        empty="Nenhuma questão encontrada"
        @row-click="viewQuestion"
      >
        <template #cell-statement="{ row }">
          <button
            type="button"
            class="block w-full min-w-0 truncate text-left"
            :title="plainTextFromMarkdown(row.statement)"
            @click="viewQuestion(row)"
          >
            {{ plainTextFromMarkdown(row.statement) }}
          </button>
        </template>
        <template #cell-type="{ row }">
          <QuestionTypeLabel :type="row.type" class="justify-center" />
        </template>
        <template #cell-tags="{ row }">
          <TagList :tags="row.tags" :max="3" class="max-w-48" />
        </template>
        <template #cell-actions="{ row }">
          <div class="inline-flex items-center justify-end">
            <DropdownMenu :label="`Ações da questão`">
              <MenuItem icon="ph:eye" @select="viewQuestion(row)">Visualizar</MenuItem>
              <MenuItem icon="ph:pencil-simple" @select="editQuestion(row.id)">Editar</MenuItem>
              <MenuItem icon="ph:trash" danger @select="requestDelete(row.id)">Excluir</MenuItem>
            </DropdownMenu>
          </div>
        </template>
      </DataTable>
      <PaginationBar v-model="page" :total="data.total" :limit="PAGE_SIZE" />
    </BaseCard>

    <QuestionViewModal v-model="showViewModal" :question="viewing">
      <template #actions="{ question: viewed }">
        <DropdownMenu>
          <MenuItem icon="ph:pencil-simple" @select="editQuestion(viewed.id)">Editar</MenuItem>
          <MenuItem icon="ph:trash" danger @select="requestDelete(viewed.id)">Excluir</MenuItem>
        </DropdownMenu>
      </template>
    </QuestionViewModal>
  </div>
</template>
