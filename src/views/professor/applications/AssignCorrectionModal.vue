<script setup lang="ts">
import { ref, useId, watch } from "vue";
import type { Correction, User } from "@/types";
import { applicationsApi } from "@/api/applications";
import { useToastStore } from "@/stores/toast";
import { errorMessage } from "@/shared/api/client";
import BaseButton from "@/components/BaseButton.vue";
import FormField from "@/components/FormField.vue";
import Modal from "@/components/Modal.vue";

const props = defineProps<{
  applicationId: string;
  correction: Correction | null;
  students: User[];
}>();

const emit = defineEmits<{ assigned: [] }>();

const open = defineModel<boolean>({ required: true });
const toast = useToastStore();
const formId = useId();
const studentId = ref("");
const notes = ref("");
const saving = ref(false);

watch(open, (value) => {
  if (!value) return;
  studentId.value = "";
  notes.value = "";
});

async function submit() {
  if (!props.correction || !studentId.value) return;
  saving.value = true;
  try {
    await applicationsApi.assignCorrection(props.applicationId, props.correction.id, {
      studentId: studentId.value,
      notes: notes.value.trim() || undefined,
    });
    toast.success("Nota atribuída ao aluno.");
    open.value = false;
    emit("assigned");
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao atribuir nota"));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal v-model="open" title="Atribuir nota ao aluno">
    <form v-if="correction" :id="formId" @submit.prevent="submit">
      <p>
        Nota calculada: <strong>{{ correction.totalScore }}</strong>
      </p>
      <FormField v-model="studentId" as="select" label="Aluno da turma" required>
        <option value="" disabled>Selecione...</option>
        <option v-for="s in students" :key="s.id" :value="s.id">{{ s.fullName }} — {{ s.email }}</option>
      </FormField>
      <FormField v-model="notes" as="textarea" label="Observações" rows="2" />
    </form>
    <template #footer="{ close }">
      <BaseButton variant="secondary" @click="close">Cancelar</BaseButton>
      <BaseButton type="submit" :form="formId" :disabled="!studentId" :loading="saving">Confirmar</BaseButton>
    </template>
  </Modal>
</template>
