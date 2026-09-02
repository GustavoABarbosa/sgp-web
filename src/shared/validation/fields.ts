import { z } from 'zod'

function REQUIRED(field: string) {
  return `O campo ${field} é obrigatório`
}

export const emailSchema = z.email('E-mail inválido').min(1, REQUIRED('e-mail'))
export const passwordSchema = z.string().min(8, REQUIRED('senha'))
export const fullNameSchema = z.string().min(3, REQUIRED('nome completo'))

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
