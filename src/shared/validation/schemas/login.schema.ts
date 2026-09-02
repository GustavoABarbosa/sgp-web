import { z } from 'zod'
import { emailSchema } from '../fields'

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
})

export type LoginInput = z.infer<typeof loginSchema>
