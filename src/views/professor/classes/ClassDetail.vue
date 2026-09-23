<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Class } from "@/types";
import { mockApi, isApiError } from "@/mock/mockApi";
import ConfirmModal from "@/components/ConfirmModal.vue";
import Breadcrumb from "@/components/Breadcrumb.vue";
import EmailInputGroup from "@/components/EmailInputGroup.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { copyToClipboard, statusLabel } from "@/shared/utils";
import { useToast } from "@/shared/useToast";
import { STUDENT_EMAIL_DOMAIN } from "@/shared/validation";

const route = useRoute();
const router = useRouter();
const toast = useToast();
const cls = ref<Class | null>(null);
const students = ref<{ enrollment: { id: string }; student: { id: string; fullName: string; email: string } }[]>([]);
const inviteCode = ref("");
const enrollEmail = ref("");
const showRemoveModal = ref(false);
const studentToRemove = ref<string | null>(null);
const showRegenerateModal = ref(false);
const showSaveModal = ref(false);
const showArchiveModal = ref(false);
const enrollInputError = ref("");

const editName = ref("");
const editSubject = ref("");
const editTerm = ref("");

async function load() {
  const id = String(route.params.id);
  const all = await mockApi.listClasses();
  cls.value = all.find((c) => c.id === id) ?? null;
  if (!cls.value) return;
  editName.value = cls.value.name;
  editSubject.value = cls.value.subject;
  editTerm.value = cls.value.term;
  const code = await mockApi.getInviteCode(id);
  inviteCode.value = code.inviteCode;
  students.value = await mockApi.listClassStudents(id);
  console.log(cls.value)
}

function requestSaveEdit() {
  showSaveModal.value = true;
}

async function confirmSaveEdit() {
  try {
    await mockApi.updateClass(String(route.params.id), {
      name: editName.value,
      subject: editSubject.value,
      term: editTerm.value,
    });
    showSaveModal.value = false;
    toast.success("Turma atualizada");
    load();
  } catch (e) {
    toast.error(isApiError(e) ? e.message : "Erro ao atualizar turma");
  }
}

async function enroll() {
  if (!enrollEmail.value) {
    enrollInputError.value = "Informe o nome.sobrenome do aluno";
    toast.error("Informe o nome.sobrenome do aluno");
    return;
  }
  try {
    await mockApi.enrollStudent(String(route.params.id), enrollEmail.value);
    enrollEmail.value = "";
    enrollInputError.value = "";
    toast.success("Aluno matriculado");
    load();
  } catch (e) {
    enrollInputError.value = isApiError(e) ? e.message : "Erro ao matricular";
    toast.error(enrollInputError.value);
  }
}

function requestRemoveStudent(studentId: string) {
  studentToRemove.value = studentId;
  showRemoveModal.value = true;
}

async function confirmRemoveStudent() {
  if (!studentToRemove.value) return;
  try {
    await mockApi.removeStudent(String(route.params.id), studentToRemove.value);
    showRemoveModal.value = false;
    studentToRemove.value = null;
    toast.success("Aluno removido da turma");
    load();
  } catch (e) {
    toast.error(isApiError(e) ? e.message : "Erro ao remover");
  }
}

function cancelRemoveStudent() {
  studentToRemove.value = null;
}

function requestRegenerateCode() {
  showRegenerateModal.value = true;
}

async function confirmRegenerateCode() {
  try {
    const res = await mockApi.regenerateInviteCode(String(route.params.id));
    inviteCode.value = res.inviteCode;
    showRegenerateModal.value = false;
    toast.success("Novo código gerado");
  } catch (e) {
    toast.error(isApiError(e) ? e.message : "Erro ao regenerar código");
  }
}

async function copyCode() {
  await copyToClipboard(inviteCode.value);
  toast.success("Código copiado!");
}

function requestArchive() {
  showArchiveModal.value = true;
}

async function confirmArchive() {
  try {
    await mockApi.archiveClass(String(route.params.id));
    showArchiveModal.value = false;
    toast.success("Turma arquivada");
    router.push("/professor/classes");
  } catch (e) {
    toast.error(isApiError(e) ? e.message : "Erro ao arquivar");
  }
}

onMounted(load);
</script>

