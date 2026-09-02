import { z } from 'zod'

const questionAlternativeSchema = z.object({
  id: z.string(),
  text: z.string().trim().min(1, 'Preencha o texto da alternativa'),
})

export const objectiveQuestionSchema = z
  .object({
    type: z.literal('objetiva'),
    statement: z.string().trim().min(1, 'Informe o enunciado'),
    tags: z.array(z.string()),
    alternatives: questionAlternativeSchema
      .array()
      .min(2, 'Mínimo de 2 alternativas')
      .max(5, 'Máximo de 5 alternativas'),
    correctAlternativeId: z.string().min(1, 'Selecione a alternativa correta'),
  })
  .refine(
    (data) => data.alternatives.some((alt) => alt.id === data.correctAlternativeId),
    { message: 'Selecione a alternativa correta', path: ['correctAlternativeId'] },
  )

export const discursiveQuestionSchema = z.object({
  type: z.literal('discursiva'),
  statement: z.string().trim().min(1, 'Informe o enunciado'),
  tags: z.array(z.string()),
  maxScore: z.number().min(0.5, 'Pontuação mínima é 0,5'),
})

export type ObjectiveQuestionInput = z.infer<typeof objectiveQuestionSchema>
export type DiscursiveQuestionInput = z.infer<typeof discursiveQuestionSchema>
