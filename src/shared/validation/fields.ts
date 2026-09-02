import { z } from 'zod'

export const emailSchema = z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido')

export const passwordSchema = z
  .string()
  .min(1, 'Informe a senha')
  .min(8, 'Senha deve ter no mínimo 8 caracteres')

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, 'Informe o nome completo')
  .min(3, 'Nome deve ter no mínimo 3 caracteres')

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
