<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-primary to-primary-light p-4">
    <main
      id="main-content"
      tabindex="-1"
      class="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-sm focus:outline-none"
      :class="{ 'text-center': route.meta.centered }"
    >
      <RouterView />
    </main>
  </div>
</template>
