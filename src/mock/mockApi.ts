import type {
  ApiError,
  Application,
  ApplicationReport,
  AuthTokens,
  Class,
  ClassEnrollment,
  ConsolidatedReport,
  Correction,
  Exam,
  ExamAssignment,
  ExamVersion,
  MockDb,
  Paginated,
  PdfGenerationConfig,
  Question,
  StudentExam,
  StudentGrade,
  StudentGradeDetail,
  User,
  UserRole,
  AnswerKey,
} from '@/types'
import { initialDb } from './initialDb'

const STORAGE_KEY = 'sgp-mock-db'

function loadDb(): MockDb {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as MockDb
    } catch {
      /* fall through */
    }
  }
  return structuredClone(initialDb)
}

function saveDb(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

function err(message: string, status = 400, code?: string): never {
  const error: ApiError = { message, status, code }
  throw error
}

function sanitizeUser(user: MockDb['users'][0]): User {
  const { password: _, ...rest } = user
  return rest
}

function getUserFromToken(token: string | null, db: MockDb): User | null {
  if (!token?.startsWith('access:')) return null
  const userId = token.slice(7)
  const user = db.users.find((u) => u.id === userId && !u.anonymizedAt)
  return user ? sanitizeUser(user) : null
}

function requireAuth(token: string | null, db: MockDb, role?: UserRole): User {
  const user = getUserFromToken(token, db)
  if (!user) err('Não autenticado', 401)
  if (role && user.role !== role) err('Acesso negado', 403)
  return user
}

function paginate<T>(items: T[], page = 1, limit = 20): Paginated<T> {
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
  }
}

function examMaxScore(exam: Exam, questions: Question[]) {
  return exam.questions.reduce((sum, eq) => {
    const q = questions.find((x) => x.id === eq.questionId)
    return sum + (eq.score ?? q?.maxScore ?? 0)
  }, 0)
}

class MockApi {
  private db = loadDb()
  private accessToken: string | null = null
  private refreshToken: string | null = null

  reset() {
    this.db = structuredClone(initialDb)
    saveDb(this.db)
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('sgp-access-token')
    localStorage.removeItem('sgp-refresh-token')
  }

  restoreSession() {
    this.accessToken = localStorage.getItem('sgp-access-token')
    this.refreshToken = localStorage.getItem('sgp-refresh-token')
  }

  private persistTokens(tokens: AuthTokens) {
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken
    localStorage.setItem('sgp-access-token', tokens.accessToken)
    localStorage.setItem('sgp-refresh-token', tokens.refreshToken)
  }

  private issueTokens(userId: string): AuthTokens {
    const accessToken = `access:${userId}`
    const refreshToken = `refresh:${uid('rt')}`
    this.db.refreshTokens.push({
      id: uid('rt-id'),
      userId,
      tokenHash: refreshToken,
      deviceInfo: navigator.userAgent.slice(0, 80),
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    })
    saveDb(this.db)
    return { accessToken, refreshToken }
  }

  getCurrentUser(): User | null {
    return getUserFromToken(this.accessToken, this.db)
  }

  async register(body: {
    role: UserRole
    fullName: string
    email: string
    password: string
  }): Promise<AuthTokens & { user: User }> {
    await delay()
    const domain = body.role === 'professor' ? '@catolicasc.org.br' : '@catolicasc.edu.br'
    if (!body.email.endsWith(domain)) err(`E-mail deve ser do domínio ${domain}`)
    if (body.password.length < 8) err('Senha deve ter no mínimo 8 caracteres')
    if (this.db.users.some((u) => u.email === body.email && !u.anonymizedAt)) {
      err('E-mail já cadastrado', 409)
    }
    const user = {
      id: uid('usr'),
      role: body.role,
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      createdAt: new Date().toISOString(),
    }
    this.db.users.push(user)
    saveDb(this.db)
    const tokens = this.issueTokens(user.id)
    this.persistTokens(tokens)
    return { ...tokens, user: sanitizeUser(user) }
  }

