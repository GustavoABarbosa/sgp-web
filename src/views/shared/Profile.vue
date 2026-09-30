<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import { devApi } from "@/api/dev";
import { errorMessage } from "@/shared/api/client";
import { MOCKS_ENABLED } from "@/shared/env";
import { useConfirm } from "@/shared/useConfirm";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import PageHeader from "@/components/PageHeader.vue";

const auth = useAuthStore();
const toast = useToastStore();
const router = useRouter();
const confirm = useConfirm();

const profileData = computed(() => [
  { icon: "ph:user", label: "Nome", value: auth.user?.fullName ?? "" },
  { icon: "ph:at", label: "E-mail", value: auth.user?.email ?? "" },
  { icon: "ph:user-circle", label: "Tipo", value: auth.isProfessor ? "Professor" : "Aluno" },
]);

async function logoutAll() {
  try {
    await auth.logoutAll();
    router.push("/login");
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao encerrar sessões"));
  }
}

async function anonymize() {
  const ok = await confirm({
    title: "Confirmar anonimização",
    message: "Esta ação não pode ser desfeita. Deseja continuar?",
    confirmLabel: "Anonimizar",
  });
  if (!ok) return;
  try {
    await auth.anonymize();
    router.push("/login");
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao anonimizar conta"));
  }
}

async function resetMockData() {
  const ok = await confirm({
    title: "Resetar dados mock",
    message: "Todos os dados locais serão restaurados e você precisará entrar novamente.",
    confirmLabel: "Resetar",
  });
  if (!ok) return;
  try {
    await devApi.resetMockData();
    auth.clear();
    toast.success("Dados mock resetados. Faça login novamente.");
    router.push("/login");
  } catch (e) {
    toast.error(errorMessage(e, "Erro ao resetar dados"));
  }
}
</script>

<template>
  <div>
    <PageHeader :items="[{ label: 'Meu perfil' }]" />

    <BaseCard>
      <h2 class="mb-2">Dados pessoais</h2>
      <dl class="m-0 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div
          v-for="item in profileData"
          :key="item.label"
          class="flex min-w-0 items-center gap-1 overflow-hidden rounded-lg border border-border p-2"
        >
          <Icon :name="item.icon" class="size-8 shrink-0 text-muted" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <dt class="text-xs leading-tight text-muted">{{ item.label }}</dt>
            <dd class="m-0 truncate text-xs font-medium leading-tight" :title="item.value">{{ item.value }}</dd>
          </div>
        </div>
      </dl>
    </BaseCard>

    <BaseCard class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2>Sessões</h2>
        <p class="text-sm text-muted">Encerre todas as sessões ativas em outros dispositivos.</p>
      </div>
      <BaseButton variant="secondary" @click="logoutAll">Sair de todos os dispositivos</BaseButton>
    </BaseCard>

    <section
      class="mt-4 flex flex-col gap-4 rounded-lg border border-danger/30 bg-danger/5 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2>Privacidade (LGPD)</h2>
        <p class="mb-3 text-sm text-muted">
          Anonimizar sua conta é irreversível. Notas e correções existentes são preservadas, mas seus dados pessoais
          serão substituídos por placeholders.
        </p>
      </div>
      <BaseButton variant="danger" class="shrink-0" @click="anonymize">Anonimizar minha conta</BaseButton>
    </section>

    <BaseCard v-if="MOCKS_ENABLED" class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2>Desenvolvimento</h2>
        <p class="mb-3 text-sm text-muted">Restaura os dados mock iniciais.</p>
      </div>
      <BaseButton variant="secondary" @click="resetMockData">Resetar dados mock</BaseButton>
    </BaseCard>
  </div>
</template>
