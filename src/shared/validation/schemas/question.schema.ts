import { z } from 'zod'

export const MIN_ALTERNATIVES = 2
export const MAX_ALTERNATIVES = 5

export const questionFormSchema = z
  .object({
    type: z.enum(['objetiva', 'discursiva']),
    statement: z.string().trim().min(1, 'Informe o enunciado'),
    tags: z.string(),
    maxScore: z.number(),
    alternatives: z.array(z.object({ id: z.string(), text: z.string() })),
    correctAlternativeId: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'discursiva') {
      if (!(data.maxScore >= 0.5)) {
        ctx.addIssue({ code: 'custom', message: 'Pontuação mínima é 0,5', path: ['maxScore'] })
      }
      return
    }

    if (data.alternatives.length < MIN_ALTERNATIVES || data.alternatives.length > MAX_ALTERNATIVES) {
      ctx.addIssue({
        code: 'custom',
        message: `Informe de ${MIN_ALTERNATIVES} a ${MAX_ALTERNATIVES} alternativas`,
        path: ['alternatives'],
      })
    }
    if (data.alternatives.some((alt) => !alt.text.trim())) {
      ctx.addIssue({ code: 'custom', message: 'Preencha o texto da alternativa', path: ['alternatives'] })
    }
    if (!data.alternatives.some((alt) => alt.id === data.correctAlternativeId)) {
      ctx.addIssue({ code: 'custom', message: 'Selecione a alternativa correta', path: ['correctAlternativeId'] })
    }
  })

export type QuestionFormInput = z.infer<typeof questionFormSchema>

export function parseTags(input: string): string[] {
  return [...new Set(input.split(',').map((t) => t.trim()).filter(Boolean))]
}
