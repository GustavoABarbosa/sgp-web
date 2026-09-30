<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  pdfGenerated: boolean;
  answerKeyPublished: boolean;
  correctionCount: number;
  pendingCount: number;
}>();

const steps = computed(() => {
  const hasCorrections = props.correctionCount > 0;
  const items = [
    { label: "Criada", done: true },
    { label: "PDF gerado", done: props.pdfGenerated },
    { label: "Gabarito publicado", done: props.answerKeyPublished },
    { label: "Corrigido", done: hasCorrections },
    { label: "Notas lançadas", done: hasCorrections && props.pendingCount === 0 },
  ];
  const currentIndex = items.findIndex((s) => !s.done);
  return items.map((s, i) => ({ ...s, current: i === currentIndex }));
});
</script>

<template>
  <ol class="mx-auto mb-6 flex max-w-215 items-center overflow-x-auto" aria-label="Etapas da aplicação">
    <template v-for="(s, i) in steps" :key="s.label">
      <li
        v-if="i > 0"
        aria-hidden="true"
        class="mx-1 h-0.5 min-w-6 flex-1 rounded-full"
        :class="s.done ? 'bg-success' : 'bg-border'"
      />
      <li
        class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
        :class="
          s.current
            ? 'border-primary bg-primary text-white'
            : s.done
              ? 'border-success bg-success/10 text-success'
              : 'border-border bg-white text-muted'
        "
        :aria-current="s.current ? 'step' : undefined"
      >
        <Icon v-if="s.done && !s.current" name="ph:check-bold" class="size-3" />
        <span
          v-else
          class="flex size-4 items-center justify-center rounded-full text-[10px]"
          :class="s.current ? 'bg-white/20' : 'bg-page'"
          aria-hidden="true"
        >
          {{ i + 1 }}
        </span>
        {{ s.label }}
        <span class="sr-only">{{ s.done ? "(concluída)" : s.current ? "(etapa atual)" : "(pendente)" }}</span>
      </li>
    </template>
  </ol>
</template>
