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

const isActive = (path: string) => route.path.startsWith(path)
const navLinkClass = (path: string) =>
  [
    'rounded-lg px-1 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white/85 no-underline hover:bg-white/15 hover:text-white',
    isActive(path) ? 'bg-white/15 text-white' : '',
  ].join(' ')

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen">
    <header
      class="sticky top-0 z-50 flex flex-wrap items-center gap-4 bg-primary px-4 py-3 text-white shadow-sm md:gap-6 md:px-6"
    >
      <div class="flex items-center gap-2">
        <CatolicaIcon class="h-8 text-white" aria-hidden="true" />
        <span class="hidden md:inline">SGP Aluno</span>
      </div>
      <nav aria-label="Navegação principal" class="flex flex-1 gap-1">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :class="navLinkClass(link.to)"
          :aria-current="isActive(link.to) ? 'page' : undefined"
        >
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
    <main id="main-content" tabindex="-1" class="mx-auto max-w-4xl p-4 focus:outline-none md:p-7">
      <RouterView />
    </main>
  </div>
</template>
