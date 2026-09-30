<script setup lang="ts">
import DropdownMenu from './DropdownMenu.vue'
import MenuItem from './MenuItem.vue'

defineProps<{
  name: string
  profileTo: string
}>()

const emit = defineEmits<{
  logout: []
}>()
</script>

<template>
  <DropdownMenu label="Menu da conta" menu-class="min-w-44" :offset="8">
    <template #trigger="{ open, triggerAttrs }">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/90 hover:bg-white/15 hover:text-white"
        :aria-label="`Menu da conta de ${name}`"
        v-bind="triggerAttrs"
      >
        <Icon name="ph:user-circle" class="size-6 shrink-0" />
        <span class="hidden sm:block max-w-40 truncate" :title="name">{{ name }}</span>
        <Icon
          name="ph:caret-down-bold"
          class="hidden sm:block size-4 shrink-0 opacity-80 transition-transform"
          :class="{ 'rotate-180': open }"
        />
      </button>
    </template>
    <MenuItem :to="profileTo" icon="ph:user-circle">Conta</MenuItem>
    <MenuItem icon="ph:sign-out" danger @select="emit('logout')">Sair</MenuItem>
  </DropdownMenu>
</template>
