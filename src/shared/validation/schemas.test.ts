import { describe, expect, it } from 'vitest'
import {
  forgotPasswordSchema,
  joinClassSchema,
  loginSchema,
  parseTags,
  questionFormSchema,
  registerSchema,
  resetPasswordSchema,
} from './schemas'
import { passwordSchema } from './fields'

describe('auth schemas', () => {
  it('accepts valid login', () => {
    const result = loginSchema.safeParse({
      email: 'prof@catolicasc.org.br',
      password: 'secret',
    })
    expect(result.success).toBe(true)
  })

  it('rejects login without password', () => {
    const result = loginSchema.safeParse({ email: 'prof@catolicasc.org.br', password: '' })
    expect(result.success).toBe(false)
  })

  it('validates professor email domain on register', () => {
    const result = registerSchema('professor').safeParse({
      fullName: 'Professor Teste',
      email: 'prof@catolicasc.edu.br',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(false)
  })

  it('rejects register with only one name', () => {
    const result = registerSchema('estudante').safeParse({
      fullName: 'Aluno',
      email: 'aluno@catolicasc.edu.br',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(false)
  })

  it('accepts student register with matching passwords', () => {
    const result = registerSchema('estudante').safeParse({
      fullName: 'Aluno Teste',
      email: 'aluno@catolicasc.edu.br',
      password: 'senha1234',
      confirmPassword: 'senha1234',
    })
    expect(result.success).toBe(true)
  })

  it('rejects register when passwords differ', () => {
    const result = registerSchema('estudante').safeParse({
      fullName: 'Aluno Teste',
      email: 'aluno@catolicasc.edu.br',
      password: 'senha1234',
      confirmPassword: 'outrasenha',
    })
    expect(result.success).toBe(false)
  })

  it('validates forgot password email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'invalid' }).success).toBe(false)
    expect(forgotPasswordSchema.safeParse({ email: 'user@catolicasc.edu.br' }).success).toBe(true)
  })

  it('validates reset password length and match', () => {
    expect(
      resetPasswordSchema.safeParse({ password: 'curta', confirmPassword: 'curta' }).success,
    ).toBe(false)
    expect(
      resetPasswordSchema.safeParse({ password: 'senha1234', confirmPassword: 'senha1234' }).success,
    ).toBe(true)
  })
})

describe('questionFormSchema', () => {
  const base = {
    statement: 'Enunciado',
    tags: '',
    maxScore: 5,
    alternatives: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ],
    correctAlternativeId: 'a',
  }

  it('accepts a valid objective question', () => {
    expect(questionFormSchema.safeParse({ ...base, type: 'objetiva' }).success).toBe(true)
  })

  it('requires a correct alternative for objective questions', () => {
    const result = questionFormSchema.safeParse({ ...base, type: 'objetiva', correctAlternativeId: '' })
    expect(result.success).toBe(false)
  })

  it('ignores alternatives for discursive questions', () => {
    const result = questionFormSchema.safeParse({ ...base, type: 'discursiva', alternatives: [] })
    expect(result.success).toBe(true)
  })

  it('rejects a discursive question below the minimum score', () => {
    expect(questionFormSchema.safeParse({ ...base, type: 'discursiva', maxScore: 0 }).success).toBe(false)
  })

  it('parses and deduplicates tags', () => {
    expect(parseTags(' a, b,,a ')).toEqual(['a', 'b'])
  })
})

describe('passwordSchema', () => {
  it('explains the minimum length', () => {
    const result = passwordSchema.safeParse('curta')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Mínimo de 8 caracteres')
  })
})

describe('joinClassSchema', () => {
  it('requires registration fields when needsRegister is true', () => {
    const result = joinClassSchema.safeParse({
      inviteCode: 'web2026a',
      email: 'aluno@catolicasc.edu.br',
      needsRegister: true,
    })
    expect(result.success).toBe(false)
  })

  it('uppercases invite code on success', () => {
    const result = joinClassSchema.safeParse({
      inviteCode: 'web2026a',
      email: 'aluno@catolicasc.edu.br',
      fullName: 'Novo Aluno',
      password: 'senha1234',
      needsRegister: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.inviteCode).toBe('WEB2026A')
    }
  })
})
