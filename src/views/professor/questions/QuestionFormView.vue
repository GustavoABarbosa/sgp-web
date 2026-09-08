<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { QuestionAlternative } from "@/types";
import { mockApi, isApiError } from "@/mock/mockApi";
import { renderMarkdown } from "@/shared/utils";
import { useToast } from "@/shared/useToast";
import { discursiveQuestionSchema, getZodFieldErrors, objectiveQuestionSchema } from "@/shared/validation";
import FormField from "@/components/FormField.vue";
import AutoResizeTextarea from "@/components/AutoResizeTextarea.vue";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();
const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const fieldErrors = ref<Partial<Record<string, string>>>({});

const type = ref<"objetiva" | "discursiva">("objetiva");
const statement = ref("");
const tagsInput = ref("");
const maxScore = ref(5);
const alternatives = ref<QuestionAlternative[]>([
  { id: "new-a", text: "" },
  { id: "new-b", text: "" },
]);
const correctId = ref("");

const preview = computed(() => renderMarkdown(statement.value));

function clearFieldError(key: string) {
  if (!fieldErrors.value[key]) return;
  const next = { ...fieldErrors.value };
  delete next[key];
  fieldErrors.value = next;
}

watch(correctId, (id) => {
  if (id) clearFieldError("correctAlternativeId");
});

function addAlternative() {
  if (alternatives.value.length >= 5) return;
  alternatives.value.push({ id: `new-${crypto.randomUUID().slice(0, 4)}`, text: "" });
}

function removeAlternative(id: string) {
  if (alternatives.value.length <= 2) return;
  alternatives.value = alternatives.value.filter((a) => a.id !== id);
  if (correctId.value === id) correctId.value = "";
}

async function load() {
  if (!isEdit.value) return;
  loading.value = true;
  try {
    const res = await mockApi.listQuestions({});
    const q = res.data.find((x) => x.id === route.params.id);
    if (!q) throw new Error("Questão não encontrada");
    type.value = q.type;
    statement.value = q.statement;
    tagsInput.value = q.tags.join(", ");
    if (q.type === "discursiva") maxScore.value = q.maxScore ?? 5;
    else {
      alternatives.value = q.alternatives ?? [];
      correctId.value = q.correctAlternativeId ?? "";
    }
  } catch (e) {
    toast.error(isApiError(e) ? e.message : "Erro ao carregar");
  } finally {
    loading.value = false;
  }
}

async function submit() {
  fieldErrors.value = {};
  const tags = tagsInput.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    if (type.value === "objetiva") {
      const parsed = objectiveQuestionSchema.safeParse({
        type: "objetiva",
        statement: statement.value,
        tags,
        alternatives: alternatives.value,
        correctAlternativeId: correctId.value,
      });

      if (!parsed.success) {
        fieldErrors.value = getZodFieldErrors(parsed.error);
        toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
        return;
      }

      const idMap = new Map<string, string>();
      const alts = alternatives.value.map((a) => {
        const newId = a.id.startsWith("new-") ? uid("alt") : a.id;
        idMap.set(a.id, newId);
        return { id: newId, text: a.text };
      });
      const mappedCorrect = idMap.get(correctId.value) ?? correctId.value;
      const data = {
        type: "objetiva" as const,
        statement: parsed.data.statement,
        tags: parsed.data.tags,
        alternatives: alts,
        correctAlternativeId: mappedCorrect,
      };
      if (isEdit.value) await mockApi.updateQuestion(String(route.params.id), data);
      else await mockApi.createQuestion(data);
    } else {
      const parsed = discursiveQuestionSchema.safeParse({
        type: "discursiva",
        statement: statement.value,
        tags,
        maxScore: maxScore.value,
      });

      if (!parsed.success) {
        fieldErrors.value = getZodFieldErrors(parsed.error);
        toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
        return;
      }

      const data = parsed.data;
      if (isEdit.value) await mockApi.updateQuestion(String(route.params.id), data);
      else await mockApi.createQuestion(data);
    }
    router.push("/professor/questions");
  } catch (e) {
    toast.error(isApiError(e) ? e.message : "Erro ao salvar");
  }
}

onMounted(load);
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">{{ isEdit ? "Editar" : "Nova" }} questão</h1>
    </div>

    <form class="rounded-lg border border-border bg-surface p-5 shadow-sm" @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField v-model="type" as="select" label="Tipo" :disabled="isEdit">
          <option value="objetiva">Objetiva</option>
          <option value="discursiva">Discursiva</option>
        </FormField>
        <FormField
          v-if="type === 'discursiva'"
          v-model.number="maxScore"
          label="Pontuação máxima"
          type="number"
          min="0.5"
          step="0.5"
          :error="fieldErrors.maxScore"
        />
      </div>

      <MarkdownEditor id="statement" v-model="statement" label="Enunciado" :error="fieldErrors.statement" />
      <FormField v-model="tagsInput" label="Tags (separadas por vírgula)" placeholder="matematica, prova1" />

      <div
        v-if="type === 'objetiva'"
        class="mb-4"
        :class="{ 'rounded-lg border border-danger p-3': fieldErrors.correctAlternativeId }"
      >
        <label class="mb-1.5 block text-sm font-medium">Alternativas (2–5)</label>
        <div v-for="alt in alternatives" :key="alt.id" class="mb-2 flex flex-wrap items-start gap-2">
          <button
            type="button"
            class="mt-1.5 inline-flex items-center justify-center rounded-full border border-border bg-surface p-1 text-xs font-medium text-text transition-colors duration-300 hover:bg-page"
            @click="removeAlternative(alt.id)"
          >
            <Icon name="ph:trash" class="size-4" />
          </button>
          <AutoResizeTextarea
            v-model="alt.text"
            placeholder="Texto da alternativa"
            class="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2"
            :class="{ 'border-danger': fieldErrors.alternatives }"
          />
          <label class="mt-2 flex items-center gap-1.5 whitespace-nowrap text-sm">
            <input v-model="correctId" type="radio" :value="alt.id" /> Correta
          </label>
        </div>
        <p v-if="fieldErrors.alternatives" class="text-sm text-danger">{{ fieldErrors.alternatives }}</p>
        <button
          v-if="alternatives.length < 5"
          type="button"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-sm font-medium text-text hover:bg-page gap-1"
          @click="addAlternative"
        >
          <Icon name="ph:plus-bold" class="size-4" /> Adicionar Alternativa
        </button>
      </div>

      <h2>Pré-visualização da Questão</h2>
      <div class="mt-4 rounded-lg border border-border bg-page p-5 shadow-sm">
        <MarkdownPreview :html="preview" />
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <RouterLink
          to="/professor/questions"
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text no-underline hover:bg-page"
        >
          Cancelar
        </RouterLink>
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
        >
          Salvar
        </button>
      </div>
    </form>
  </div>
</template>
