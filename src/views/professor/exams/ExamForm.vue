<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { insertNodeAt, removeNode, useSortable } from "@vueuse/integrations/useSortable";
import type { ExamQuestion, Question } from "@/types";
import { mockApi, isApiError } from "@/mock/mockApi";
import FormField from "@/components/FormField.vue";
import Breadcrumb from "@/components/Breadcrumb.vue";
import { examFormSchema, getZodFieldErrors } from "@/shared/validation";
import QuestionBankSlideover from "./QuestionBankSlideover.vue";
import QuestionViewModal from "../questions/QuestionViewModal.vue";

const MAX_QUESTIONS = 20;

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);

const title = ref("");
const description = ref("");
const selectedQuestions = ref<ExamQuestion[]>([]);
const availableQuestions = ref<Question[]>([]);
const targetTotal = ref(10);
const error = ref("");
const fieldErrors = ref<Partial<Record<string, string>>>({});
const showQuestionBank = ref(false);
const viewing = ref<Question | null>(null);
const showViewModal = ref(false);

const selectedIds = computed(() => selectedQuestions.value.map((q) => q.questionId));
const totalScore = computed(() => selectedQuestions.value.reduce((s, q) => s + q.score, 0));
const scoreWarning = computed(() => Math.abs(totalScore.value - targetTotal.value) > 0.01);

async function load() {
  availableQuestions.value = (await mockApi.listQuestions({})).data;
  if (isEdit.value) {
    const exam = await mockApi.getExam(String(route.params.id));
    title.value = exam.title;
    description.value = exam.description ?? "";
    selectedQuestions.value = [...exam.questions].sort((a, b) => a.order - b.order);
  }
}

function addQuestion(q: Question) {
  if (selectedQuestions.value.length >= MAX_QUESTIONS) return;
  if (selectedQuestions.value.some((x) => x.questionId === q.id)) return;
  error.value = "";
  selectedQuestions.value.push({
    questionId: q.id,
    order: selectedQuestions.value.length + 1,
    score: q.type === "discursiva" ? (q.maxScore ?? 5) : 2,
  });
}

function removeQuestion(questionId: string) {
  selectedQuestions.value = selectedQuestions.value
    .filter((q) => q.questionId !== questionId)
    .map((q, i) => ({ ...q, order: i + 1 }));
}

const questionListEl = ref<HTMLElement | null>(null);

useSortable(questionListEl, selectedQuestions, {
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
    const arr = [...selectedQuestions.value];
    const [moved] = arr.splice(oldIndex, 1);
    arr.splice(newIndex, 0, moved!);
    selectedQuestions.value = arr.map((q, i) => ({ ...q, order: i + 1 }));
  },
});

function viewQuestion(id: string) {
  viewing.value = availableQuestions.value.find((q) => q.id === id) ?? null;
  showViewModal.value = !!viewing.value;
}

function questionLabel(id: string) {
  const q = availableQuestions.value.find((x) => x.id === id);
  return q ? q.statement : id;
}

async function submit() {
  error.value = "";
  fieldErrors.value = {};

  const result = examFormSchema.safeParse({
    title: title.value,
    description: description.value,
    questions: selectedQuestions.value,
  });

  if (!result.success) {
    fieldErrors.value = getZodFieldErrors(result.error);
    error.value = result.error.issues[0]?.message ?? "Dados inválidos";
    return;
  }

  try {
    const payload = result.data;
    if (isEdit.value) await mockApi.updateExam(String(route.params.id), payload);
    else await mockApi.createExam(payload);
    router.push("/professor/exams");
  } catch (e) {
    error.value = isApiError(e) ? e.message : "Erro";
  }
}

onMounted(load);
</script>

<template>
  <div>
    <Breadcrumb
      class="mb-6"
      :items="[{ label: 'Provas', to: '/professor/exams' }, { label: isEdit ? 'Editar prova' : 'Nova prova' }]"
    />

    <form class="rounded-lg border border-border bg-surface p-5 shadow-sm" @submit.prevent="submit">
      <FormField v-model="title" label="Título" :error="fieldErrors.title" />
      <FormField v-model="description" as="textarea" label="Descrição" rows="2" />

      <div
        class="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-page p-3 text-sm"
        :class="scoreWarning ? 'border border-warning text-warning' : ''"
      >
        <span
          >Total: <strong>{{ totalScore.toFixed(1) }}</strong> pts</span
        >
        <span>
          Meta desejada:
          <input
            v-model.number="targetTotal"
            type="number"
            step="0.5"
            class="w-20 rounded-lg border border-border bg-white px-2 py-1"
          />
          pts
        </span>
        <span v-if="scoreWarning">A soma não coincide com a meta (responsabilidade do professor)</span>
      </div>

      <div class="mb-3 flex items-center justify-between gap-4">
        <h2 class="mb-0">Questões selecionadas ({{ selectedQuestions.length }}/{{ MAX_QUESTIONS }})</h2>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-light"
          @click="showQuestionBank = true"
        >
          <Icon name="ph:plus" class="size-4" />
          Adicionar questão
        </button>
      </div>
      <div v-if="selectedQuestions.length" ref="questionListEl" class="mb-4">
        <div
          v-for="eq in selectedQuestions"
          :key="eq.questionId"
          class="flex flex-wrap items-center gap-2 border-b border-border bg-surface py-2"
        >
          <button
            type="button"
            data-drag-handle
            class="cursor-grab rounded p-1 text-muted hover:bg-page hover:text-text active:cursor-grabbing"
            title="Arraste para reordenar"
          >
            <Icon name="ph:dots-six-vertical-bold" class="size-4" />
          </button>
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
          >
            {{ eq.order }}
          </span>
          <div class="min-w-0 flex-1 truncate">
            <span class="">{{ questionLabel(eq.questionId) }}</span>
          </div>
          <button
            type="button"
            class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
            title="Visualizar"
            @click="viewQuestion(eq.questionId)"
          >
            <Icon name="ph:eye" class="size-4" />
          </button>
          <input
            v-model.number="eq.score"
            type="number"
            step="0.5"
            min="0"
            class="w-16 rounded-lg border border-border bg-white px-2 py-1"
          />
          <button
            type="button"
            class="rounded-lg bg-danger px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
            @click="removeQuestion(eq.questionId)"
          >
            <Icon name="ph:x-bold" class="size-3.5" />
          </button>
        </div>
      </div>
      <p v-else class="text-sm text-muted">Nenhuma questão adicionada</p>

      <p v-if="error" class="mt-4 text-sm text-danger">{{ error }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <RouterLink
          to="/professor/exams"
          class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page"
        >
          Cancelar
        </RouterLink>
        <button
          type="submit"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        >
          Salvar prova
        </button>
      </div>
    </form>

    <QuestionBankSlideover
      v-model="showQuestionBank"
      :questions="availableQuestions"
      :selected-ids="selectedIds"
      :max="MAX_QUESTIONS"
      @add="addQuestion"
    />

    <QuestionViewModal v-model="showViewModal" :question="viewing" />
  </div>
</template>
