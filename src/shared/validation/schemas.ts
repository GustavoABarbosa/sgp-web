import { z } from 'zod'
import type { UserRole } from '@/types'
import {
  emailSchema,
  emailWithDomain,
  fullNameSchema,
  passwordMatchRefine,
  passwordSchema,
} from './fields'

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
})

export type LoginInput = z.infer<typeof loginSchema>

export function registerSchema(role: UserRole) {
  const domain = role === 'professor' ? '@catolicasc.org.br' : '@catolicasc.edu.br'

  return z
    .object({
      fullName: fullNameSchema,
      email: emailWithDomain(domain),
      password: passwordSchema,
      confirmPassword: z.string().min(1, 'Confirme a senha'),
    })
    .refine(passwordMatchRefine.check, passwordMatchRefine.options)
}

export type RegisterInput = z.infer<ReturnType<typeof registerSchema>>

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine(passwordMatchRefine.check, passwordMatchRefine.options)

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const joinClassSchema = z
  .object({
    inviteCode: z.string().trim().min(1, 'Informe o código de convite').transform((value) => value.toUpperCase()),
    email: emailWithDomain('@catolicasc.edu.br'),
    fullName: z.string().optional(),
    password: z.string().optional(),
    needsRegister: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.needsRegister) return

    const fullName = data.fullName?.trim() ?? ''
    if (fullName.length < 3) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nome deve ter no mínimo 3 caracteres',
        path: ['fullName'],
      })
    }

    const password = data.password ?? ''
    if (password.length < 8) {
      ctx.addIssue({
        code: 'custom',
        message: 'Senha deve ter no mínimo 8 caracteres',
        path: ['password'],
      })
    }
  })

export type JoinClassInput = z.infer<typeof joinClassSchema>

export const classFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da turma'),
  subject: z.string().trim().min(1, 'Informe a disciplina'),
  term: z.string().trim().min(1, 'Informe o período'),
})

export type ClassFormInput = z.infer<typeof classFormSchema>

export const applicationFormSchema = z.object({
  examId: z.string().min(1, 'Selecione uma prova'),
  classId: z.string().min(1, 'Selecione uma turma'),
})

export type ApplicationFormInput = z.infer<typeof applicationFormSchema>

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

const questionAlternativeSchema = z.object({
  id: z.string(),
  text: z.string().trim().min(1, 'Preencha o texto da alternativa'),
})

export const objectiveQuestionSchema = z
  .object({
    type: z.literal('objetiva'),
    statement: z.string().trim().min(1, 'Informe o enunciado'),
    tags: z.array(z.string()),
    alternatives: questionAlternativeSchema.array().min(2, 'Mínimo de 2 alternativas').max(5, 'Máximo de 5 alternativas'),
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
