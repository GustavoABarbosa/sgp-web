<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { reportsApi } from "@/api/reports";
import { useResource } from "@/shared/useResource";
import BaseButton from "@/components/BaseButton.vue";
import BaseCard from "@/components/BaseCard.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatCard from "@/components/StatCard.vue";
import StatGrid from "@/components/StatGrid.vue";

const auth = useAuthStore();
const { data: summary, error } = useResource(() => reportsApi.summary(), "Erro ao carregar resumo");
const firstName = computed(() => auth.user?.fullName.split(" ")[0] ?? "");
const value = (n: number | undefined) => n ?? "--";
</script>

<template>
  <div>
    <PageHeader :items="[{ label: `Olá, ${firstName}` }]" />

    <p v-if="error" role="alert" class="mb-4 text-sm text-danger">{{ error }}</p>

    <StatGrid>
      <StatCard label="Questões" :value="value(summary?.questions)" />
      <StatCard label="Turmas ativas" :value="value(summary?.activeClasses)" />
      <StatCard label="Provas" :value="value(summary?.exams)" />
      <StatCard label="Aplicações" :value="value(summary?.applications)" />
      <StatCard label="Notas pendentes" :value="value(summary?.pendingCorrections)" />
    </StatGrid>

    <BaseCard title="Ações rápidas">
      <div class="mt-4 flex flex-wrap gap-2">
        <BaseButton to="/professor/questions/new" icon="ph:plus-bold">Nova questão</BaseButton>
        <BaseButton variant="secondary" to="/professor/classes/new" icon="ph:plus-bold">Nova turma</BaseButton>
        <BaseButton variant="secondary" to="/professor/exams/new" icon="ph:plus-bold">Nova prova</BaseButton>
        <BaseButton variant="secondary" to="/professor/applications/new" icon="ph:plus-bold">Nova aplicação</BaseButton>
      </div>
    </BaseCard>
  </div>
</template>
