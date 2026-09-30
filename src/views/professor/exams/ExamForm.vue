<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, toRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { insertNodeAt, removeNode, useSortable } from "@vueuse/integrations/useSortable";
import type { ExamQuestion, Question } from "@/types";
import { examsApi } from "@/api/exams";
import { questionsApi } from "@/api/questions";
import { errorMessage } from "@/shared/api/client";
import { plainTextFromMarkdown } from "@/shared/markdown";
import { examFormSchema, useZodForm } from "@/shared/validation";
import BaseButton from "@/components/BaseButton.vue";
import FormField from "@/components/FormField.vue";
import LoadingState from "@/components/LoadingState.vue";
import PageHeader from "@/components/PageHeader.vue";
import QuestionBankSlideover from "./QuestionBankSlideover.vue";
import QuestionViewModal from "../questions/QuestionViewModal.vue";

const MAX_QUESTIONS = 20;

const route = useRoute();
const router = useRouter();
const examId = route.params.id ? String(route.params.id) : null;

const { fields, validate, errorFor, reset } = useZodForm(examFormSchema, {
  title: "",
  description: "",
  questions: [] as ExamQuestion[],
});
const questionsById = reactive(new Map<string, Question>());
const targetTotal = ref(10);
const loading = ref(!!examId);
const loadError = ref("");
const error = ref("");
const saving = ref(false);
const showQuestionBank = ref(false);
const viewing = ref<Question | null>(null);
const showViewModal = ref(false);
const announcement = ref("");

const selectedIds = computed(() => fields.questions.map((q) => q.questionId));
const totalScore = computed(() => fields.questions.reduce((s, q) => s + q.score, 0));
const scoreWarning = computed(() => Math.abs(totalScore.value - targetTotal.value) > 0.01);

async function load() {
  if (!examId) return;
  try {
    const exam = await examsApi.get(examId);
    const ids = exam.questions.map((q) => q.questionId);
    if (ids.length) {
      const { data } = await questionsApi.list({ ids, limit: MAX_QUESTIONS });
      data.forEach((q) => questionsById.set(q.id, q));
    }
    reset({
      title: exam.title,
      description: exam.description ?? "",
      questions: [...exam.questions].sort((a, b) => a.order - b.order),
    });
  } catch (e) {
    loadError.value = errorMessage(e, "Erro ao carregar prova");
  } finally {
    loading.value = false;
  }
}

function renumber(list: ExamQuestion[]) {
  fields.questions = list.map((q, i) => ({ ...q, order: i + 1 }));
}

function addQuestion(q: Question) {
  if (fields.questions.length >= MAX_QUESTIONS || selectedIds.value.includes(q.id)) return;
  questionsById.set(q.id, q);
  renumber([
    ...fields.questions,
    { questionId: q.id, order: 0, score: q.type === "discursiva" ? (q.maxScore ?? 5) : 2 },
  ]);
}

function removeQuestion(questionId: string) {
  renumber(fields.questions.filter((q) => q.questionId !== questionId));
}

function move(from: number, to: number) {
  if (to < 0 || to >= fields.questions.length) return;
  const list = [...fields.questions];
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved!);
  renumber(list);
}

async function onHandleKeydown(event: KeyboardEvent, index: number) {
  const target = { ArrowUp: index - 1, ArrowDown: index + 1 }[event.key];
  if (target === undefined || target < 0 || target >= fields.questions.length) return;
  event.preventDefault();
  move(index, target);
  announcement.value = `Questão movida para a posição ${target + 1} de ${fields.questions.length}`;
  await nextTick();
  questionListEl.value?.querySelectorAll<HTMLElement>("[data-drag-handle]")[target]?.focus();
}

const questionListEl = ref<HTMLElement | null>(null);

useSortable(questionListEl, toRef(fields, "questions"), {
  watchElement: true,
  handle: "[data-drag-handle]",
  animation: 150,
  ghostClass: "opacity-40",
  onUpdate(e) {
    const { oldIndex, newIndex } = e;
    if (oldIndex === undefined || newIndex === undefined) return;
    // Sortable already moved the node; restore it so Vue stays the owner of the DOM order.
    removeNode(e.item);
    insertNodeAt(e.from, e.item, oldIndex);
    move(oldIndex, newIndex);
  },
});

function viewQuestion(id: string) {
  viewing.value = questionsById.get(id) ?? null;
  showViewModal.value = !!viewing.value;
}

