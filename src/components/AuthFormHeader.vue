<script setup lang="ts">
import Breadcrumb from '@/components/Breadcrumb.vue'

defineProps<{ title?: string; description?: string; logo?: boolean }>()
</script>

<template>
  <div class="mb-6 flex items-center gap-2">
    <img v-if="logo" src="/images/catolicaLogo.svg" alt="SGP Católica" />
    <div>
      <Breadcrumb v-if="title" :items="[{ label: title }]" />
      <p v-if="description" class="text-sm text-muted">{{ description }}</p>
    </div>
  </div>
</template>
