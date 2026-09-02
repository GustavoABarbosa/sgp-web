import { z } from 'zod'

export const classFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da turma'),
  subject: z.string().trim().min(1, 'Informe a disciplina'),
  term: z.string().trim().min(1, 'Informe o período'),
})

export type ClassFormInput = z.infer<typeof classFormSchema>
