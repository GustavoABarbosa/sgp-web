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

const profileData = ref([
  {
    icon: 'ph:user',
    label: 'Nome',
    value: auth.user?.fullName,
  },
  {
    icon: 'ph:at',
    label: 'E-mail',
    value: auth.user?.email,
  },
  {
    icon: 'ph:user-circle',
    label: 'Tipo',
    value: auth.user?.role === 'professor' ? 'Professor' : 'Aluno',
  },
])

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
      <h2 class="mb-2">Dados pessoais</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
        <div
          v-for="item in profileData"
          :key="item.label"
          class="flex min-w-0 items-center gap-1 overflow-hidden rounded-lg border border-border p-2"
        >
          <Icon :name="item.icon" class="size-8 shrink-0 text-muted" />
          <div class="min-w-0 flex-1">
            <p class="text-xs leading-tight text-muted">{{ item.label }}</p>
            <p class="truncate text-xs font-medium leading-tight" :title="String(item.value ?? '')">
              {{ item.value }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2>Sessões</h2>
        <p class="text-sm text-muted">Encerre todas as sessões ativas em outros dispositivos.</p>
      </div>
      <button
        class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-page"
        @click="logoutAll"
      >
        Sair de todos os dispositivos
      </button>
    </div>

    <div class="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2>Privacidade (LGPD)</h2>
        <p class="mb-3 text-sm text-muted">
          Anonimizar sua conta é irreversível. Notas e correções existentes são preservadas,
          mas seus dados pessoais serão substituídos por placeholders.
        </p>
      </div>
      <button
        class="shrink-0 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        @click="showAnonymize = true"
      >
        Anonimizar minha conta
      </button>
    </div>

    <div class="mt-4 rounded-lg border border-border bg-surface p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        
        <h2>Desenvolvimento</h2>
        <p class="mb-3 text-sm text-muted">Restaura os dados mock iniciais.</p>
      </div>
      <button
        class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-page"
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
