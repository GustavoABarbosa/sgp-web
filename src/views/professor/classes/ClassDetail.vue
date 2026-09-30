<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Class, ClassStudent } from "@/types";
import { classesApi } from "@/api/classes";
import { useToastStore } from "@/stores/toast";
import { errorMessage } from "@/shared/api/client";
import { useConfirm } from "@/shared/useConfirm";
import { copyToClipboard } from "@/shared/utils";
import { classFormSchema, STUDENT_EMAIL_DOMAIN, useZodForm } from "@/shared/validation";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import DataTable, { type Column } from "@/components/DataTable.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import EmailInputGroup from "@/components/EmailInputGroup.vue";
import FormField from "@/components/FormField.vue";
import LoadingState from "@/components/LoadingState.vue";
import MenuItem from "@/components/MenuItem.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";

const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const confirm = useConfirm();
const classId = String(route.params.id);

const cls = ref<Class | null>(null);
const students = ref<ClassStudent[]>([]);
const loading = ref(true);
const loadError = ref("");
const saving = ref(false);
const enrolling = ref(false);
const enrollEmail = ref("");
const enrollError = ref("");

const { fields, validate, errorFor, reset } = useZodForm(classFormSchema, { name: "", subject: "", term: "" });
const isArchived = computed(() => cls.value?.status === "archived");

const studentColumns: Column[] = [
  { key: "fullName", label: "Nome", class: "w-full" },
  { key: "email", label: "E-mail" },
  { key: "actions", label: "Ações", hideLabel: true, align: "right" },
];

function applyClass(value: Class) {
  cls.value = value;
  reset({ name: value.name, subject: value.subject, term: value.term });
}

async function load() {
  try {
    const [value, list] = await Promise.all([classesApi.get(classId), classesApi.students(classId)]);
    applyClass(value);
    students.value = list;
  } catch (e) {
    loadError.value = errorMessage(e, "Turma não encontrada");
  } finally {
    loading.value = false;
  }
}

async function reloadStudents() {
  students.value = await classesApi.students(classId);
}

async function saveEdit() {
  const data = validate();
  if (!data) return;
  const ok = await confirm({
    title: "Salvar alterações",
    message: "Deseja salvar as alterações desta turma?",
    confirmLabel: "Salvar",
    danger: false,
  });
  if (!ok) return;
  saving.value = true;
  try {
    applyClass(await classesApi.update(classId, data));
    toast.success("Turma atualizada.");
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao atualizar turma"));
  } finally {
    saving.value = false;
  }
}

async function enroll() {
  if (!enrollEmail.value) {
    enrollError.value = "Informe o nome.sobrenome do aluno";
    return;
  }
  enrolling.value = true;
  try {
    await classesApi.enroll(classId, enrollEmail.value);
    enrollEmail.value = "";
    enrollError.value = "";
    toast.success("Aluno matriculado.");
    await reloadStudents();
  } catch (e) {
    enrollError.value = errorMessage(e, "Erro ao matricular");
  } finally {
    enrolling.value = false;
  }
}

async function removeStudent(student: ClassStudent["student"]) {
  const ok = await confirm({
    title: "Remover aluno",
    message: `Deseja remover ${student.fullName} da turma?`,
    confirmLabel: "Remover",
  });
  if (!ok) return;
  try {
    await classesApi.removeStudent(classId, student.id);
    toast.success("Aluno removido da turma.");
    await reloadStudents();
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao remover"));
  }
}

async function regenerateCode() {
  const ok = await confirm({
    title: "Regenerar código",
    message: "O código anterior será invalidado. Deseja continuar?",
    confirmLabel: "Regenerar",
  });
  if (!ok) return;
  try {
    cls.value = await classesApi.regenerateInviteCode(classId);
    toast.success("Novo código gerado.");
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao regenerar código"));
  }
}

async function copyCode() {
  if (!cls.value) return;
  await copyToClipboard(cls.value.inviteCode);
  toast.success("Código copiado!");
}

