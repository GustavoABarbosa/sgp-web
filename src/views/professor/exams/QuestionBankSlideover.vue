<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Question } from "@/types";
import { plainTextFromMarkdown } from "@/shared/utils";
import Slideover from "@/components/Slideover.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";

const props = defineProps<{
  questions: Question[];
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

const isFull = computed(() => props.selectedIds.length >= props.max);
const availableTags = computed(() =>
  [...new Set(props.questions.flatMap((q) => q.tags))].sort((a, b) => a.localeCompare(b)),
);
const QUICK_TAG_COUNT = 5;
const showAllTags = ref(false);
const visibleTags = computed(() => {
  if (showAllTags.value) return availableTags.value;
  const tags = availableTags.value.slice(0, QUICK_TAG_COUNT);
  return [...filterTags.value.filter((tag) => !tags.includes(tag)), ...tags];
});
const activeFilterCount = computed(
  () => Number(!!filterType.value) + filterTags.value.length + Number(hideSelected.value),
);

const filteredQuestions = computed(() => {
  const searchValue = search.value.trim().toLowerCase();
  return props.questions.filter(
    (question) =>
      !(hideSelected.value && isSelected(question.id)) &&
      (!filterType.value || question.type === filterType.value) &&
      (!filterTags.value.length || filterTags.value.some((tag) => question.tags.includes(tag))) &&
      (!searchValue ||
        plainTextFromMarkdown(question.statement).toLowerCase().includes(searchValue) ||
        question.tags.some((tag) => tag.toLowerCase().includes(searchValue))),
  );
});

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

watch(open, (value) => {
  if (value) return;
  search.value = "";
  showAllTags.value = false;
  clearFilters();
});
</script>

<template>
  <Slideover v-model="open" title="Banco de questões">
    <template #header>
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
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
        </div>
        <DropdownMenu>
          <template #trigger="{ open: menuOpen, toggle }">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-text hover:bg-page"
              :aria-expanded="menuOpen"
              aria-haspopup="menu"
              @click.stop="toggle"
            >
              <Icon name="ph:funnel" class="size-4" />
              Filtros
              <span
                v-if="activeFilterCount"
                class="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-white"
              >
                {{ activeFilterCount }}
              </span>
            </button>
          </template>
          <div class="w-64 space-y-3 px-3 py-2">
            <label class="block text-sm">
              <span class="mb-1 block font-medium">Tipo</span>
              <div class="relative">
                <select
                  v-model="filterType"
                  class="w-full appearance-none bg-none rounded-lg border border-border bg-white py-1.5 pl-3 pr-10"
                >
                  <option value="">Todos os tipos</option>
                  <option value="objetiva">Objetiva</option>
                  <option value="discursiva">Discursiva</option>
                </select>
                <Icon
                  name="ph:caret-down"
                  class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                />
              </div>
            </label>
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
                class="relative h-5 w-9 shrink-0 rounded-full bg-border transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40"
              />
            </label>
            <button
              type="button"
              class="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text hover:bg-page disabled:cursor-not-allowed disabled:opacity-55"
              :disabled="!activeFilterCount"
              @click="clearFilters"
            >
              Limpar filtros
            </button>
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
          :title="showAllTags ? 'Mostrar menos tags' : 'Mostrar todas as tags'"
          @click="showAllTags = !showAllTags"
        >
          <Icon :name="showAllTags ? 'ph:minus' : 'ph:plus'" class="size-3.5" />
        </button>
      </div>
    </template>

    <ul v-if="filteredQuestions.length" class="space-y-1">
      <li
        v-for="q in filteredQuestions"
        :key="q.id"
        class="flex items-start gap-3 p-3 border border-border rounded-lg transition-colors duration-200"
        :class="[ isSelected(q.id) ? 'opacity-60': 'hover:bg-page cursor-pointer' ]"
        @click="isSelected(q.id) ? null : emit('add', q)"
      >
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm text-text" :title="plainTextFromMarkdown(q.statement)">
            {{ plainTextFromMarkdown(q.statement) }}
          </p>
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <span class="inline-flex items-center gap-1 capitalize">
              <Icon :name="q.type === 'objetiva' ? 'ph:check-circle' : 'ph:pencil-simple-line'" class="size-4" />
              {{ q.type }}
            </span>
            <span
              v-for="tag in q.tags"
              :key="tag"
              class="rounded-lg border border-border bg-page px-2 py-0.5 font-medium capitalize text-text"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        <button
          v-if="isSelected(q.id)"
          type="button"
          disabled
          class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-page px-2.5 py-1 text-xs font-medium text-muted cursor-default!"
        >
          <Icon name="ph:check" class="size-3.5" />
        </button>
        <button
          v-else
          type="button"
          :disabled="isFull"
          class="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55"
          @click="emit('add', q)"
        >
          <Icon name="ph:plus-bold" class="size-3.5" />
        </button>
      </li>
    </ul>
    <p v-else class="text-sm text-muted">Nenhuma questão encontrada</p>

    <template #footer="{ close }">
      <span class="mr-auto text-sm" :class="isFull ? 'text-warning' : 'text-muted'">
        {{ selectedIds.length }}/{{ max }} selecionadas{{ isFull ? " — limite atingido" : "" }}
      </span>
      <button
        type="button"
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        @click="close"
      >
        Concluir
      </button>
    </template>
  </Slideover>
</template>
