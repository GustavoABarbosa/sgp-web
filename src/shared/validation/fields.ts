import { z } from 'zod'
import type { UserRole } from '@/types'

function REQUIRED(field: string) {
  return `O campo ${field} é obrigatório`
}

export const STUDENT_EMAIL_DOMAIN = '@catolicasc.edu.br'
export const TEACHER_EMAIL_DOMAIN = '@catolicasc.org.br'
export const EMAIL_DOMAINS = [TEACHER_EMAIL_DOMAIN, STUDENT_EMAIL_DOMAIN] as const

export const emailSchema = z.email('E-mail inválido').min(1, REQUIRED('e-mail'))
export const passwordSchema = z.string().min(8, 'Mínimo de 8 caracteres')
export const fullNameSchema = z
  .string()
  .trim()
  .min(1, REQUIRED('nome completo'))
  .refine(
    (value) => {
      const parts = value.split(/\s+/).filter(Boolean)
      return parts.length >= 2 && parts.every((part) => part.length >= 2)
    },
    { message: 'Informe nome e sobrenome' },
  )

export function emailWithDomain(domain: string) {
  return emailSchema.refine((value) => value.endsWith(domain), {
    message: `E-mail deve ser do domínio ${domain}`,
  })
}

export function emailDomainForRole(role: UserRole) {
  return role === 'professor' ? TEACHER_EMAIL_DOMAIN : STUDENT_EMAIL_DOMAIN
}

export const passwordMatchRefine = {
  check: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  options: {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  },
}
