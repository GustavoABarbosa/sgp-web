import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '@/types'
import { mockApi, isApiError } from '@/mock/mockApi'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isProfessor = computed(() => user.value?.role === 'professor')
  const isStudent = computed(() => user.value?.role === 'estudante')

  function clearError() {
    error.value = null
  }

  async function init() {
    mockApi.restoreSession()
    const current = mockApi.getCurrentUser()
    if (current) user.value = current
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const res = await mockApi.login(email, password)
      user.value = res.user
    } catch (e) {
      error.value = isApiError(e) ? e.message : 'Erro ao fazer login'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(data: {
    role: UserRole
    fullName: string
    email: string
    password: string
  }) {
    loading.value = true
    error.value = null
    try {
      const res = await mockApi.register(data)
      user.value = res.user
    } catch (e) {
      error.value = isApiError(e) ? e.message : 'Erro ao cadastrar'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await mockApi.logout()
    user.value = null
  }

  async function logoutAll() {
    await mockApi.logoutAll()
    user.value = null
  }

  async function refreshProfile() {
    user.value = await mockApi.me()
  }

  async function anonymize() {
    await mockApi.anonymize()
    user.value = null
  }

  function setUser(u: User) {
    user.value = u
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isProfessor,
    isStudent,
    clearError,
    init,
    login,
    register,
    logout,
    logoutAll,
    refreshProfile,
    anonymize,
    setUser,
  }
})
