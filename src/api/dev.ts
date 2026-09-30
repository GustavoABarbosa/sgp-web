import { apiFetch } from '@/shared/api/client'

export const devApi = {
  resetMockData: () => apiFetch<void>('/__mock/reset', { method: 'POST' }),
}
