import { describe, it, expect, beforeEach } from 'vitest'
import { mockApi } from '@/mock/mockApi'
import { DEMO_CREDENTIALS } from '@/mock/initialDb'

describe('mockApi auth', () => {
  beforeEach(() => {
    mockApi.reset()
  })

  it('logs in professor with demo credentials', async () => {
    const { user } = await mockApi.login(
      DEMO_CREDENTIALS.professor.email,
      DEMO_CREDENTIALS.professor.password,
    )
    expect(user.role).toBe('professor')
    expect(mockApi.getCurrentUser()?.email).toBe(DEMO_CREDENTIALS.professor.email)
  })

  it('rejects invalid credentials', async () => {
    await expect(mockApi.login('wrong@test.com', 'bad')).rejects.toMatchObject({ status: 401 })
  })

  it('registers student with valid domain', async () => {
    const res = await mockApi.register({
      role: 'estudante',
      fullName: 'Novo Aluno',
      email: 'novo@catolicasc.edu.br',
      password: 'senha1234',
    })
    expect(res.user.role).toBe('estudante')
  })
})

describe('mockApi exams flow', () => {
  beforeEach(async () => {
    mockApi.reset()
    await mockApi.login(DEMO_CREDENTIALS.professor.email, DEMO_CREDENTIALS.professor.password)
  })

  it('creates application and transitions exam to ready', async () => {
    const exams = await mockApi.listExams()
    const draft = exams.find((e) => e.status === 'draft')
    expect(draft).toBeTruthy()
    const app = await mockApi.createApplication(draft!.id, 'cls-001')
    expect(app.status).toBe('draft')
    const updated = await mockApi.getExam(draft!.id)
    expect(updated.status).toBe('ready')
  })
})
