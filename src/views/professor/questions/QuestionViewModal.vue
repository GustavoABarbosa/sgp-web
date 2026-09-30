<script setup lang="ts">
import type { Question } from "@/types";
import { renderMarkdown } from "@/shared/markdown";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import Modal from "@/components/Modal.vue";
import QuestionTypeLabel from "@/components/QuestionTypeLabel.vue";
import TagList from "@/components/TagList.vue";

defineProps<{
  question: Question | null;
}>();

defineSlots<{
  actions?: (props: { question: Question }) => unknown;
}>();

const open = defineModel<boolean>({ required: true });

const LETTERS = "abcdefghij";
</script>

<template>
  <Modal v-model="open" title="Visualizar questão" size="lg">
    <template v-if="question && $slots.actions" #actions>
      <slot name="actions" :question="question" />
    </template>
    <template v-if="question">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h3 class="mb-2 font-medium">Tipo</h3>
          <QuestionTypeLabel :type="question.type" class="text-sm" />
        </div>
        <div v-if="question.tags.length">
          <h3 class="mb-2 font-medium">Tags</h3>
          <TagList :tags="question.tags" />
        </div>
        <div v-if="question.type === 'discursiva'">
          <h3 class="mb-2 font-medium">Pontuação máxima</h3>
          <span class="text-sm">{{ question.maxScore }}</span>
        </div>
      </div>
      <div class="max-h-120 overflow-y-auto rounded-lg border border-border p-4">
        <MarkdownPreview :html="renderMarkdown(question.statement)" />
      </div>
      <template v-if="question.type === 'objetiva' && question.alternatives?.length">
        <h3 class="mb-2 mt-4 font-medium">Alternativas</h3>
        <ol class="m-0 list-none space-y-1.5 p-0">
          <li
            v-for="(alt, index) in question.alternatives"
            :key="alt.id"
            class="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
            :class="alt.id === question.correctAlternativeId ? 'border-success/40 bg-green-50' : 'border-border'"
          >
            <span class="font-semibold">{{ LETTERS[index] }})</span>
            <span class="flex-1">{{ alt.text }}</span>
            <span
              v-if="alt.id === question.correctAlternativeId"
              class="inline-flex items-center gap-1 text-xs font-semibold text-success"
            >
              <Icon name="ph:check-circle" class="size-4" />
              Correta
            </span>
          </li>
        </ol>
      </template>
    </template>
  </Modal>
</template>
