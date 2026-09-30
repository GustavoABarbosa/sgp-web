<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/ToastContainer.vue'
import ConfirmHost from '@/components/ConfirmHost.vue'
import SkipLink from '@/components/SkipLink.vue'
</script>

<template>
  <SkipLink />
  <RouterView />
  <ToastContainer />
  <ConfirmHost />
</template>
