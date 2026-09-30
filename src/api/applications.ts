import type {
  AnswerKey,
  Application,
  ApplicationDetail,
  ApplicationSummary,
  Correction,
  ExamAssignment,
  ExamVersion,
  PdfGenerationConfig,
} from '@/types'
import { apiFetch } from '@/shared/api/client'

export const applicationsApi = {
  list: () => apiFetch<ApplicationSummary[]>('/applications'),
  get: (id: string) => apiFetch<ApplicationDetail>(`/applications/${id}`),
  create: (body: { examId: string; classId: string }) =>
    apiFetch<Application>('/applications', { method: 'POST', body }),
  generatePdf: (id: string, body: PdfGenerationConfig) =>
    apiFetch<Application>(`/applications/${id}/pdf`, { method: 'POST', body }),
  versions: (id: string) => apiFetch<ExamVersion[]>(`/applications/${id}/versions`),
  assignments: (id: string) => apiFetch<ExamAssignment[]>(`/applications/${id}/assignments`),
  publishAnswerKey: (id: string, versionId?: string) =>
    apiFetch<ExamVersion[]>(`/applications/${id}/answer-key/publish`, { method: 'POST', body: { versionId } }),
  corrections: (id: string) => apiFetch<Correction[]>(`/applications/${id}/corrections`),
  assignCorrection: (id: string, correctionId: string, body: { studentId: string; notes?: string }) =>
    apiFetch<Correction>(`/applications/${id}/corrections/${correctionId}/assign`, { method: 'POST', body }),
  publicAnswerKey: (publicCode: string) => apiFetch<AnswerKey>(`/answer-keys/${encodeURIComponent(publicCode)}`),
}