function questionLabel(id: string) {
  const q = questionsById.get(id);
  return q ? plainTextFromMarkdown(q.statement) : "Questão indisponível";
}

async function submit() {
  error.value = "";
  const data = validate();
  if (!data) {
    error.value = errorFor("questions");
    return;
  }

  saving.value = true;
  try {
    if (examId) await examsApi.update(examId, data);
    else await examsApi.create(data);
    router.push("/professor/exams");
  } catch (e) {
    error.value = errorMessage(e, "Erro ao salvar prova");
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <PageHeader
      :items="[{ label: 'Provas', to: '/professor/exams' }, { label: examId ? 'Editar prova' : 'Nova prova' }]"
    />

    <LoadingState :loading="loading" :message="loadError" />

    <form
      v-if="!loading && !loadError"
      class="rounded-lg border border-border bg-surface p-5 shadow-sm"
      novalidate
      @submit.prevent="submit"
    >
      <FormField v-model="fields.title" label="Título" :error="errorFor('title')" />
      <FormField v-model="fields.description" as="textarea" label="Descrição" rows="2" />

      <div
        class="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-page p-3 text-sm"
        :class="scoreWarning ? 'border border-warning text-warning' : ''"
      >
        <span>Total: <strong>{{ totalScore.toFixed(1) }}</strong> pts</span>
        <label>
          Meta desejada:
          <input
            v-model.number="targetTotal"
            type="number"
            step="0.5"
            class="w-20 rounded-lg border border-border bg-white px-2 py-1"
          />
          pts
        </label>
        <span v-if="scoreWarning" role="status">A soma não coincide com a meta (responsabilidade do professor)</span>
      </div>

      <div class="mb-3 flex items-center justify-between gap-4">
        <h2 class="mb-0">Questões selecionadas ({{ fields.questions.length }}/{{ MAX_QUESTIONS }})</h2>
        <BaseButton icon="ph:plus" class="px-3! py-1.5!" @click="showQuestionBank = true">Adicionar questão</BaseButton>
      </div>
      <p class="sr-only" aria-live="assertive">{{ announcement }}</p>
      <ol v-if="fields.questions.length" ref="questionListEl" class="mb-4 list-none p-0">
        <li
          v-for="(eq, index) in fields.questions"
          :key="eq.questionId"
          class="flex flex-wrap items-center gap-2 border-b border-border bg-surface py-2"
        >
          <button
            type="button"
            data-drag-handle
            class="cursor-grab rounded p-1 text-muted hover:bg-page hover:text-text active:cursor-grabbing"
            :aria-label="`Reordenar questão ${eq.order}. Use as setas para cima e para baixo.`"
            title="Arraste ou use as setas para reordenar"
            @keydown="onHandleKeydown($event, index)"
          >
            <Icon name="ph:dots-six-vertical-bold" class="size-4" />
          </button>
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
            aria-hidden="true"
          >
            {{ eq.order }}
          </span>
          <div class="min-w-0 flex-1 truncate" :title="questionLabel(eq.questionId)">
            {{ questionLabel(eq.questionId) }}
          </div>
          <BaseButton
            variant="secondary"
            size="sm"
            icon="ph:eye"
            :aria-label="`Visualizar questão ${eq.order}`"
            title="Visualizar"
            @click="viewQuestion(eq.questionId)"
          />
          <label class="flex items-center">
            <span class="sr-only">Pontuação da questão {{ eq.order }}</span>
            <input
              v-model.number="eq.score"
              type="number"
              step="0.5"
              min="0"
              class="w-16 rounded-lg border border-border bg-white px-2 py-1"
            />
          </label>
          <BaseButton
            variant="danger"
            size="sm"
            icon="ph:x-bold"
            :aria-label="`Remover questão ${eq.order}`"
            title="Remover"
            @click="removeQuestion(eq.questionId)"
          />
        </li>
      </ol>
      <p v-else class="text-sm text-muted">Nenhuma questão adicionada</p>

      <p v-if="error" role="alert" class="mt-4 text-sm text-danger">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <BaseButton variant="secondary" to="/professor/exams">Cancelar</BaseButton>
        <BaseButton type="submit" :loading="saving">Salvar prova</BaseButton>
      </div>
    </form>

    <QuestionBankSlideover
      v-model="showQuestionBank"
      :selected-ids="selectedIds"
      :max="MAX_QUESTIONS"
      @add="addQuestion"
    />

    <QuestionViewModal v-model="showViewModal" :question="viewing" />
  </div>
</template>
