<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { mockApi, isApiError } from '@/mock/mockApi'

const auth = useAuthStore()
const router = useRouter()
const showAnonymize = ref(false)
const message = ref('')
const error = ref('')

async function logoutAll() {
  await auth.logoutAll()
  router.push('/login')
}

async function confirmAnonymize() {
  try {
    await auth.anonymize()
    router.push('/login')
  } catch (e) {
    error.value = isApiError(e) ? e.message : 'Erro'
  }
}

function resetMockData() {
  mockApi.reset()
  message.value = 'Dados mock resetados. Faça login novamente.'
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="mb-0 text-3xl font-semibold">Meu perfil</h1>
    </div>

    <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt class="font-medium text-muted">Nome</dt>
        <dd class="m-0">{{ auth.user?.fullName }}</dd>
        <dt class="font-medium text-muted">E-mail</dt>
        <dd class="m-0">{{ auth.user?.email }}</dd>
        <dt class="font-medium text-muted">Tipo</dt>
        <dd class="m-0">{{ auth.user?.role === 'professor' ? 'Professor' : 'Aluno' }}</dd>
      </dl>
    </div>

    <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Sessões</h2>
      <p class="mb-3 text-sm text-muted">Encerre todas as sessões ativas em outros dispositivos.</p>
      <button
        class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-page"
        @click="logoutAll"
      >
        Sair de todos os dispositivos
      </button>
    </div>

    <div class="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-5 shadow-sm">
      <h2>Privacidade (LGPD)</h2>
      <p class="mb-3 text-sm text-muted">
        Anonimizar sua conta é irreversível. Notas e correções existentes são preservadas,
        mas seus dados pessoais serão substituídos por placeholders.
      </p>
      <button
        class="inline-flex items-center justify-center rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        @click="showAnonymize = true"
      >
        Anonimizar minha conta
      </button>
    </div>

    <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2>Desenvolvimento</h2>
      <p class="mb-3 text-sm text-muted">Restaura os dados mock iniciais.</p>
      <button
        class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
        @click="resetMockData"
      >
        Resetar dados mock
      </button>
      <p v-if="message" class="mt-2 text-sm text-success">{{ message }}</p>
    </div>

    <div v-if="showAnonymize" class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" @click.self="showAnonymize = false">
      <div class="w-full max-w-md rounded-lg bg-surface p-6 shadow-2xl">
        <h2>Confirmar anonimização</h2>
        <p>Esta ação não pode ser desfeita. Deseja continuar?</p>
        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <div class="mt-4 flex justify-end gap-2">
          <button
            class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-page"
            @click="showAnonymize = false"
          >
            Cancelar
          </button>
          <button
            class="inline-flex items-center justify-center rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmAnonymize"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
