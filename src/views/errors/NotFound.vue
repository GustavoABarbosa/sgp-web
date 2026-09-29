<script setup lang="ts">
import Breadcrumb from "@/components/Breadcrumb.vue";
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-light p-4">
    <div class="w-full max-w-md rounded-lg border border-border bg-surface p-5 text-center shadow-sm">
      <Breadcrumb class="mb-2 justify-center" :items="[{ label: '404' }]" />
      <p class="mb-6 text-muted">Página não encontrada.</p>
      <RouterLink
        to="/login"
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white no-underline hover:bg-primary-light"
      >
        Ir para login
      </RouterLink>
    </div>
  </div>
</template>
