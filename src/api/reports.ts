import type { ApplicationReport, ConsolidatedReport, ProfessorSummary } from '@/types'
import { apiFetch } from '@/shared/api/client'

export const reportsApi = {
  application: (id: string) => apiFetch<ApplicationReport>(`/reports/applications/${id}`),
  consolidated: (filters: { classId?: string; subject?: string; term?: string }) =>
    apiFetch<ConsolidatedReport>('/reports/consolidated', { query: filters }),
  summary: () => apiFetch<ProfessorSummary>('/dashboard/summary'),
}
