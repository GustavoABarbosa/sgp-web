<script setup lang="ts">
defineProps<{ html: string }>()
</script>

<template>
  <div
    class="[&_strong]:font-bold [&_em]:italic [&_code]:bg-page [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm"
    v-html="html"
  />
</template>
