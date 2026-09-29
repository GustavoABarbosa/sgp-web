<script setup lang="ts">
import type { Question } from "@/types";
import { renderMarkdown } from "@/shared/utils";
import Modal from "@/components/Modal.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";

defineProps<{
  question: Question | null;
}>();

defineSlots<{
  actions?: (props: { question: Question }) => unknown;
}>();

const open = defineModel<boolean>({ required: true });
</script>

<template>
  <Modal v-model="open" title="Visualizar questão" size="lg">
    <template v-if="question && $slots.actions" #actions>
      <slot name="actions" :question="question" />
    </template>
    <template v-if="question">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 class="mb-2">Tipo</h2>
          <span class="inline-flex items-center gap-1.5 capitalize text-sm">
            <Icon :name="question.type === 'objetiva' ? 'ph:check-circle' : 'ph:pencil-simple-line'" class="size-4" />
            {{ question.type }}
          </span>
        </div>
        <div>
          <h2 class="mb-2">Tags</h2>
          <div class="flex flex-wrap items-center gap-1.5">
            <div
              v-for="tag in question.tags"
              :key="tag"
              class="rounded-lg border border-border bg-page px-2.5 py-1 text-xs font-medium capitalize text-text"
            >
              {{ tag }}
            </div>
          </div>
        </div>
      </div>
      <div class="overflow-y-auto max-h-120 border border-border rounded-lg p-4">
        <MarkdownPreview :html="renderMarkdown(question.statement)" />
      </div>
    </template>
  </Modal>
</template>
