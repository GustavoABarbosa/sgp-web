import { computed } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { errorMessage } from '@/shared/api/client'

export function useResource<T>(fetcher: () => Promise<T>, fallbackError = 'Erro ao carregar dados') {
  const { state, isLoading, error, execute } = useAsyncState<T | null>(fetcher, null, { resetOnExecute: false })

  return {
    data: state,
    isLoading,
    error: computed(() => (error.value ? errorMessage(error.value, fallbackError) : '')),
    reload: () => execute(),
  }
}