  async login(email: string, password: string): Promise<AuthTokens & { user: User }> {
    await delay()
    const user = this.db.users.find((u) => u.email === email && !u.anonymizedAt)
    if (!user || user.password !== password) err('Credenciais inválidas', 401)
    const tokens = this.issueTokens(user.id)
    this.persistTokens(tokens)
    return { ...tokens, user: sanitizeUser(user) }
  }

  async refresh(): Promise<AuthTokens> {
    await delay()
    const rt = this.db.refreshTokens.find(
      (t) => t.tokenHash === this.refreshToken && !t.revokedAt && new Date(t.expiresAt) > new Date(),
    )
    if (!rt) err('Refresh token inválido', 401)
    const tokens = this.issueTokens(rt.userId)
    rt.revokedAt = new Date().toISOString()
    saveDb(this.db)
    this.persistTokens(tokens)
    return tokens
  }

  async logout() {
    await delay()
    const rt = this.db.refreshTokens.find((t) => t.tokenHash === this.refreshToken)
    if (rt) rt.revokedAt = new Date().toISOString()
    saveDb(this.db)
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('sgp-access-token')
    localStorage.removeItem('sgp-refresh-token')
  }

  async logoutAll() {
    await delay()
    const user = requireAuth(this.accessToken, this.db)
    this.db.refreshTokens.forEach((t) => {
      if (t.userId === user.id && !t.revokedAt) t.revokedAt = new Date().toISOString()
    })
    saveDb(this.db)
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('sgp-access-token')
    localStorage.removeItem('sgp-refresh-token')
  }

  async forgotPassword(email: string) {
    await delay()
    const exists = this.db.users.some((u) => u.email === email)
    if (!exists) err('E-mail não encontrado', 404)
    return { message: 'E-mail de recuperação enviado (mock)' }
  }

  async resetPassword(_token: string, password: string) {
    await delay()
    if (password.length < 8) err('Senha deve ter no mínimo 8 caracteres')
    return { message: 'Senha redefinida (mock)' }
  }

  async me(): Promise<User> {
    await delay()
    return requireAuth(this.accessToken, this.db)
  }

  async anonymize() {
    await delay()
    const user = requireAuth(this.accessToken, this.db)
    const dbUser = this.db.users.find((u) => u.id === user.id)!
    dbUser.fullName = 'Usuário removido'
    dbUser.email = `anon-${user.id}@removido.local`
    dbUser.password = ''
    dbUser.anonymizedAt = new Date().toISOString()
    this.db.refreshTokens.forEach((t) => {
      if (t.userId === user.id) t.revokedAt = new Date().toISOString()
    })
    saveDb(this.db)
    await this.logout()
  }

  // Questions
  async listQuestions(params: {
    type?: string
    tag?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<Paginated<Question>> {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    let items = this.db.questions.filter((q) => q.teacherId === user.id && !q.deletedAt)
    if (params.type) items = items.filter((q) => q.type === params.type)
    if (params.tag) items = items.filter((q) => q.tags.includes(params.tag!))
    if (params.search) {
      const s = params.search.toLowerCase()
      items = items.filter((q) => q.statement.toLowerCase().includes(s))
    }
    return paginate(items, params.page, params.limit)
  }

  async createQuestion(data: Omit<Question, 'id' | 'teacherId' | 'deletedAt'>) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const q: Question = { ...data, id: uid('q'), teacherId: user.id }
    this.db.questions.push(q)
    saveDb(this.db)
    return q
  }

  async updateQuestion(id: string, data: Partial<Question>) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const q = this.db.questions.find((x) => x.id === id && x.teacherId === user.id)
    if (!q || q.deletedAt) err('Questão não encontrada', 404)
    Object.assign(q, data, { id, teacherId: user.id })
    saveDb(this.db)
    return q
  }