<template>
  <div>
    <Breadcrumb
      class="mb-6"
      :items="[{ label: 'Turmas', to: '/professor/classes' }, { label: cls?.name || 'Carregando...' }]"
    />

    <div v-if="cls">
      <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div class="flex justify-between items-center">
          <h2>Editar turma</h2>
          <div class="flex items-center gap-2">
            <StatusBadge :status="cls.status">{{ statusLabel(cls.status) }}</StatusBadge>
            <button
              v-if="cls.status === 'active'"
              type="button"
              class="rounded-lg border border-border px-2.5 py-1 text-sm text-muted hover:text-danger hover:border-danger"
              @click="requestArchive"
            >
              Arquivar turma
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="mb-4">
            <label class="mb-1.5 block text-sm font-medium">Nome</label>
            <input v-model="editName" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
          </div>
          <div class="mb-4">
            <label class="mb-1.5 block text-sm font-medium">Disciplina</label>
            <input v-model="editSubject" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
          </div>
          <div class="mb-4">
            <label class="mb-1.5 block text-sm font-medium">Período</label>
            <input v-model="editTerm" class="w-full rounded-lg border border-border bg-white px-3 py-2" />
          </div>
        </div>
        <div class="flex justify-end">
          <button
            class="rounded-lg bg-primary px-2.5 py-1 text-sm font-medium text-white hover:bg-primary-light"
            @click="requestSaveEdit"
          >
            Salvar alterações
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h2>Código de convite</h2>
          <div class="flex flex-wrap items-center gap-2">
            <p class="font-mono text-lg font-semibold tracking-wider">{{ inviteCode }}</p>
            <button
              class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
              @click="copyCode"
            >
              <Icon name="ph:copy-simple" class="size-4" />
            </button>
            <button
              class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
              @click="requestRegenerateCode"
            >
              <Icon name="ph:arrows-clockwise" class="size-4" />
            </button>
          </div>
          <p class="text-sm text-muted">Compartilhe com alunos em <RouterLink to="/join">/join</RouterLink></p>
        </div>

        <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h2>Matricular aluno</h2>
          <EmailInputGroup
            v-model="enrollEmail"
            :domain="STUDENT_EMAIL_DOMAIN"
            :error="enrollInputError"
            class="!mb-0"
            @enter="enroll"
          >
            <template #action>
              <button
                type="button"
                class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
                @click="enroll"
              >
                Matricular
              </button>
            </template>
          </EmailInputGroup>
        </div>
      </div>

      <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2>Alunos matriculados ({{ students.length }})</h2>
        <table v-if="students.length" class="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted w-full"
              >
                Nome
              </th>
              <th
                class="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
              >
                E-mail
              </th>
              <th class="border-b border-border w-28" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="{ student } in students" :key="student.id">
              <td class="border-b border-border px-3 py-2.5">{{ student.fullName }}</td>
              <td class="border-b border-border px-3 py-2.5 text-right">{{ student.email }}</td>
              <td class="border-b border-border px-3 py-2.5 text-right pe-2">
                <div class="inline-flex items-center justify-end">
                  <DropdownMenu>
                    <template #default="{ close }">
                      <button
                        type="button"
                        role="menuitem"
                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-page"
                        @click="
                          close();
                          requestRemoveStudent(student.id);
                        "
                      >
                        <Icon name="ph:user-minus" class="size-4" />
                        Remover
                      </button>
                    </template>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-sm text-muted">Nenhum aluno matriculado</p>
      </div>
    </div>

    <ConfirmModal
      v-model="showArchiveModal"
      title="Arquivar turma"
      confirm-label="Arquivar"
      @confirm="confirmArchive"
    >
      <p>Deseja arquivar esta turma? Ela deixará de aparecer na listagem ativa.</p>
    </ConfirmModal>

    <ConfirmModal
      v-model="showSaveModal"
      title="Salvar alterações"
      confirm-label="Salvar"
      :confirm-danger="false"
      @confirm="confirmSaveEdit"
    >
      <p>Deseja salvar as alterações desta turma?</p>
    </ConfirmModal>

    <ConfirmModal
      v-model="showRemoveModal"
      title="Remover aluno"
      confirm-label="Remover"
      @cancel="cancelRemoveStudent"
      @confirm="confirmRemoveStudent"
    >
      <p>Deseja remover este aluno da turma?</p>
    </ConfirmModal>

    <ConfirmModal
      v-model="showRegenerateModal"
      title="Regenerar código"
      confirm-label="Regenerar"
      @confirm="confirmRegenerateCode"
    >
      <p>O código anterior será invalidado. Deseja continuar?</p>
    </ConfirmModal>
  </div>
</template>
