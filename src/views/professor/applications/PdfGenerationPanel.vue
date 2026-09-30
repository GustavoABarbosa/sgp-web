<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { PdfGenerationConfig } from "@/types";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import FormField from "@/components/FormField.vue";

const MIN_VERSIONS = 1;
const MAX_VERSIONS = 10;

type VersionConfig = PdfGenerationConfig["versions"][number];

defineProps<{
  generated: boolean;
  hasPdf: boolean;
  generating: boolean;
}>();

const emit = defineEmits<{
  generate: [config: PdfGenerationConfig];
  download: [];
}>();

const requestedCount = ref(1);
const configs = ref<VersionConfig[]>([
  { shuffleQuestions: true, shuffleAlternatives: true, withStudentIdentification: true },
]);

const versionCount = computed(() => {
  const value = Math.trunc(Number(requestedCount.value));
  return Number.isFinite(value) ? Math.min(MAX_VERSIONS, Math.max(MIN_VERSIONS, value)) : MIN_VERSIONS;
});

const visibleConfigs = computed(() => configs.value.slice(0, versionCount.value));

watch(versionCount, (count) => {
  while (configs.value.length < count) {
    configs.value.push({ shuffleQuestions: true, shuffleAlternatives: false, withStudentIdentification: true });
  }
});

function clampInput() {
  requestedCount.value = versionCount.value;
}

function generate() {
  clampInput();
  emit("generate", { versions: visibleConfigs.value.map((c) => ({ ...c })) });
}
</script>

<template>
  <BaseCard title="Geração de PDF" class="mt-4">
    <FormField
      v-model.number="requestedCount"
      label="Quantidade de versões"
      type="number"
      :min="MIN_VERSIONS"
      :max="MAX_VERSIONS"
      @change="clampInput"
    />
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <fieldset
        v-for="(v, i) in visibleConfigs"
        :key="i"
        class="mb-4 space-y-2 rounded-lg border border-border bg-page p-4"
      >
        <legend class="sr-only">Versão {{ i + 1 }}</legend>
        <h3 class="mb-2 text-sm font-semibold" aria-hidden="true">Versão {{ i + 1 }}</h3>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="v.shuffleQuestions" type="checkbox" /> Embaralhar questões
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="v.shuffleAlternatives" type="checkbox" /> Embaralhar alternativas
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="v.withStudentIdentification" type="checkbox" /> Com identificação do aluno
        </label>
      </fieldset>
    </div>
    <div class="mt-4 flex flex-wrap gap-2">
      <BaseButton :loading="generating" @click="generate">
        {{ generating ? "Gerando..." : generated ? "Regenerar PDF" : "Gerar PDF" }}
      </BaseButton>
      <BaseButton v-if="hasPdf" variant="secondary" icon="ph:download-simple" @click="emit('download')">
        Download PDF
      </BaseButton>
    </div>
  </BaseCard>
</template>
