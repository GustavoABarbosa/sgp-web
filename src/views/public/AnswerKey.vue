<script setup lang="ts">
import { useRoute } from 'vue-router'
import { applicationsApi } from '@/api/applications'
import { useResource } from '@/shared/useResource'
import AnswerKeyList from '@/components/AnswerKeyList.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import LoadingState from '@/components/LoadingState.vue'

const route = useRoute()
const { data: answerKey, isLoading, error } = useResource(
  () => applicationsApi.publicAnswerKey(String(route.params.publicCode)),
  'Gabarito não disponível',
)
</script>

<template>
  <div class="flex min-h-screen justify-center bg-page p-4">
    <main id="main-content" tabindex="-1" class="focus:outline-none w-full max-w-3xl rounded-lg border border-border bg-surface p-5 shadow-sm">
      <Breadcrumb
        class="mb-6"
        :items="[{ label: answerKey ? `Gabarito — Versão ${answerKey.versionNumber}` : 'Gabarito' }]"
      />
      <LoadingState :loading="isLoading" :message="error" />

      <template v-if="answerKey">
        <p class="font-mono text-sm text-muted">Código: {{ answerKey.publicCode }}</p>
        <AnswerKeyList :items="answerKey.items" />
      </template>
    </main>
  </div>
</template>
