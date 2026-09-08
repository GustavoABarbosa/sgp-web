<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useRouter } from "vue-router";
import type { Question } from "@/types";
import { mockApi, isApiError } from "@/mock/mockApi";
import { plainTextFromMarkdown, renderMarkdown } from "@/shared/utils";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import LoadingState from "@/components/LoadingState.vue";
import Modal from "@/components/Modal.vue";

const router = useRouter();
const questions = ref<Question[]>([]);
const loading = ref(true);
const error = ref("");
const filterType = ref("");
const filterSearch = ref("");
const filterTag = ref("");
const showDeleteModal = ref(false);
const questionToDelete = ref<string | null>(null);
const deleteError = ref("");
const viewing = ref<Question | null>(null);
const showViewModal = ref(false);

async function load() {
  error.value = "";
  try {
    const res = await mockApi.listQuestions({
      type: filterType.value || undefined,
      search: filterSearch.value || undefined,
      tag: filterTag.value || undefined,
    });
    questions.value = res.data;
  } catch (e) {
    error.value = isApiError(e) ? e.message : "Erro";
  } finally {
    loading.value = false;
  }
}

function viewQuestion(question: Question) {
  viewing.value = question;
  showViewModal.value = true;
}

function requestDelete(id: string) {
  questionToDelete.value = id;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!questionToDelete.value) return;
  try {
    await mockApi.deleteQuestion(questionToDelete.value);
    showDeleteModal.value = false;
    questionToDelete.value = null;
    load();
  } catch (e) {
    deleteError.value = isApiError(e) ? e.message : "Erro ao excluir";
  }
}

function cancelDelete() {
  questionToDelete.value = null;
  deleteError.value = "";
}

watch(filterType, load);
watchDebounced([filterSearch, filterTag], load, { debounce: 400 });
watch(showViewModal, (open) => {
  if (!open) viewing.value = null;
});
onMounted(load);
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Questões</h1>
      <RouterLink
        to="/professor/questions/new"
        class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white no-underline hover:bg-primary-light"
      >
        Nova questão
      </RouterLink>
    </div>

    <div class="mb-4 flex items-center flex-wrap justify-end gap-3">
      <div class="relative">
        <select
          v-model="filterType"
          class="w-full appearance-none bg-none rounded-lg border border-border bg-white py-1 pl-3 pr-10"
        >
          <option value="">Todos os tipos</option>
          <option value="objetiva">Objetiva</option>
          <option value="discursiva">Discursiva</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
          <Icon name="ph:caret-down" class="size-4" />
        </div>
      </div>
      <input
        v-model="filterSearch"
        placeholder="Buscar enunciado"
        class="rounded-lg border border-border bg-white px-3 py-1"
      />
      <input v-model="filterTag" placeholder="Filtrar tag" class="rounded-lg border border-border bg-white px-3 py-1" />
    </div>

    <LoadingState :loading="loading" :message="error || (questions.length ? '' : 'Nenhuma questão encontrada')" />

    <div v-if="!loading && questions.length" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border [&>th]:pb-2.5">
            <th class="text-left text-xs font-semibold uppercase tracking-wide text-muted">Enunciado</th>
            <th class="text-center text-xs font-semibold uppercase tracking-wide text-muted pe-4">Tipo</th>
            <th class="text-left text-xs font-semibold uppercase tracking-wide text-muted">Tags</th>
            <th></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="q in questions" :key="q.id">
            <td class="max-w-md min-w-0 align-middle py-2.5">
              <p class="min-w-0 truncate" :title="plainTextFromMarkdown(q.statement)">
                {{ plainTextFromMarkdown(q.statement) }}
              </p>
            </td>
            <td class="align-middle py-2.5 pe-4">
              <span class="flex items-center justify-center gap-1 capitalize">
                <Icon :name="q.type === 'objetiva' ? 'ph:check-circle' : 'ph:pencil-simple-line'" class="size-4" />
                {{ q.type }}
              </span>
            </td>
            <td class="align-middle py-2.5">
              <div class="flex max-w-48 flex-wrap items-center gap-1.5">
                <div
                  v-for="tag in q.tags.slice(0, 3)"
                  :key="tag"
                  class="rounded-lg border border-border bg-page px-2.5 py-1 text-xs font-medium capitalize text-text"
                >
                  {{ tag }}
                </div>
                <div
                  v-if="q.tags.length > 3"
                  class="rounded-lg border border-border bg-page px-2.5 py-1 text-xs font-medium capitalize text-text inline-flex items-center gap-0.5"
                >
                  <Icon name="ph:plus-bold" class="size-3" />
                  {{ q.tags.length - 3 }}
                </div>
              </div>
            </td>
            <td class="align-middle py-2.5 text-right">
              <div class="inline-flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-border p-1.5 text-text hover:bg-page"
                  title="Visualizar"
                  @click="viewQuestion(q)"
                >
                  <Icon name="ph:eye" class="size-5" />
                </button>
                <DropdownMenu>
                  <template #default="{ close }">
                    <button
                      type="button"
                      role="menuitem"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-page"
                      @click="
                        close();
                        viewQuestion(q);
                      "
                    >
                      <Icon name="ph:eye" class="size-4" />
                      Visualizar
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-page"
                      @click="
                        close();
                        router.push(`/professor/questions/${q.id}/edit`);
                      "
                    >
                      <Icon name="ph:pencil-simple" class="size-4" />
                      Editar
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-page"
                      @click="
                        close();
                        requestDelete(q.id);
                      "
                    >
                      <Icon name="ph:trash" class="size-4" />
                      Excluir
                    </button>
                  </template>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal
      v-model="showViewModal"
      title="Visualizar questão"
      size="lg"
    >
      <template v-if="viewing">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <div>
            <h2 class="mb-2">Tipo</h2>
            <span class="inline-flex items-center gap-1.5 capitalize text-sm">
              <Icon
                :name="viewing.type === 'objetiva' ? 'ph:check-circle' : 'ph:pencil-simple-line'"
                class="size-4"
              />
              {{ viewing.type }}
            </span>
          </div>
          <div>
            <h2 class="mb-2">Tags</h2>
            <div class="flex flex-wrap items-center gap-1.5">
              <div
                v-for="tag in viewing.tags"
                :key="tag"
                class="rounded-lg border border-border bg-page px-2.5 py-1 text-xs font-medium capitalize text-text"
              >
                {{ tag }}
              </div>
            </div>
          </div>
        </div>
        <div class="overflow-y-auto max-h-120 border border-border rounded-lg p-4">
          <MarkdownPreview :html="renderMarkdown(viewing.statement)" />
        </div>
      </template>
    </Modal>

    <ConfirmModal
      v-model="showDeleteModal"
      title="Excluir questão"
      confirm-label="Excluir"
      @cancel="cancelDelete"
      @confirm="confirmDelete"
    >
      <p>Esta ação não pode ser desfeita. Deseja excluir esta questão?</p>
      <p v-if="deleteError" class="text-sm text-danger">{{ deleteError }}</p>
    </ConfirmModal>
  </div>
</template>
