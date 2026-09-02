<script setup lang="ts">
const props = defineProps<{ title?: string; description?: string, logo?: boolean }>()
const logoUrl = props.logo ? '/images/catolicaLogo.svg' : ''
</script>

<template>
  <div class="flex items-center gap-2 mb-6">
    <img v-if="logo" :src="logoUrl" alt="SGP Católica" />
    <div>
      <h1 class="mb-0 text-xl font-semibold">{{ title }}</h1>
      <p class="text-muted text-sm">{{ description }}</p>
    </div>
  </div>
</template>
