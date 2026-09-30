import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration: number
  paused: boolean
}

interface Timer {
  handle: number
  startedAt: number
  remaining: number
}

const DEFAULT_DURATION = 6000

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  const timers = new Map<string, Timer>()

  function dismiss(id: string) {
    const timer = timers.get(id)
    if (timer) window.clearTimeout(timer.handle)
    timers.delete(id)
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function schedule(id: string, remaining: number) {
    timers.set(id, {
      handle: window.setTimeout(() => dismiss(id), remaining),
      startedAt: Date.now(),
      remaining,
    })
  }

  function setPaused(id: string, paused: boolean) {
    const toast = toasts.value.find((t) => t.id === id)
    if (toast) toast.paused = paused
  }

  function pause(id: string) {
    const timer = timers.get(id)
    if (!timer) return
    window.clearTimeout(timer.handle)
    timer.remaining -= Date.now() - timer.startedAt
    setPaused(id, true)
  }

  function resume(id: string) {
    const timer = timers.get(id)
    if (!timer) return
    schedule(id, Math.max(timer.remaining, 0))
    setPaused(id, false)
  }

  function push(input: { type: ToastType; message: string; title?: string; duration?: number }) {
    const id = crypto.randomUUID()
    const duration = input.duration ?? DEFAULT_DURATION
    toasts.value = [
      ...toasts.value,
      { id, type: input.type, title: input.title, message: input.message, duration, paused: false },
    ]
    if (duration > 0) schedule(id, duration)
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

  return { toasts, push, dismiss, pause, resume, success, error, info, warning }
})
