<script setup lang="ts">
import { computed, onMounted, ref, useId } from "vue";
import { useRoute, useRouter } from "vue-router";
import { questionsApi, type QuestionInput } from "@/api/questions";
import { useToastStore } from "@/stores/toast";
import { errorMessage } from "@/shared/api/client";
import { renderMarkdown } from "@/shared/markdown";
import { MAX_ALTERNATIVES, MIN_ALTERNATIVES, parseTags, questionFormSchema, useZodForm } from "@/shared/validation";
import AutoResizeTextarea from "@/components/AutoResizeTextarea.vue";
import BaseButton from "@/components/BaseButton.vue";
import FormField from "@/components/FormField.vue";
import IconButton from "@/components/IconButton.vue";
import LoadingState from "@/components/LoadingState.vue";
import MarkdownEditor from "@/components/MarkdownEditor.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import PageHeader from "@/components/PageHeader.vue";
import SelectField from "@/components/SelectField.vue";

function newAlternative() {
  return { id: `alt-${crypto.randomUUID().slice(0, 8)}`, text: "" };
}

const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const questionId = computed(() => (route.params.id ? String(route.params.id) : null));
const loading = ref(!!questionId.value);
const loadError = ref("");
const saving = ref(false);
const radioName = useId();

const { fields, validate, errorFor, reset } = useZodForm(questionFormSchema, {
  type: "objetiva",
  statement: "",
  tags: "",
  maxScore: 5,
  alternatives: [newAlternative(), newAlternative()],
  correctAlternativeId: "",
});

const preview = computed(() => renderMarkdown(fields.statement));

function addAlternative() {
  if (fields.alternatives.length < MAX_ALTERNATIVES) fields.alternatives.push(newAlternative());
}

function removeAlternative(id: string) {
  if (fields.alternatives.length <= MIN_ALTERNATIVES) return;
  fields.alternatives = fields.alternatives.filter((a) => a.id !== id);
  if (fields.correctAlternativeId === id) fields.correctAlternativeId = "";
}

async function load() {
  if (!questionId.value) return;
  try {
    const q = await questionsApi.get(questionId.value);
    reset({
      type: q.type,
      statement: q.statement,
      tags: q.tags.join(", "),
      maxScore: q.maxScore ?? 5,
      alternatives: q.alternatives?.length ? q.alternatives : [newAlternative(), newAlternative()],
      correctAlternativeId: q.correctAlternativeId ?? "",
    });
  } catch (e) {
    loadError.value = errorMessage(e, "Erro ao carregar questão");
  } finally {
    loading.value = false;
  }
}

async function submit() {
  const data = validate();
  if (!data) return;

  const input: QuestionInput =
    data.type === "objetiva"
      ? {
          type: "objetiva",
          statement: data.statement,
          tags: parseTags(data.tags),
          alternatives: data.alternatives.map((a) => ({ id: a.id, text: a.text.trim() })),
          correctAlternativeId: data.correctAlternativeId,
        }
      : { type: "discursiva", statement: data.statement, tags: parseTags(data.tags), maxScore: data.maxScore };

  saving.value = true;
  try {
    if (questionId.value) await questionsApi.update(questionId.value, input);
    else await questionsApi.create(input);
    toast.success("Questão salva.");
    router.push("/professor/questions");
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao salvar"));
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <PageHeader
      :items="[
        { label: 'Questões', to: '/professor/questions' },
        { label: questionId ? 'Editar questão' : 'Nova questão' },
      ]"
    />

    <LoadingState :loading="loading" :message="loadError" />

    <form
      v-if="!loading && !loadError"
      class="rounded-lg border border-border bg-surface p-5 shadow-sm"
      novalidate
      @submit.prevent="submit"
    >
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField v-model="fields.type" label="Tipo" size="md" class="mb-4" :disabled="!!questionId">
          <option value="objetiva">Objetiva</option>
          <option value="discursiva">Discursiva</option>
        </SelectField>
        <FormField
          v-if="fields.type === 'discursiva'"
          v-model.number="fields.maxScore"
          label="Pontuação máxima"
          type="number"
          min="0.5"
          step="0.5"
          :error="errorFor('maxScore')"
        />
      </div>

      <MarkdownEditor id="statement" v-model="fields.statement" label="Enunciado" :error="errorFor('statement')" />
      <FormField v-model="fields.tags" label="Tags (separadas por vírgula)" placeholder="matematica, prova1" />

      <fieldset
        v-if="fields.type === 'objetiva'"
        class="mb-4"
        :class="{ 'rounded-lg border border-danger p-3': errorFor('correctAlternativeId') }"
        :aria-describedby="errorFor('correctAlternativeId') || errorFor('alternatives') ? `${radioName}-error` : undefined"
      >
        <legend class="mb-1.5 block text-sm font-medium">
          Alternativas ({{ MIN_ALTERNATIVES }}–{{ MAX_ALTERNATIVES }})
        </legend>
        <div v-for="(alt, index) in fields.alternatives" :key="alt.id" class="mb-2 flex flex-wrap items-start gap-2">
          <IconButton
            class="mt-1.5"
            icon="ph:trash"
            icon-class="size-4"
            :label="`Remover alternativa ${index + 1}`"
            :disabled="fields.alternatives.length <= MIN_ALTERNATIVES"
            @click="removeAlternative(alt.id)"
          />
          <AutoResizeTextarea
            v-model="alt.text"
            placeholder="Texto da alternativa"
            :aria-label="`Texto da alternativa ${index + 1}`"
            class="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2"
            :class="{ 'border-danger': errorFor('alternatives') && !alt.text.trim() }"
          />
          <label class="mt-2 flex items-center gap-1.5 whitespace-nowrap text-sm">
            <input v-model="fields.correctAlternativeId" type="radio" :name="radioName" :value="alt.id" />
            Correta<span class="sr-only"> (alternativa {{ index + 1 }})</span>
          </label>
        </div>
        <p
          v-if="errorFor('alternatives') || errorFor('correctAlternativeId')"
          :id="`${radioName}-error`"
          class="text-sm text-danger"
        >
          {{ errorFor("alternatives") || errorFor("correctAlternativeId") }}
        </p>
        <BaseButton
          v-if="fields.alternatives.length < MAX_ALTERNATIVES"
          variant="secondary"
          size="sm"
          icon="ph:plus-bold"
          class="mt-1"
          @click="addAlternative"
        >
          Adicionar alternativa
        </BaseButton>
      </fieldset>

      <h2>Pré-visualização da Questão</h2>
      <div class="mt-4 rounded-lg border border-border bg-page p-5 shadow-sm">
        <MarkdownPreview :html="preview" />
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <BaseButton variant="secondary" to="/professor/questions">Cancelar</BaseButton>
        <BaseButton type="submit" :loading="saving">Salvar</BaseButton>
      </div>
    </form>
  </div>
</template>
