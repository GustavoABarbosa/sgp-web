import type { Paginated, Question } from '@/types'
import { apiFetch } from '@/shared/api/client'

export type QuestionInput = Omit<Question, 'id' | 'teacherId' | 'deletedAt'>

export interface QuestionQuery {
  type?: Question['type'] | ''
  tag?: string
  tags?: string[]
  search?: string
  ids?: string[]
  page?: number
  limit?: number
}

export const questionsApi = {
  list: (query: QuestionQuery = {}) => apiFetch<Paginated<Question>>('/questions', { query: { ...query } }),
  tags: () => apiFetch<string[]>('/questions/tags'),
  get: (id: string) => apiFetch<Question>(`/questions/${id}`),
  create: (body: QuestionInput) => apiFetch<Question>('/questions', { method: 'POST', body }),
  update: (id: string, body: QuestionInput) => apiFetch<Question>(`/questions/${id}`, { method: 'PUT', body }),
  remove: (id: string) => apiFetch<void>(`/questions/${id}`, { method: 'DELETE' }),
}
