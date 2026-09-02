import { z } from 'zod'
import { emailWithDomain } from '../fields'

export const joinClassSchema = z
  .object({
    inviteCode: z
      .string()
      .trim()
      .min(1, 'Informe o código de convite')
      .transform((value) => value.toUpperCase()),
    email: emailWithDomain('@catolicasc.edu.br'),
    fullName: z.string(),
    password: z.string(),
    needsRegister: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.needsRegister) return

    const fullName = data.fullName.trim()
    if (fullName.length < 3) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nome deve ter no mínimo 3 caracteres',
        path: ['fullName'],
      })
    }

    if (data.password.length < 8) {
      ctx.addIssue({
        code: 'custom',
        message: 'Senha deve ter no mínimo 8 caracteres',
        path: ['password'],
      })
    }
  })

export type JoinClassInput = z.infer<typeof joinClassSchema>
