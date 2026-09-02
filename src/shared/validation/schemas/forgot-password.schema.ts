import { z } from 'zod'
import { emailSchema } from '../fields'

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
