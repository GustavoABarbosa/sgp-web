import type { AuthSession } from '@/types'
import { API_BASE_URL } from '@/shared/env'
import { session } from './session'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message)
  }
}

export function errorMessage(e: unknown, fallback = 'Ocorreu um erro inesperado') {
  return e instanceof ApiError ? e.message : fallback
}

type Query = Record<string, string | number | boolean | string[] | undefined | null>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Query
}

let onUnauthorized: () => void = () => {}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_BASE_URL}${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length) url.searchParams.set(key, value.join(','))
    } else {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function send(path: string, options: RequestOptions) {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (session.accessToken) headers.Authorization = `Bearer ${session.accessToken}`
  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
}

async function toError(res: Response) {
  if (res.status === 429) {
    const retry = res.headers.get('Retry-After')
    return new ApiError(429, `Muitas requisições. Tente novamente${retry ? ` em ${retry}s` : ''}.`)
  }
  const body = await res.json().catch(() => ({}))
  return new ApiError(res.status, body.message ?? `Erro ${res.status}`, body.code)
}

let refreshing: Promise<boolean> | null = null

/** Rotates the refresh token. Concurrent callers share a single in-flight request. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = session.refreshToken
    if (!refreshToken) return false
    const res = await send('/auth/refresh', { method: 'POST', body: { refreshToken } })
    if (!res.ok) {
      session.clear()
      return false
    }
    const data = (await res.json()) as AuthSession
    session.set(data)
    return true
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options)

  if (res.status === 401 && session.accessToken) {
    if (await refreshSession()) {
      res = await send(path, options)
    } else {
      onUnauthorized()
    }
  }

  if (!res.ok) throw await toError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
