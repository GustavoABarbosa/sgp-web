import { z } from 'zod'
import type { UserRole } from '@/types'
import {
  emailWithDomain,
  fullNameSchema,
  passwordMatchRefine,
  passwordSchema,
} from '../fields'

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
