<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const links = [
  { to: '/professor/dashboard', label: 'Início' },
  { to: '/professor/questions', label: 'Questões' },
  { to: '/professor/classes', label: 'Turmas' },
  { to: '/professor/exams', label: 'Provas' },
  { to: '/professor/applications', label: 'Aplicações' },
  { to: '/professor/reports', label: 'Relatórios' },
]

const navLinkClass = (path: string) =>
  [
    'text-white/85 no-underline px-5 py-2.5 text-sm transition-colors hover:bg-white/10 hover:text-white',
    route.path.startsWith(path) ? 'bg-white/10 text-white' : '',
  ].join(' ')

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen flex-col md:flex-row">
    <aside class="flex w-full shrink-0 flex-col bg-primary py-5 text-white md:w-60">
      <div class="mb-3 border-b border-white/15 px-5 pb-5">
        <strong class="block text-lg">SGP Católica</strong>
        <small class="text-xs opacity-75">Área do Professor</small>
      </div>
      <nav class="flex flex-1 flex-row flex-wrap md:flex-col">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" :class="navLinkClass(link.to)">
          {{ link.label }}
        </RouterLink>
      </nav>
      <div class="flex flex-col gap-2 border-t border-white/15 px-5 pt-4">
        <RouterLink to="/professor/profile" class="text-sm text-white/90 no-underline">
          {{ auth.user?.fullName }}
        </RouterLink>
        <button
          class="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
          @click="logout"
        >
          Sair
        </button>
      </div>
    </aside>
    <main class="flex-1 overflow-x-auto p-4 md:p-7">
      <RouterView />
    </main>
  </div>
</template>
