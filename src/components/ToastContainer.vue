<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToastStore, type ToastType } from '@/stores/toast'

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)

const iconByType: Record<ToastType, string> = {
  success: 'ph:check-circle',
  error: 'ph:warning-circle',
  info: 'ph:info',
  warning: 'ph:warning',
}

const styleByType: Record<ToastType, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-primary/30 bg-primary/10 text-primary',
  warning: 'border-warning/30 bg-warning/10 text-warning',
}

const progressByType: Record<ToastType, string> = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-primary',
  warning: 'bg-warning',
}
</script>

<template>
  <div
    class="pointer-events-none fixed top-4 right-4 z-100 flex w-[min(100%-2rem,22rem)] flex-col gap-2"
    aria-live="polite"
    aria-relevant="additions"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto overflow-hidden rounded-lg bg-surface shadow-lg"
        role="status"
      >
        <div class="flex items-start gap-3 p-3">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-full border"
            :class="styleByType[toast.type]"
          >
            <Icon :name="iconByType[toast.type]" class="size-5" />
          </div>
          <div class="min-w-0 flex-1 pt-0.5">
            <p v-if="toast.title" class="text-sm font-semibold text-text">{{ toast.title }}</p>
            <p class="text-sm text-muted">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded p-1 text-muted hover:bg-page hover:text-text"
            aria-label="Fechar notificação"
            @click="toastStore.dismiss(toast.id)"
          >
            <Icon name="ph:x" class="size-4" />
          </button>
        </div>

        <div
          v-if="toast.duration > 0"
          class="h-1 bg-border/60"
          :aria-label="`Fecha em ${Math.round(toast.duration / 1000)} segundos`"
        >
          <div
            class="toast-unload h-full origin-left"
            :class="progressByType[toast.type]"
            :style="{ animationDuration: `${toast.duration}ms` }"
          />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(0.75rem);
}

.toast-move {
  transition: transform 0.2s ease;
}

.toast-unload {
  width: 100%;
  animation-name: toast-unload;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes toast-unload {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
