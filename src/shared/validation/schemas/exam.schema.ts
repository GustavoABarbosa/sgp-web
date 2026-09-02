import { z } from 'zod'

export const examFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título'),
  description: z.string().optional(),
  questions: z
    .array(
      z.object({
        questionId: z.string(),
        order: z.number(),
        score: z.number(),
      }),
    )
    .min(1, 'Adicione ao menos uma questão')
    .max(20, 'Máximo de 20 questões'),
})

export type ExamFormInput = z.infer<typeof examFormSchema>
