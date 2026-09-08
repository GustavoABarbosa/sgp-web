<script setup lang="ts">
import { computed, nextTick, ref, useId } from "vue";
import { applyMarkdownFormat, applyMarkdownIndent, type MarkdownFormat } from "@/shared/markdown";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    error?: string;
    id?: string;
    rows?: number;
    placeholder?: string;
  }>(),
  {
    error: "",
    rows: 6,
    placeholder: "Digite o enunciado...",
  },
);

const model = defineModel<string>({ required: true });

const generatedId = useId();
const fieldId = computed(() => props.id ?? generatedId);
const hasError = computed(() => Boolean(props.error));
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const toolbarItems: { format: MarkdownFormat; label: string; icon: string; shortcut?: string }[] = [
  { format: "bold", label: "Negrito", icon: "ph:text-b", shortcut: "Ctrl+B" },
  { format: "italic", label: "Itálico", icon: "ph:text-italic", shortcut: "Ctrl+I" },
  { format: "code", label: "Código", icon: "ph:code", shortcut: "Ctrl+E" },
  { format: "codeBlock", label: "Bloco de código", icon: "ph:brackets-curly" },
];

async function updateSelection(nextValue: string, selectionStart: number, selectionEnd: number) {
  model.value = nextValue;

  await nextTick();
  const el = textareaRef.value;
  if (!el) return;

  el.focus();
  el.setSelectionRange(selectionStart, selectionEnd);
}

async function applyFormat(format: MarkdownFormat) {
  const el = textareaRef.value;
  if (!el) return;

  const result = applyMarkdownFormat(model.value ?? "", el.selectionStart, el.selectionEnd, format);
  await updateSelection(result.value, result.selectionStart, result.selectionEnd);
}

async function applyIndent(direction: "indent" | "outdent") {
  const el = textareaRef.value;
  if (!el) return;

  const result = applyMarkdownIndent(model.value ?? "", el.selectionStart, el.selectionEnd, direction);
  await updateSelection(result.value, result.selectionStart, result.selectionEnd);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Tab") {
    event.preventDefault();
    applyIndent(event.shiftKey ? "outdent" : "indent");
    return;
  }

  if (!event.ctrlKey && !event.metaKey) return;

  const shortcuts: Record<string, MarkdownFormat> = {
    b: "bold",
    i: "italic",
    e: "code",
  };

  const format = shortcuts[event.key.toLowerCase()];
  if (!format) return;

  event.preventDefault();
  applyFormat(format);
}
</script>

<template>
  <div class="mb-4">
    <label :for="fieldId" :class="['mb-1.5 block text-sm font-medium', hasError ? 'text-danger' : '']">
      {{ label }}
    </label>

    <div class="overflow-hidden rounded-lg border bg-white" :class="hasError ? 'border-danger' : 'border-neutral-300'">
      <div class="flex flex-wrap items-center gap-1 border-b border-border bg-page px-2 py-1.5">
        <button
          v-for="item in toolbarItems"
          :key="item.format"
          type="button"
          class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-text hover:bg-surface"
          :title="item.shortcut ? `${item.label} (${item.shortcut})` : item.label"
          @click="applyFormat(item.format)"
        >
          <Icon :name="item.icon" class="size-4" />
          <span class="hidden sm:inline">{{ item.label }}</span>
        </button>
      </div>

      <textarea
        :id="fieldId"
        ref="textareaRef"
        v-model="model"
        :rows="rows"
        :placeholder="placeholder"
        class="w-full resize-y border-0 bg-white px-3 py-2 font-mono text-sm leading-relaxed focus-visible:outline-none"
        v-bind="$attrs"
        @keydown="onKeydown"
      />
    </div>
    <p v-if="error" class="mt-0.5 text-xs font-medium text-danger">{{ error }}</p>
  </div>
</template>
