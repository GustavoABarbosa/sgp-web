<script setup lang="ts">
defineProps<{ html: string }>()
</script>

<template>
  <div
    class="markdown-preview text-sm leading-relaxed [&_em]:italic [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-page [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_ol]:my-2 [&_ol]:space-y-1 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-page [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_.markdown-list-numeric]:list-decimal [&_.markdown-list-numeric]:pl-5 [&_.markdown-list-alpha]:list-none [&_.markdown-list-alpha]:pl-0 [&_.markdown-list-alpha_li]:flex [&_.markdown-list-alpha_li]:gap-2 [&_.markdown-list-marker]:shrink-0 [&_.markdown-list-marker]:font-medium"
    v-html="html"
  />
</template>
