<script setup lang="ts">
import { computed } from "vue";
import type { ExamVersion } from "@/types";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import StatusBadge from "@/components/StatusBadge.vue";

const props = defineProps<{ versions: ExamVersion[] }>();

const emit = defineEmits<{
  publish: [versionId?: string];
  copyLink: [publicCode: string];
}>();

const allPublished = computed(() => props.versions.every((v) => v.answerKeyPublished));

const columns: Column[] = [
  { key: "versionNumber", label: "Versão" },
  { key: "shuffle", label: "Embaralhamento" },
  { key: "identification", label: "Identificação" },
  { key: "answerKey", label: "Gabarito" },
  { key: "actions", label: "Ações", hideLabel: true },
];

const yesNo = (value: boolean) => (value ? "Sim" : "Não");
</script>

<template>
  <BaseCard title="Versões geradas" class="mt-4">
    <DataTable :columns="columns" :rows="versions" :row-key="(v: ExamVersion) => v.id">
      <template #cell-shuffle="{ row }">
        Questões: {{ yesNo(row.shuffleQuestions) }} / Alternativas: {{ yesNo(row.shuffleAlternatives) }}
      </template>
      <template #cell-identification="{ row }">{{ yesNo(row.withStudentIdentification) }}</template>
      <template #cell-answerKey="{ row }">
        <StatusBadge :status="row.answerKeyPublished ? 'ready' : 'draft'">
          {{ row.answerKeyPublished ? "Publicado" : "Não publicado" }}
        </StatusBadge>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex flex-wrap gap-2">
          <BaseButton v-if="!row.answerKeyPublished" variant="secondary" size="sm" @click="emit('publish', row.id)">
            Publicar<span class="sr-only"> gabarito da versão {{ row.versionNumber }}</span>
          </BaseButton>
          <BaseButton v-else variant="secondary" size="sm" icon="ph:link" @click="emit('copyLink', row.publicCode)">
            Copiar link gabarito<span class="sr-only"> da versão {{ row.versionNumber }}</span>
          </BaseButton>
        </div>
      </template>
    </DataTable>
    <BaseButton v-if="!allPublished" variant="secondary" size="sm" class="mt-3" @click="emit('publish')">
      Publicar todos os gabaritos
    </BaseButton>
  </BaseCard>
</template>
