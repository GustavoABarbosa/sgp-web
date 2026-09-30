import type { Class, ClassStudent } from '@/types'
import { apiFetch } from '@/shared/api/client'

export type ClassInput = Pick<Class, 'name' | 'subject' | 'term'>

export interface ClassQuery {
  status?: Class['status'] | ''
  name?: string
  subject?: string
  term?: string
}

export const classesApi = {
  list: (query: ClassQuery = {}) => apiFetch<Class[]>('/classes', { query: { ...query } }),
  get: (id: string) => apiFetch<Class>(`/classes/${id}`),
  create: (body: ClassInput) => apiFetch<Class>('/classes', { method: 'POST', body }),
  update: (id: string, body: ClassInput) => apiFetch<Class>(`/classes/${id}`, { method: 'PATCH', body }),
  archive: (id: string) => apiFetch<Class>(`/classes/${id}/archive`, { method: 'POST' }),
  students: (id: string) => apiFetch<ClassStudent[]>(`/classes/${id}/students`),
  enroll: (id: string, email: string) =>
    apiFetch<ClassStudent>(`/classes/${id}/students`, { method: 'POST', body: { email } }),
  removeStudent: (id: string, studentId: string) =>
    apiFetch<void>(`/classes/${id}/students/${studentId}`, { method: 'DELETE' }),
  regenerateInviteCode: (id: string) => apiFetch<Class>(`/classes/${id}/invite-code`, { method: 'POST' }),
}
