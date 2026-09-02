import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration: number
}

const DEFAULT_DURATION = 6000

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function push(input: {
    type: ToastType
    message: string
    title?: string
    duration?: number
  }) {
    const id = crypto.randomUUID()
    const duration = input.duration ?? DEFAULT_DURATION
    const toast: Toast = {
      id,
      type: input.type,
      title: input.title,
      message: input.message,
      duration,
    }

    toasts.value = [...toasts.value, toast]

    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration)
    }

    return id
  }

  function success(message: string, title = 'Sucesso') {
    return push({ type: 'success', message, title })
  }

  function error(message: string, title = 'Erro') {
    return push({ type: 'error', message, title })
  }

  function info(message: string, title = 'Informação') {
    return push({ type: 'info', message, title })
  }

  function warning(message: string, title = 'Atenção') {
    return push({ type: 'warning', message, title })
  }

  return { toasts, push, dismiss, success, error, info, warning }
})
