<script setup lang="ts">
import { inject } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { dropdownCloseKey } from './dropdown'

const props = defineProps<{
  to?: RouteLocationRaw
  icon?: string
  danger?: boolean
}>()

const emit = defineEmits<{ select: [] }>()
const closeMenu = inject(dropdownCloseKey, () => {})

const itemClass = [
  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm no-underline hover:bg-page focus-visible:bg-page focus-visible:outline-none',
  props.danger ? 'text-danger' : 'text-text',
]

function onSelect() {
  closeMenu()
  emit('select')
}
</script>

<template>
  <RouterLink v-if="to" :to="to" role="menuitem" tabindex="-1" :class="itemClass" @click="onSelect">
    <Icon v-if="icon" :name="icon" class="size-4" />
    <slot />
  </RouterLink>
  <button v-else type="button" role="menuitem" tabindex="-1" :class="itemClass" @click="onSelect">
    <Icon v-if="icon" :name="icon" class="size-4" />
    <slot />
  </button>
</template>
