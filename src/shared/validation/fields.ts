import { z } from 'zod'

function REQUIRED(field: string) {
  return `O campo ${field} é obrigatório`
}

export const emailSchema = z.email('E-mail inválido').min(1, REQUIRED('e-mail'))
export const passwordSchema = z.string().min(8, REQUIRED('senha'))
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

export const passwordMatchRefine = {
  check: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  options: {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  },
}