  async deleteQuestion(id: string) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const q = this.db.questions.find((x) => x.id === id && x.teacherId === user.id)
    if (!q) err('Questão não encontrada', 404)
    q.deletedAt = new Date().toISOString()
    saveDb(this.db)
  }

  // Classes
  async listClasses(status?: string): Promise<Class[]> {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    let items = this.db.classes.filter((c) => c.teacherId === user.id)
    if (status) items = items.filter((c) => c.status === status)
    return items
  }

  async createClass(data: { name: string; subject: string; term: string }) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const cls: Class = {
      id: uid('cls'),
      teacherId: user.id,
      ...data,
      status: 'active',
      inviteCode: crypto.randomUUID().slice(0, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
    }
    this.db.classes.push(cls)
    saveDb(this.db)
    return cls
  }

  async updateClass(id: string, data: Partial<Pick<Class, 'name' | 'subject' | 'term'>>) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const cls = this.db.classes.find((c) => c.id === id && c.teacherId === user.id)
    if (!cls) err('Turma não encontrada', 404)
    Object.assign(cls, data)
    saveDb(this.db)
    return cls
  }

  async archiveClass(id: string) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const cls = this.db.classes.find((c) => c.id === id && c.teacherId === user.id)
    if (!cls) err('Turma não encontrada', 404)
    cls.status = 'archived'
    saveDb(this.db)
    return cls
  }

  async listClassStudents(classId: string) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const cls = this.db.classes.find((c) => c.id === classId && c.teacherId === user.id)
    if (!cls) err('Turma não encontrada', 404)
    return this.db.enrollments
      .filter((e) => e.classId === classId && e.status === 'active')
      .map((e) => {
        const student = this.db.users.find((u) => u.id === e.studentId)!
        return {
          enrollment: e,
          student: sanitizeUser(student),
        }
      })
  }

  async enrollStudent(classId: string, email: string) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const cls = this.db.classes.find((c) => c.id === classId && c.teacherId === user.id)
    if (!cls) err('Turma não encontrada', 404)
    const student = this.db.users.find((u) => u.email === email && u.role === 'estudante')
    if (!student) err('Aluno não encontrado com este e-mail', 404)
    const existing = this.db.enrollments.find(
      (e) => e.classId === classId && e.studentId === student.id && e.status === 'active',
    )
    if (existing) return { enrollment: existing, student: sanitizeUser(student) }
    const enrollment: ClassEnrollment = {
      id: uid('enr'),
      classId,
      studentId: student.id,
      enrolledAt: new Date().toISOString(),
      status: 'active',
      enrolledVia: 'teacher',
    }
    this.db.enrollments.push(enrollment)
    saveDb(this.db)
    return { enrollment, student: sanitizeUser(student) }
  }

  async removeStudent(classId: string, studentId: string) {
    await delay()
    requireAuth(this.accessToken, this.db, 'professor')
    const enrollment = this.db.enrollments.find(
      (e) => e.classId === classId && e.studentId === studentId && e.status === 'active',
    )
    if (!enrollment) err('Matrícula não encontrada', 404)
    enrollment.status = 'removed'
    saveDb(this.db)
  }

  async getInviteCode(classId: string) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const cls = this.db.classes.find((c) => c.id === classId && c.teacherId === user.id)
    if (!cls) err('Turma não encontrada', 404)
    return { inviteCode: cls.inviteCode }
  }

  async regenerateInviteCode(classId: string) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const cls = this.db.classes.find((c) => c.id === classId && c.teacherId === user.id)
    if (!cls) err('Turma não encontrada', 404)
    cls.inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase()
    saveDb(this.db)
    return { inviteCode: cls.inviteCode }
  }

  async joinByCode(inviteCode: string, email: string, fullName?: string, password?: string) {
    await delay()
    const cls = this.db.classes.find((c) => c.inviteCode === inviteCode && c.status === 'active')
    if (!cls) err('Código de convite inválido', 404)
    let student = this.db.users.find((u) => u.email === email && u.role === 'estudante')
    let tokens: AuthTokens | null = null
    if (!student) {
      if (!fullName || !password) err('Conta não existe. Informe nome e senha para cadastro.')
      if (!email.endsWith('@catolicasc.edu.br')) err('E-mail deve ser @catolicasc.edu.br')
      if (password.length < 8) err('Senha deve ter no mínimo 8 caracteres')
      student = {
        id: uid('usr'),
        role: 'estudante',
        fullName,
        email,
        password,
        createdAt: new Date().toISOString(),
      }
      this.db.users.push(student)
      tokens = this.issueTokens(student.id)
      this.persistTokens(tokens)
    }
    const existing = this.db.enrollments.find(
      (e) => e.classId === cls.id && e.studentId === student!.id && e.status === 'active',
    )
    if (!existing) {
      this.db.enrollments.push({
        id: uid('enr'),
        classId: cls.id,
        studentId: student.id,
        enrolledAt: new Date().toISOString(),
        status: 'active',
        enrolledVia: 'invite_code',
      })
    }
    saveDb(this.db)
    return {
      class: cls,
      user: sanitizeUser(student),
      tokens,
      enrolled: true,
    }
  }

  // Exams
  async listExams(status?: string): Promise<Exam[]> {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    let items = this.db.exams.filter((e) => e.teacherId === user.id)
    if (status) items = items.filter((e) => e.status === status)
    return items
  }

  async getExam(id: string) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const exam = this.db.exams.find((e) => e.id === id && e.teacherId === user.id)
    if (!exam) err('Prova não encontrada', 404)
    return exam
  }

  async createExam(data: { title: string; description?: string; questions: Exam['questions'] }) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    if (data.questions.length > 20) err('Máximo de 20 questões por prova')
    const exam: Exam = {
      id: uid('exam'),
      teacherId: user.id,
      title: data.title,
      description: data.description,
      questions: data.questions,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    this.db.exams.push(exam)
    saveDb(this.db)
    return exam
  }

  async updateExam(id: string, data: Partial<Pick<Exam, 'title' | 'description' | 'questions'>>) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const exam = this.db.exams.find((e) => e.id === id && e.teacherId === user.id)
    if (!exam) err('Prova não encontrada', 404)
    if (exam.status === 'closed') err('Prova arquivada não pode ser editada')
    if (data.questions && data.questions.length > 20) err('Máximo de 20 questões')
    Object.assign(exam, data)
    saveDb(this.db)
    return exam
  }

  async archiveExam(id: string) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const exam = this.db.exams.find((e) => e.id === id && e.teacherId === user.id)
    if (!exam) err('Prova não encontrada', 404)
    exam.status = 'closed'
    saveDb(this.db)
    return exam
  }

  // Applications
  async listApplications(): Promise<Application[]> {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    return this.db.applications.filter((a) => a.teacherId === user.id)
  }

  async getApplication(id: string) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const app = this.db.applications.find((a) => a.id === id && a.teacherId === user.id)
    if (!app) err('Aplicação não encontrada', 404)
    return app
  }

  async createApplication(examId: string, classId: string) {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const exam = this.db.exams.find((e) => e.id === examId && e.teacherId === user.id)
    if (!exam) err('Prova não encontrada', 404)
    if (exam.status === 'closed') err('Prova arquivada não pode ser aplicada')
    const cls = this.db.classes.find((c) => c.id === classId && c.teacherId === user.id)
    if (!cls || cls.status !== 'active') err('Turma inválida ou arquivada')
    if (exam.status === 'draft') exam.status = 'ready'
    const app: Application = {
      id: uid('app'),
      examId,
      classId,
      teacherId: user.id,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    this.db.applications.push(app)
    saveDb(this.db)
    return app
  }

  async generatePdf(applicationId: string, config: PdfGenerationConfig) {
    await delay(600)
    const user = requireAuth(this.accessToken, this.db, 'professor')
    const app = this.db.applications.find((a) => a.id === applicationId && a.teacherId === user.id)
    if (!app) err('Aplicação não encontrada', 404)
    const hasConfirmed = this.db.corrections.some(
      (c) => c.applicationId === applicationId && c.syncStatus === 'synced',
    )
    if (hasConfirmed && app.status === 'generated') {
      err('Não é possível regenerar: já existem correções confirmadas. Crie uma nova aplicação.')
    }
    this.db.examVersions = this.db.examVersions.filter((v) => v.applicationId !== applicationId)
    this.db.examAssignments = this.db.examAssignments.filter((a) => {
      const ver = this.db.examVersions.find((v) => v.id === a.examVersionId)
      return !ver || ver.applicationId !== applicationId
    })
    const exam = this.db.exams.find((e) => e.id === app.examId)!
    config.versions.forEach((v, i) => {
      const version: ExamVersion = {
        id: uid('ver'),
        applicationId,
        versionNumber: i + 1,
        shuffleQuestions: v.shuffleQuestions,
        shuffleAlternatives: v.shuffleAlternatives,
        withStudentIdentification: v.withStudentIdentification,
        layout: {
          questionOrder: exam.questions.map((q) => q.questionId),
          alternativeOrder: [],
        },
        answerKeyPublished: false,
        publicCode: `GAB-V${i + 1}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      }
      this.db.examVersions.push(version)
      if (v.withStudentIdentification) {
        const students = this.db.enrollments.filter(
          (e) => e.classId === app.classId && e.status === 'active',
        )
        students.forEach((e) => {
          const student = this.db.users.find((u) => u.id === e.studentId)!
          this.db.examAssignments.push({
            id: uid('asg'),
            examVersionId: version.id,
            studentId: e.studentId,
            studentName: student.fullName,
          })
        })
      }
    })
    app.status = 'generated'
    app.pdfUrl = '/mock/prova-consolidada.pdf'
    saveDb(this.db)
    return app
  }

  async listVersions(applicationId: string): Promise<ExamVersion[]> {
    await delay()
    requireAuth(this.accessToken, this.db, 'professor')
    return this.db.examVersions.filter((v) => v.applicationId === applicationId)
  }

  async listAssignments(applicationId: string): Promise<ExamAssignment[]> {
    await delay()
    requireAuth(this.accessToken, this.db, 'professor')
    const versionIds = this.db.examVersions
      .filter((v) => v.applicationId === applicationId)
      .map((v) => v.id)
    return this.db.examAssignments.filter((a) => versionIds.includes(a.examVersionId))
  }

  async publishAnswerKey(applicationId: string, versionId?: string) {
    await delay()
    requireAuth(this.accessToken, this.db, 'professor')
    const versions = this.db.examVersions.filter(
      (v) => v.applicationId === applicationId && (!versionId || v.id === versionId),
    )
    versions.forEach((v) => {
      v.answerKeyPublished = true
      v.answerKeyPublishedAt = new Date().toISOString()
    })
    saveDb(this.db)
    return versions
  }

  async getPublicAnswerKey(publicCode: string): Promise<AnswerKey> {
    await delay()
    const version = this.db.examVersions.find((v) => v.publicCode === publicCode)
    if (!version || !version.answerKeyPublished) err('Gabarito não disponível', 404)
    const app = this.db.applications.find((a) => a.id === version.applicationId)!
    const exam = this.db.exams.find((e) => e.id === app.examId)!
    const items = exam.questions.map((eq) => {
      const q = this.db.questions.find((x) => x.id === eq.questionId)!
      return {
        questionId: q.id,
        statement: q.statement,
        type: q.type,
        correctAlternativeId: q.correctAlternativeId,
        alternatives: q.alternatives,
        maxScore: eq.score,
      }
    })
    return {
      versionNumber: version.versionNumber,
      publicCode,
      published: true,
      items,
    }
  }

  // Corrections
  async listCorrections(applicationId: string, assigned?: boolean): Promise<Correction[]> {
    await delay()
    requireAuth(this.accessToken, this.db, 'professor')
    let items = this.db.corrections.filter((c) => c.applicationId === applicationId)
    if (assigned === false) items = items.filter((c) => !c.studentId)
    else if (assigned === true) items = items.filter((c) => !!c.studentId)
    return items
  }

  async assignCorrection(
    applicationId: string,
    correctionId: string,
    studentId: string,
    notes?: string,
  ) {
    await delay()
    requireAuth(this.accessToken, this.db, 'professor')
    const correction = this.db.corrections.find(
      (c) => c.id === correctionId && c.applicationId === applicationId,
    )
    if (!correction) err('Correção não encontrada', 404)
    if (correction.studentId) err('Correção já atribuída')
    const duplicate = this.db.corrections.find(
      (c) =>
        c.id !== correctionId &&
        c.examVersionId === correction.examVersionId &&
        c.studentId === studentId,
    )
    if (duplicate) err('Este aluno já possui nota nesta versão')
    correction.studentId = studentId
    correction.notes = notes
    saveDb(this.db)
    return correction
  }

  // Reports
  async getApplicationReport(applicationId: string): Promise<ApplicationReport> {
    await delay()
    requireAuth(this.accessToken, this.db, 'professor')
    const app = this.db.applications.find((a) => a.id === applicationId)!
    const exam = this.db.exams.find((e) => e.id === app.examId)!
    const cls = this.db.classes.find((c) => c.id === app.classId)!
    const maxScore = examMaxScore(exam, this.db.questions)
    const grades = this.db.corrections
      .filter((c) => c.applicationId === applicationId && c.studentId)
      .map((c) => {
        const student = this.db.users.find((u) => u.id === c.studentId)!
        return {
          studentId: c.studentId!,
          studentName: student.fullName,
          totalScore: c.totalScore,
          maxScore,
        }
      })
    const scores = grades.map((g) => g.totalScore)
    const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const sorted = [...scores].sort((a, b) => a - b)
    const median = sorted.length
      ? sorted.length % 2
        ? sorted[Math.floor(sorted.length / 2)]!
        : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
      : 0
    const variance =
      scores.length > 1
        ? scores.reduce((s, x) => s + (x - mean) ** 2, 0) / (scores.length - 1)
        : 0
    return {
      applicationId,
      examTitle: exam.title,
      className: cls.name,
      stats: { mean, median, stdDev: Math.sqrt(variance), count: scores.length },
      grades,
      distribution: [
        { range: '0-3', count: scores.filter((s) => s <= 3).length },
        { range: '4-6', count: scores.filter((s) => s > 3 && s <= 6).length },
        { range: '7-8', count: scores.filter((s) => s > 6 && s <= 8).length },
        { range: '9-10', count: scores.filter((s) => s > 8).length },
      ],
    }
  }

  async getConsolidatedReport(filters: {
    classId?: string
    subject?: string
    term?: string
  }): Promise<ConsolidatedReport> {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'professor')
    let apps = this.db.applications.filter((a) => a.teacherId === user.id)
    if (filters.classId) apps = apps.filter((a) => a.classId === filters.classId)
    const reports: ApplicationReport[] = []
    for (const app of apps) {
      const cls = this.db.classes.find((c) => c.id === app.classId)!
      if (filters.subject && cls.subject !== filters.subject) continue
      if (filters.term && cls.term !== filters.term) continue
      reports.push(await this.getApplicationReport(app.id))
    }
    const allScores = reports.flatMap((r) => r.grades.map((g) => g.totalScore))
    const mean = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0
    const sorted = [...allScores].sort((a, b) => a - b)
    const median = sorted.length
      ? sorted.length % 2
        ? sorted[Math.floor(sorted.length / 2)]!
        : (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
      : 0
    return {
      filters,
      applications: reports,
      totals: { mean, median, count: allScores.length },
    }
  }

  exportReport(applicationId: string, format: 'csv' | 'xlsx' | 'pdf') {
    return `Relatório mock (${format}) - aplicação ${applicationId}`
  }

  // Student
  async studentExams(): Promise<StudentExam[]> {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'estudante')
    const classIds = this.db.enrollments
      .filter((e) => e.studentId === user.id && e.status === 'active')
      .map((e) => e.classId)
    return this.db.applications
      .filter((a) => classIds.includes(a.classId) && a.status === 'generated')
      .map((a) => {
        const exam = this.db.exams.find((e) => e.id === a.examId)!
        const cls = this.db.classes.find((c) => c.id === a.classId)!
        return {
          applicationId: a.id,
          examTitle: exam.title,
          className: cls.name,
          subject: cls.subject,
          term: cls.term,
          appliedAt: a.createdAt,
        }
      })
  }

  async studentGrades(params?: { subject?: string; term?: string }): Promise<StudentGrade[]> {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'estudante')
    const corrections = this.db.corrections.filter((c) => c.studentId === user.id)
    return corrections.map((c) => {
      const app = this.db.applications.find((a) => a.id === c.applicationId)!
      const exam = this.db.exams.find((e) => e.id === app.examId)!
      const cls = this.db.classes.find((cl) => cl.id === app.classId)!
      const teacher = this.db.users.find((u) => u.id === app.teacherId)!
      if (params?.subject && cls.subject !== params.subject) return null
      if (params?.term && cls.term !== params.term) return null
      return {
        applicationId: app.id,
        examTitle: exam.title,
        className: cls.name,
        subject: cls.subject,
        term: cls.term,
        totalScore: c.totalScore,
        maxScore: examMaxScore(exam, this.db.questions),
        correctedAt: c.confirmedAt,
        professorName: teacher.fullName,
      }
    }).filter(Boolean) as StudentGrade[]
  }

  async studentGradeDetail(applicationId: string): Promise<StudentGradeDetail> {
    await delay()
    const user = requireAuth(this.accessToken, this.db, 'estudante')
    const correction = this.db.corrections.find(
      (c) => c.applicationId === applicationId && c.studentId === user.id,
    )
    if (!correction) err('Nota não encontrada', 404)
    const app = this.db.applications.find((a) => a.id === applicationId)!
    const exam = this.db.exams.find((e) => e.id === app.examId)!
    const cls = this.db.classes.find((c) => c.id === app.classId)!
    const teacher = this.db.users.find((u) => u.id === app.teacherId)!
    const version = this.db.examVersions.find((v) => v.id === correction.examVersionId)
    const answerKeyAvailable = !!version?.answerKeyPublished
    let answerKey: StudentGradeDetail['answerKey']
    if (answerKeyAvailable) {
      answerKey = exam.questions.map((eq) => {
        const q = this.db.questions.find((x) => x.id === eq.questionId)!
        return {
          questionId: q.id,
          statement: q.statement,
          type: q.type,
          correctAlternativeId: q.correctAlternativeId,
          alternatives: q.alternatives,
          maxScore: eq.score,
        }
      })
    }
    return {
      applicationId,
      examTitle: exam.title,
      className: cls.name,
      subject: cls.subject,
      term: cls.term,
      totalScore: correction.totalScore,
      maxScore: examMaxScore(exam, this.db.questions),
      correctedAt: correction.confirmedAt,
      professorName: teacher.fullName,
      objectiveResults: correction.objectiveResults,
      discursiveScores: correction.discursiveScores,
      answerKeyAvailable,
      answerKey,
    }
  }
}

export const mockApi = new MockApi()

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'message' in e && 'status' in e
}
