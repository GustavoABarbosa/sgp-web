<script setup lang="ts">
defineProps<{ message?: string; loading?: boolean }>()
</script>

<template>
  <div v-if="loading" class="text-center py-10 px-4 text-muted">Carregando...</div>
  <div v-else-if="message" class="text-center py-10 px-4 text-muted">{{ message }}</div>
</template>
