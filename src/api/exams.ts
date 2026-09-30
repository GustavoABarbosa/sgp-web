import type { Exam } from '@/types'
import { apiFetch } from '@/shared/api/client'

export type ExamInput = Pick<Exam, 'title' | 'description' | 'questions'>

export const examsApi = {
  list: (status?: Exam['status']) => apiFetch<Exam[]>('/exams', { query: { status } }),
  get: (id: string) => apiFetch<Exam>(`/exams/${id}`),
  create: (body: ExamInput) => apiFetch<Exam>('/exams', { method: 'POST', body }),
  update: (id: string, body: ExamInput) => apiFetch<Exam>(`/exams/${id}`, { method: 'PUT', body }),
  archive: (id: string) => apiFetch<Exam>(`/exams/${id}/archive`, { method: 'POST' }),
}
