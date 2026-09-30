import type { AuthSession, JoinClassResult, User, UserRole } from '@/types'
import { apiFetch } from '@/shared/api/client'

export const authApi = {
  register: (body: { role: UserRole; fullName: string; email: string; password: string }) =>
    apiFetch<AuthSession>('/auth/register', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    apiFetch<AuthSession>('/auth/login', { method: 'POST', body }),
  logout: (refreshToken: string) => apiFetch<void>('/auth/logout', { method: 'POST', body: { refreshToken } }),
  logoutAll: () => apiFetch<void>('/auth/logout-all', { method: 'POST' }),
  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', { method: 'POST', body: { token, password } }),
  me: () => apiFetch<User>('/auth/me'),
  anonymize: () => apiFetch<void>('/auth/anonymize', { method: 'POST' }),
  joinClass: (body: { inviteCode: string; email?: string; fullName?: string; password?: string }) =>
    apiFetch<JoinClassResult>('/join', { method: 'POST', body }),
}
