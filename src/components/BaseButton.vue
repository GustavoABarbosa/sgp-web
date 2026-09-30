<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger'
    size?: 'sm' | 'md'
    type?: 'button' | 'submit'
    to?: RouteLocationRaw
    href?: string
    icon?: string
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
  },
)

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-light',
  secondary: 'border border-border bg-surface text-text hover:bg-page',
  danger: 'bg-danger text-white hover:bg-red-700',
}

const SIZES = {
  sm: 'gap-1 px-2.5 py-1 text-xs',
  md: 'gap-1.5 px-4 py-2 text-sm',
}

const classes = computed(() => [
  'inline-flex items-center justify-center rounded-lg font-medium no-underline disabled:cursor-not-allowed disabled:opacity-55',
  VARIANTS[props.variant],
  SIZES[props.size],
  props.block && 'w-full',
])

const iconClass = computed(() => (props.size === 'sm' ? 'size-3.5' : 'size-4'))
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <Icon v-if="icon" :name="icon" :class="iconClass" />
    <slot />
  </RouterLink>
  <a v-else-if="href" :href="href" :class="classes">
    <Icon v-if="icon" :name="icon" :class="iconClass" />
    <slot />
  </a>
  <button v-else :type="type" :class="classes" :disabled="disabled || loading" :aria-busy="loading || undefined">
    <Icon v-if="loading" name="ph:spinner" :class="[iconClass, 'animate-spin']" />
    <Icon v-else-if="icon" :name="icon" :class="iconClass" />
    <slot />
  </button>
</template>
