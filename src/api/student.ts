import type { StudentExam, StudentGrade, StudentGradeDetail } from '@/types'
import { apiFetch } from '@/shared/api/client'

export const studentApi = {
  exams: () => apiFetch<StudentExam[]>('/student/exams'),
  grades: () => apiFetch<StudentGrade[]>('/student/grades'),
  gradeDetail: (applicationId: string) => apiFetch<StudentGradeDetail>(`/student/grades/${applicationId}`),
}