async function archive() {
  const ok = await confirm({
    title: "Arquivar turma",
    message: "Deseja arquivar esta turma? Ela deixará de aparecer na listagem ativa.",
    confirmLabel: "Arquivar",
  });
  if (!ok) return;
  try {
    await classesApi.archive(classId);
    toast.success("Turma arquivada.");
    router.push("/professor/classes");
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao arquivar"));
  }
}

onMounted(load);
</script>

<template>
  <div>
    <PageHeader
      :items="[
        { label: 'Turmas', to: '/professor/classes' },
        { label: cls?.name || (loading ? 'Carregando...' : 'Turma') },
      ]"
    />

    <LoadingState :loading="loading" :message="loadError" />

    <template v-if="cls">
      <BaseCard>
        <form novalidate @submit.prevent="saveEdit">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2>Editar turma</h2>
            <div class="flex items-center gap-2">
              <StatusBadge :status="cls.status" />
              <BaseButton v-if="!isArchived" variant="secondary" size="sm" @click="archive">
                Arquivar turma
              </BaseButton>
            </div>
          </div>
          <p v-if="isArchived" class="mb-4 text-sm text-muted">Turmas arquivadas não podem ser editadas.</p>
          <fieldset :disabled="isArchived" class="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <legend class="sr-only">Dados da turma</legend>
            <FormField v-model="fields.name" label="Nome" :error="errorFor('name')" />
            <FormField v-model="fields.subject" label="Disciplina" :error="errorFor('subject')" />
            <FormField v-model="fields.term" label="Período" :error="errorFor('term')" />
          </fieldset>
          <div v-if="!isArchived" class="flex justify-end">
            <BaseButton type="submit" size="sm" :loading="saving">Salvar alterações</BaseButton>
          </div>
        </form>
      </BaseCard>

      <div v-if="!isArchived" class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BaseCard title="Código de convite">
          <div class="flex flex-wrap items-center gap-2">
            <p class="font-mono text-lg font-semibold tracking-wider">{{ cls.inviteCode }}</p>
            <BaseButton
              variant="secondary"
              size="sm"
              icon="ph:copy-simple"
              aria-label="Copiar código"
              title="Copiar código"
              @click="copyCode"
            />
            <BaseButton
              variant="secondary"
              size="sm"
              icon="ph:arrows-clockwise"
              aria-label="Regenerar código"
              title="Regenerar código"
              @click="regenerateCode"
            />
          </div>
          <p class="text-sm text-muted">
            Compartilhe com alunos em
            <RouterLink :to="{ path: '/join', query: { code: cls.inviteCode } }">/join</RouterLink>
          </p>
        </BaseCard>

        <BaseCard title="Matricular aluno">
          <EmailInputGroup
            v-model="enrollEmail"
            label="E-mail do aluno"
            :domain="STUDENT_EMAIL_DOMAIN"
            :error="enrollError"
            autocomplete="off"
            class="!mb-0"
            @enter="enroll"
          >
            <template #action>
              <BaseButton :loading="enrolling" @click="enroll">Matricular</BaseButton>
            </template>
          </EmailInputGroup>
        </BaseCard>
      </div>

      <BaseCard :title="`Alunos matriculados (${students.length})`" class="mt-4">
        <DataTable
          :columns="isArchived ? studentColumns.slice(0, 2) : studentColumns"
          :rows="students"
          :row-key="(s: ClassStudent) => s.student.id"
          empty="Nenhum aluno matriculado"
        >
          <template #cell-fullName="{ row }">{{ row.student.fullName }}</template>
          <template #cell-email="{ row }">{{ row.student.email }}</template>
          <template #cell-actions="{ row }">
            <div class="inline-flex items-center justify-end">
              <DropdownMenu :label="`Ações para ${row.student.fullName}`">
                <MenuItem icon="ph:user-minus" danger @select="removeStudent(row.student)">Remover</MenuItem>
              </DropdownMenu>
            </div>
          </template>
        </DataTable>
      </BaseCard>
    </template>
  </div>
</template>
