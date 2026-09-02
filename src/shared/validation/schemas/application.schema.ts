import { z } from 'zod'

export const applicationFormSchema = z.object({
  examId: z.string().min(1, 'Selecione uma prova'),
  classId: z.string().min(1, 'Selecione uma turma'),
})

export type ApplicationFormInput = z.infer<typeof applicationFormSchema>
