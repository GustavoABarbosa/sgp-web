import { z } from 'zod'
import { passwordMatchRefine, passwordSchema } from '../fields'

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine(passwordMatchRefine.check, passwordMatchRefine.options)

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
