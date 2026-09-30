import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthSession, User, UserRole } from '@/types'
import { authApi } from '@/api/auth'
import { refreshSession } from '@/shared/api/client'
import { session } from '@/shared/api/session'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isProfessor = computed(() => user.value?.role === 'professor')
  const isStudent = computed(() => user.value?.role === 'estudante')
  const homePath = computed(() => (isProfessor.value ? '/professor/dashboard' : '/aluno/dashboard'))

  function startSession(data: AuthSession) {
    session.set(data)
    user.value = data.user
  }

  function clear() {
    session.clear()
    user.value = null
  }

  async function init() {
    if (!(await refreshSession())) return
    try {
      user.value = await authApi.me()
    } catch {
      clear()
    }
  }

  async function login(email: string, password: string) {
    startSession(await authApi.login({ email, password }))
  }

  async function register(data: { role: UserRole; fullName: string; email: string; password: string }) {
    startSession(await authApi.register(data))
  }

  /** The local session always ends; revoking the refresh token on the server is best effort. */
  async function logout() {
    const refreshToken = session.refreshToken
    clear()
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {})
  }

  async function logoutAll() {
    await authApi.logoutAll()
    clear()
  }

  async function anonymize() {
    await authApi.anonymize()
    clear()
  }

  return {
    user,
    isAuthenticated,
    isProfessor,
    isStudent,
    homePath,
    init,
    login,
    register,
    startSession,
    logout,
    logoutAll,
    anonymize,
    clear,
  }
})
