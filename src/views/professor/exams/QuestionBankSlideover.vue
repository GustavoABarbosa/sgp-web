<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import type { Question } from "@/types";
import { questionsApi } from "@/api/questions";
import { errorMessage } from "@/shared/api/client";
import { plainTextFromMarkdown } from "@/shared/markdown";
import BaseButton from "@/components/BaseButton.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import QuestionTypeLabel from "@/components/QuestionTypeLabel.vue";
import SelectField from "@/components/SelectField.vue";
import Slideover from "@/components/Slideover.vue";
import TagList from "@/components/TagList.vue";

const PAGE_SIZE = 20;
const QUICK_TAG_COUNT = 5;

const props = defineProps<{
  selectedIds: string[];
  max: number;
}>();

const emit = defineEmits<{
  add: [question: Question];
}>();

const open = defineModel<boolean>({ required: true });
const search = ref("");
const filterType = ref<"" | Question["type"]>("");
const filterTags = ref<string[]>([]);
const hideSelected = ref(false);
const showAllTags = ref(false);

const availableTags = ref<string[]>([]);
const questions = ref<Question[]>([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const error = ref("");
let requestId = 0;

const isFull = computed(() => props.selectedIds.length >= props.max);
const hasMore = computed(() => questions.value.length < total.value);
const visibleTags = computed(() => {
  if (showAllTags.value) return availableTags.value;
  const tags = availableTags.value.slice(0, QUICK_TAG_COUNT);
  return [...filterTags.value.filter((tag) => !tags.includes(tag)), ...tags];
});
const activeFilterCount = computed(
  () => Number(!!filterType.value) + filterTags.value.length + Number(hideSelected.value),
);
const visibleQuestions = computed(() =>
  hideSelected.value ? questions.value.filter((q) => !isSelected(q.id)) : questions.value,
);

async function fetchPage(next: number) {
  const id = ++requestId;
  loading.value = true;
  error.value = "";
  try {
    const result = await questionsApi.list({
      search: search.value.trim(),
      type: filterType.value,
      tags: filterTags.value,
      page: next,
      limit: PAGE_SIZE,
    });
    if (id !== requestId) return;
    questions.value = next === 1 ? result.data : [...questions.value, ...result.data];
    total.value = result.total;
    page.value = next;
  } catch (e) {
    if (id === requestId) error.value = errorMessage(e, "Erro ao carregar questões");
  } finally {
    if (id === requestId) loading.value = false;
  }
}

async function loadTags() {
  availableTags.value = await questionsApi.tags().catch(() => []);
}

function isSelected(id: string) {
  return props.selectedIds.includes(id);
}

function isTagActive(tag: string) {
  return filterTags.value.includes(tag);
}

function toggleTag(tag: string) {
  filterTags.value = isTagActive(tag) ? filterTags.value.filter((t) => t !== tag) : [...filterTags.value, tag];
}

function clearFilters() {
  filterType.value = "";
  filterTags.value = [];
  hideSelected.value = false;
}

function add(question: Question) {
  if (!isSelected(question.id) && !isFull.value) emit("add", question);
}

watch(open, (value) => {
  if (value) {
    loadTags();
    fetchPage(1);
    return;
  }
  search.value = "";
  showAllTags.value = false;
  clearFilters();
});
watch([filterType, filterTags], () => open.value && fetchPage(1));
watchDebounced(search, () => open.value && fetchPage(1), { debounce: 300 });
</script>

<template>
  <Slideover v-model="open" title="Banco de questões">
    <template #header>
      <div class="flex items-center gap-2">
        <label class="relative flex-1">
          <span class="sr-only">Buscar por enunciado ou tag</span>
          <Icon
            name="ph:magnifying-glass"
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            v-model="search"
            type="search"
            placeholder="Buscar por enunciado ou tag"
            class="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3"
          />
        </label>
        <DropdownMenu label="Filtros" panel>
          <template #trigger="{ triggerAttrs }">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text hover:bg-page"
              v-bind="triggerAttrs"
            >
              <Icon name="ph:funnel" class="size-4" />
              Filtros
              <span
                v-if="activeFilterCount"
                class="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-white"
              >
                {{ activeFilterCount }}
                <span class="sr-only">ativos</span>
              </span>
            </button>
          </template>
          <div class="w-64 space-y-3 px-3 py-2">
            <SelectField v-model="filterType" label="Tipo" class="py-1.5!">
              <option value="">Todos os tipos</option>
              <option value="objetiva">Objetiva</option>
              <option value="discursiva">Discursiva</option>
            </SelectField>
            <fieldset class="text-sm">
              <legend class="mb-1 font-medium">Tags</legend>
              <div class="max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-border bg-white p-1">
                <label
                  v-for="tag in availableTags"
                  :key="tag"
                  class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 capitalize hover:bg-page"
                >
                  <input v-model="filterTags" type="checkbox" :value="tag" class="accent-primary" />
                  {{ tag }}
                </label>
                <p v-if="!availableTags.length" class="px-2 py-1 text-muted">Nenhuma tag</p>
              </div>
            </fieldset>
            <label class="flex cursor-pointer items-center justify-between gap-3 text-sm">
              <span class="font-medium">Ocultar selecionadas</span>
              <input v-model="hideSelected" type="checkbox" role="switch" class="peer sr-only" />
              <span
                aria-hidden="true"
                class="relative h-5 w-9 shrink-0 rounded-full bg-border transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40"
              />
            </label>
            <BaseButton variant="secondary" block :disabled="!activeFilterCount" @click="clearFilters">
              Limpar filtros
            </BaseButton>
          </div>
        </DropdownMenu>
      </div>
      <div v-if="availableTags.length" class="mt-3 flex items-start gap-1.5">
        <div class="flex min-w-0 flex-1 gap-1.5" :class="showAllTags ? 'flex-wrap' : 'overflow-hidden'">
          <button
            v-for="tag in visibleTags"
            :key="tag"
            type="button"
            class="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium capitalize"
            :class="
              isTagActive(tag)
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-page text-text hover:border-neutral-400'
            "
            :aria-pressed="isTagActive(tag)"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
        <button
          v-if="availableTags.length > QUICK_TAG_COUNT"
          type="button"
          class="inline-flex shrink-0 items-center rounded-lg border border-border bg-white p-1.5 text-text hover:bg-page"
          :aria-label="showAllTags ? 'Mostrar menos tags' : 'Mostrar todas as tags'"
          :title="showAllTags ? 'Mostrar menos tags' : 'Mostrar todas as tags'"
          :aria-expanded="showAllTags"
          @click="showAllTags = !showAllTags"
        >
          <Icon :name="showAllTags ? 'ph:minus' : 'ph:plus'" class="size-3.5" />
        </button>
      </div>
    </template>

    <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
    <ul v-if="visibleQuestions.length" class="space-y-1">
      <li
        v-for="q in visibleQuestions"
        :key="q.id"
        class="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors duration-200"
        :class="[isSelected(q.id) ? 'opacity-60' : 'cursor-pointer hover:bg-page']"
        @click="add(q)"
      >
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm text-text" :title="plainTextFromMarkdown(q.statement)">
            {{ plainTextFromMarkdown(q.statement) }}
          </p>
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <QuestionTypeLabel :type="q.type" />
            <TagList :tags="q.tags" />
          </div>
        </div>
        <span
          v-if="isSelected(q.id)"
          class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-page px-2.5 py-1 text-xs font-medium text-muted"
        >
          <Icon name="ph:check" class="size-3.5" />
          <span class="sr-only">Selecionada</span>
        </span>
        <button
          v-else
          type="button"
          :disabled="isFull"
          class="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
          :aria-label="`Adicionar questão: ${plainTextFromMarkdown(q.statement).slice(0, 80)}`"
          @click.stop="add(q)"
        >
          <Icon name="ph:plus-bold" class="size-3.5" />
        </button>
      </li>
    </ul>
    <p v-else-if="!loading && !error" class="text-sm text-muted">Nenhuma questão encontrada</p>
    <p v-if="loading" class="py-4 text-center text-sm text-muted">Carregando...</p>
    <div v-else-if="hasMore" class="mt-3 flex justify-center">
      <BaseButton variant="secondary" size="sm" @click="fetchPage(page + 1)">Carregar mais</BaseButton>
    </div>

    <template #footer="{ close }">
      <span class="mr-auto text-sm" :class="isFull ? 'text-warning' : 'text-muted'" aria-live="polite">
        {{ selectedIds.length }}/{{ max }} selecionadas{{ isFull ? " — limite atingido" : "" }}
      </span>
      <BaseButton @click="close">Concluir</BaseButton>
    </template>
  </Slideover>
</template>
