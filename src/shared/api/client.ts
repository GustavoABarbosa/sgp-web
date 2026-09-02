/**
 * HTTP client for future real API integration.
 * Set VITE_USE_MOCKS=false and configure VITE_API_BASE_URL when backend is ready.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 429) {
    const retry = res.headers.get('Retry-After')
    throw new Error(`Muitas requisições. Tente novamente${retry ? ` em ${retry}s` : ''}.`)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `Erro ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export { BASE_URL }
