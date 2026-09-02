<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

defineProps<{
  name: string
  profileTo: string
}>()

const emit = defineEmits<{
  logout: []
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

onClickOutside(root, () => {
  open.value = false
})

function close() {
  open.value = false
}

function onLogout() {
  close()
  emit('logout')
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/90 hover:bg-white/15 hover:text-white"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="open = !open"
    >
      <Icon name="ph:user-circle" class="size-6 shrink-0" />
      <span class="hidden sm:block max-w-40 truncate" :title="name">{{ name }}</span>
      <Icon
        name="ph:caret-down-bold"
        class="hidden sm:block size-4 shrink-0 opacity-80 transition-transform"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute right-0 z-50 mt-2 min-w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 text-text shadow-lg"
    >
      <RouterLink
        :to="profileTo"
        role="menuitem"
        class="flex items-center gap-2 px-3 py-2 text-sm text-text no-underline hover:bg-page"
        @click="close"
      >
        <Icon name="ph:user-circle" class="size-4" />
        Conta
      </RouterLink>
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-page"
        @click="onLogout"
      >
        <Icon name="ph:sign-out" class="size-4" />
        Sair
      </button>
    </div>
  </div>
</template>
