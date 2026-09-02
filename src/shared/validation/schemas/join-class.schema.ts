import { z } from 'zod'
import { emailWithDomain, fullNameSchema, passwordSchema } from '../fields'

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

    const nameResult = fullNameSchema.safeParse(data.fullName)
    if (!nameResult.success) {
      ctx.addIssue({
        code: 'custom',
        message: nameResult.error.issues[0]?.message ?? 'Informe nome e sobrenome',
        path: ['fullName'],
      })
    }

    const passwordResult = passwordSchema.safeParse(data.password)
    if (!passwordResult.success) {
      ctx.addIssue({
        code: 'custom',
        message: passwordResult.error.issues[0]?.message ?? 'Senha inválida',
        path: ['password'],
      })
    }
  })

export type JoinClassInput = z.infer<typeof joinClassSchema>
