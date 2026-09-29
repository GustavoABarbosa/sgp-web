<script setup lang="ts">
import { ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { onClickOutside, onKeyStroke } from "@vueuse/core";
import { useAuthStore } from "@/stores/auth";
import CatolicaIcon from "@/components/CatolicaIcon.vue";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const menuOpen = ref(false);
const sidebar = ref<HTMLElement | null>(null);

const links = [
  { to: "/professor/dashboard", label: "Início" },
  { to: "/professor/questions", label: "Questões" },
  { to: "/professor/classes", label: "Turmas" },
  { to: "/professor/exams", label: "Provas" },
  { to: "/professor/applications", label: "Aplicações" },
  { to: "/professor/reports", label: "Relatórios" },
];

const navLinkClass = (path: string) =>
  [
    "text-white/85 no-underline px-5 py-2.5 text-sm transition-colors hover:bg-white/10 hover:text-white",
    route.path.startsWith(path) ? "bg-white/10 text-white" : "",
  ].join(" ");

async function logout() {
  await auth.logout();
  router.push("/login");
}

watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
);
onClickOutside(sidebar, () => (menuOpen.value = false));
onKeyStroke("Escape", () => (menuOpen.value = false));
</script>

<template>
  <div class="flex h-screen flex-col md:flex-row">
    <aside ref="sidebar" class="relative z-40 flex w-full shrink-0 flex-col bg-primary text-white md:w-60 md:py-5">
      <div class="flex items-center gap-2 px-5 py-3 md:mb-3 md:border-b md:border-white/15 md:pb-5 md:pt-0">
        <CatolicaIcon class="h-8 text-white" />
        <div class="flex-1">
          <strong class="block text-lg">SGP Católica</strong>
          <small class="text-xs opacity-75">Área do Professor</small>
        </div>
        <button
          type="button"
          class="rounded-lg p-1.5 hover:bg-white/10 md:hidden"
          :aria-expanded="menuOpen"
          aria-controls="professor-menu"
          :title="menuOpen ? 'Fechar menu' : 'Abrir menu'"
          @click="menuOpen = !menuOpen"
        >
          <Icon :name="menuOpen ? 'ph:x' : 'ph:list'" class="size-6" />
        </button>
      </div>
      <div
        id="professor-menu"
        class="absolute inset-x-0 top-full flex-col border-t border-white/15 bg-primary pb-4 shadow-lg md:static md:flex md:flex-1 md:border-t-0 md:pb-0 md:shadow-none"
        :class="menuOpen ? 'flex' : 'hidden'"
      >
        <nav class="flex flex-col py-2 md:flex-1 md:py-0">
          <RouterLink v-for="link in links" :key="link.to" :to="link.to" :class="navLinkClass(link.to)">
            {{ link.label }}
          </RouterLink>
        </nav>
        <div class="flex flex-col gap-2 border-t border-white/15 px-5 pt-4">
          <RouterLink to="/professor/profile" class="text-sm text-white/90 no-underline">
            {{ auth.user?.fullName }}
          </RouterLink>
          <button
            class="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-page"
            @click="logout"
          >
            Sair
          </button>
        </div>
      </div>
    </aside>
    <main class="flex-1 overflow-x-auto p-4 md:p-7">
      <RouterView />
    </main>
  </div>
</template>
