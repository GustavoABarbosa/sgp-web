import { beforeEach, describe, expect, it } from 'vitest'
import type { User } from '@/types'
import * as backend from './backend'
import { DEMO_CREDENTIALS } from './demoCredentials'

function loginAs(role: 'professor' | 'estudante'): User {
  const { accessToken } = backend.login(DEMO_CREDENTIALS[role])
  return backend.authenticate(`Bearer ${accessToken}`)!
}

const otherTeacher = () => {
  const { accessToken } = backend.login({ email: 'professor2@catolicasc.org.br', password: 'senha1234' })
  return backend.authenticate(`Bearer ${accessToken}`)!
}

beforeEach(() => {
  backend.resetMockData()
})

describe('auth', () => {
  it('logs in with demo credentials and resolves the session from the access token', () => {
    const user = loginAs('professor')
    expect(user.email).toBe(DEMO_CREDENTIALS.professor.email)
  })

  it('rejects invalid credentials', () => {
    expect(() => backend.login({ email: 'x@y.com', password: 'bad' })).toThrow(backend.HttpError)
  })

  it('rotates refresh tokens and invalidates the previous access token', () => {
    const first = backend.login(DEMO_CREDENTIALS.professor)
    const second = backend.refresh({ refreshToken: first.refreshToken })
    expect(backend.authenticate(`Bearer ${first.accessToken}`)).toBeNull()
    expect(backend.authenticate(`Bearer ${second.accessToken}`)?.role).toBe('professor')
    expect(() => backend.refresh({ refreshToken: first.refreshToken })).toThrow()
  })

  it('does not reveal whether an email exists on forgot password', () => {
    const known = backend.forgotPassword({ email: DEMO_CREDENTIALS.professor.email })
    const unknown = backend.forgotPassword({ email: 'ninguem@catolicasc.org.br' })
    expect(known).toEqual(unknown)
  })

  it('registers a student with a valid domain', () => {
    const res = backend.register({
      role: 'estudante',
      fullName: 'Novo Aluno',
      email: 'novo@catolicasc.edu.br',
      password: 'senha1234',
    })
    expect(res.user.role).toBe('estudante')
  })
})

describe('ownership', () => {
  it('hides other teachers resources', () => {
    const other = otherTeacher()
    expect(() => backend.getClass(other, 'cls-001')).toThrow(/não encontrada/)
    expect(() => backend.listVersions(other, 'app-001')).toThrow(/não encontrada/)
    expect(() => backend.listCorrections(other, 'app-001', {})).toThrow(/não encontrada/)
    expect(() => backend.removeStudent(other, 'cls-001', 'usr-student-001')).toThrow(/não encontrada/)
    expect(() => backend.publishAnswerKey(other, 'app-001', {})).toThrow(/não encontrada/)
  })

  it('requires the student to be enrolled when assigning a correction', () => {
    const teacher = loginAs('professor')
    expect(() =>
      backend.assignCorrection(teacher, 'app-001', 'cor-002', { studentId: 'usr-student-012' }),
    ).toThrow(/matriculado/)
    const assigned = backend.assignCorrection(teacher, 'app-001', 'cor-002', { studentId: 'usr-student-004' })
    expect(assigned.studentId).toBe('usr-student-004')
  })
})

describe('exams and applications', () => {
  it('creates an application and moves the exam to ready', () => {
    const teacher = loginAs('professor')
    const draft = backend.listExams(teacher, { status: 'draft' })[0]!
    const app = backend.createApplication(teacher, { examId: draft.id, classId: 'cls-001' })
    expect(app.status).toBe('draft')
    expect(backend.getExam(teacher, draft.id).status).toBe('ready')
  })

  it('regenerating a PDF drops the previous assignments', () => {
    const teacher = loginAs('professor')
    const config = { versions: [{ shuffleQuestions: false, shuffleAlternatives: false, withStudentIdentification: true }] }
    backend.generatePdf(teacher, 'app-002', config)
    backend.generatePdf(teacher, 'app-002', config)
    const versions = backend.listVersions(teacher, 'app-002')
    const assignments = backend.listAssignments(teacher, 'app-002')
    expect(versions).toHaveLength(1)
    expect(assignments.every((a) => a.examVersionId === versions[0]!.id)).toBe(true)
  })

  it('limits the number of versions', () => {
    const teacher = loginAs('professor')
    const version = { shuffleQuestions: false, shuffleAlternatives: false, withStudentIdentification: false }
    expect(() => backend.generatePdf(teacher, 'app-002', { versions: [] })).toThrow()
    expect(() => backend.generatePdf(teacher, 'app-002', { versions: Array(11).fill(version) })).toThrow()
  })

  it('returns application summaries with exam and class names', () => {
    const [first] = backend.listApplications(loginAs('professor'))
    expect(first!.examTitle).toBeTruthy()
    expect(first!.className).toBeTruthy()
  })

  it('rejects changes to archived classes', () => {
    const teacher = loginAs('professor')
    expect(() => backend.updateClass(teacher, 'cls-003', { name: 'X', subject: 'Y', term: '2026/1' })).toThrow(
      /arquivada/,
    )
  })
})

describe('join by code', () => {
  it('asks an existing account to log in first', () => {
    expect(() => backend.joinByCode(null, { inviteCode: 'WEB2026A', email: DEMO_CREDENTIALS.estudante.email })).toThrow(
      expect.objectContaining({ code: 'LOGIN_REQUIRED' }),
    )
  })

  it('asks for account data when the email is new', () => {
    expect(() => backend.joinByCode(null, { inviteCode: 'WEB2026A', email: 'novo@catolicasc.edu.br' })).toThrow(
      expect.objectContaining({ code: 'ACCOUNT_REQUIRED' }),
    )
  })

  it('enrolls the logged-in student', () => {
    const student = loginAs('estudante')
    const result = backend.joinByCode(student, { inviteCode: 'ED2026B' })
    expect(result.user.id).toBe(student.id)
    expect(result.session).toBeNull()
  })
})

describe('reports', () => {
  it('computes stats', () => {
    expect(backend.computeStats([2, 4, 6])).toMatchObject({ mean: 4, median: 4, count: 3 })
    expect(backend.computeStats([])).toMatchObject({ mean: 0, median: 0, stdDev: 0, count: 0 })
  })

  it('buckets the distribution by percentage of the max score', () => {
    const report = backend.getApplicationReport(loginAs('professor'), 'app-001')
    const total = report.distribution.reduce((sum, b) => sum + b.count, 0)
    expect(total).toBe(report.grades.length)
    expect(report.distribution.map((b) => b.range)).toEqual(['0–39%', '40–69%', '70–89%', '90–100%'])
  })

  it('numbers the questions in the student grade detail', () => {
    const detail = backend.studentGradeDetail(loginAs('estudante'), 'app-001')
    expect(detail.results.map((r) => r.number)).toEqual([1, 2, 3, 4])
  })
})
