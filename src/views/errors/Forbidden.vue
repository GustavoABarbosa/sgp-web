<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import Breadcrumb from "@/components/Breadcrumb.vue";
import BaseButton from "@/components/BaseButton.vue";

const auth = useAuthStore();
</script>

<template>
  <Breadcrumb class="mb-2 justify-center" :items="[{ label: '403' }]" />
  <p class="mb-6 text-muted">Acesso negado.</p>
  <BaseButton :to="auth.isAuthenticated ? auth.homePath : '/login'">
    {{ auth.isAuthenticated ? "Ir para o início" : "Ir para login" }}
  </BaseButton>
</template>
