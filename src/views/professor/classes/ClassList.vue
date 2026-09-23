<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useRouter } from "vue-router";
import type { Class } from "@/types";
import { mockApi, isApiError } from "@/mock/mockApi";
import StatusBadge from "@/components/StatusBadge.vue";
import LoadingState from "@/components/LoadingState.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import Breadcrumb from "@/components/Breadcrumb.vue";
import { statusLabel } from "@/shared/utils";

const router = useRouter();
const classes = ref<Class[]>([]);
const allClasses = ref<Class[]>([]);
const loading = ref(true);
const error = ref("");
const filterName = ref("");
const filterSubject = ref("");
const filterStatus = ref("");
const filterTerm = ref("");
const showArchiveModal = ref(false);
const classToArchive = ref<string | null>(null);
const archiveError = ref("");

const termOptions = computed(() => [...new Set(allClasses.value.map((c) => c.term))].sort());

async function loadTerms() {
  allClasses.value = await mockApi.listClasses();
}

async function load() {
  error.value = "";
  loading.value = true;
  try {
    classes.value = await mockApi.listClasses({
      status: filterStatus.value || undefined,
      name: filterName.value || undefined,
      subject: filterSubject.value || undefined,
      term: filterTerm.value || undefined,
    });
  } catch (e) {
    error.value = isApiError(e) ? e.message : "Erro";
  } finally {
    loading.value = false;
  }
}

function requestArchive(id: string) {
  classToArchive.value = id;
  showArchiveModal.value = true;
}

async function confirmArchive() {
  if (!classToArchive.value) return;
  try {
    await mockApi.archiveClass(classToArchive.value);
    showArchiveModal.value = false;
    classToArchive.value = null;
    archiveError.value = "";
    await loadTerms();
    load();
  } catch (e) {
    archiveError.value = isApiError(e) ? e.message : "Erro ao arquivar";
  }
}

function cancelArchive() {
  classToArchive.value = null;
  archiveError.value = "";
}

watch([filterStatus, filterTerm], load);
watchDebounced([filterName, filterSubject], load, { debounce: 400 });
onMounted(async () => {
  await loadTerms();
  load();
});
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <Breadcrumb :items="[{ label: 'Turmas' }]" />
      <RouterLink
        to="/professor/classes/new"
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white no-underline hover:bg-primary-light"
      >
        Nova turma
      </RouterLink>
    </div>

    <div class="mb-4 flex flex-wrap items-center justify-end gap-3">
      <div class="relative">
        <select
          v-model="filterStatus"
          class="w-full appearance-none rounded-lg border border-border bg-white bg-none py-1 pl-3 pr-10"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativa</option>
          <option value="archived">Arquivada</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
          <Icon name="ph:caret-down" class="size-4" />
        </div>
      </div>
      <div class="relative">
        <select
          v-model="filterTerm"
          class="w-full appearance-none rounded-lg border border-border bg-white bg-none py-1 pl-3 pr-10"
        >
          <option value="">Todos os períodos</option>
          <option v-for="term in termOptions" :key="term" :value="term">{{ term }}</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
          <Icon name="ph:caret-down" class="size-4" />
        </div>
      </div>
      <input
        v-model="filterName"
        placeholder="Buscar nome"
        class="rounded-lg border border-border bg-white px-3 py-1"
      />
      <input
        v-model="filterSubject"
        placeholder="Buscar disciplina"
        class="rounded-lg border border-border bg-white px-3 py-1"
      />
    </div>

    <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <LoadingState
        v-if="loading && !classes.length"
        :loading="loading && !classes.length"
        :message="error || (classes.length ? '' : 'Nenhuma turma encontrada')"
      />
      <table v-else class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border [&>th]:pb-2.5">
            <th class="text-left text-xs font-semibold uppercase tracking-wide text-muted">Nome</th>
            <th class="text-left text-xs font-semibold uppercase tracking-wide text-muted">Disciplina</th>
            <th class="text-left text-xs font-semibold uppercase tracking-wide text-muted">Período</th>
            <th class="text-left text-xs font-semibold uppercase tracking-wide text-muted">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="c in classes"
            :key="c.id"
            class="hover:bg-page cursor-pointer transition-all duration-200"
            @click="router.push(`/professor/classes/${c.id}`)"
          >
            <td class="py-2.5 ps-2">{{ c.name }}</td>
            <td class="py-2.5">{{ c.subject }}</td>
            <td class="py-2.5">{{ c.term }}</td>
            <td class="py-2.5">
              <StatusBadge :status="c.status">{{ statusLabel(c.status) }}</StatusBadge>
            </td>
            <td class="py-2.5 text-right pe-2">
              <div class="inline-flex items-center justify-end">
                <DropdownMenu>
                  <template #default="{ close }">
                    <button
                      type="button"
                      role="menuitem"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-page"
                      @click="
                        close();
                        router.push(`/professor/classes/${c.id}`);
                      "
                    >
                      <Icon name="ph:gear" class="size-4" />
                      Gerenciar
                    </button>
                    <button
                      v-if="c.status === 'active'"
                      type="button"
                      role="menuitem"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-page"
                      @click.stop="
                        close();
                        requestArchive(c.id);
                      "
                    >
                      <Icon name="ph:archive" class="size-4" />
                      Arquivar
                    </button>
                  </template>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmModal
      v-model="showArchiveModal"
      title="Arquivar turma"
      confirm-label="Arquivar"
      @cancel="cancelArchive"
      @confirm="confirmArchive"
    >
      <p>Deseja arquivar esta turma? Ela deixará de aparecer na listagem ativa.</p>
      <p v-if="archiveError" class="text-sm text-danger">{{ archiveError }}</p>
    </ConfirmModal>
  </div>
</template>
