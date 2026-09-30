import type { AuthTokens } from '@/types'

const REFRESH_KEY = 'sgp-refresh-token'

let accessToken: string | null = null

export const session = {
  get accessToken() {
    return accessToken
  },
  get refreshToken() {
    return localStorage.getItem(REFRESH_KEY)
  },
  set(tokens: AuthTokens) {
    accessToken = tokens.accessToken
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  },
  clear() {
    accessToken = null
    localStorage.removeItem(REFRESH_KEY)
  },
}
