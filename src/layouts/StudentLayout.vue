<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CatolicaIcon from '@/components/CatolicaIcon.vue'
import UserMenu from '@/components/UserMenu.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const links = [
  { to: '/aluno/dashboard', label: 'Início' },
  { to: '/aluno/exams', label: 'Provas' },
  { to: '/aluno/grades', label: 'Notas' },
]

const navLinkClass = (path: string) =>
  [
    'rounded-lg px-3 py-1.5 text-sm text-white/85 no-underline hover:bg-white/15 hover:text-white',
    route.path.startsWith(path) ? 'bg-white/15 text-white' : '',
  ].join(' ')

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen">
    <header class="flex flex-wrap items-center gap-4 bg-primary px-6 py-3 text-white md:gap-6">
      <div class="flex items-center gap-2">
        <CatolicaIcon class="h-8 text-white" />
        <span class="hidden md:inline">SGP Aluno</span>
      </div>
      <nav class="flex flex-1 gap-1">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" :class="navLinkClass(link.to)">
          {{ link.label }}
        </RouterLink>
      </nav>
      <UserMenu
        v-if="auth.user"
        :name="auth.user.fullName"
        profile-to="/aluno/profile"
        @logout="logout"
      />
    </header>
    <main class="mx-auto max-w-4xl p-4 md:p-7">
      <RouterView />
    </main>
  </div>
</template>
