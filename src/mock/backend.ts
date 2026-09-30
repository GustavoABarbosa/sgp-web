import type {
  AnswerKey,
  AnswerKeyItem,
  Application,
  ApplicationDetail,
  ApplicationReport,
  ApplicationSummary,
  AuthSession,
  Class,
  ClassEnrollment,
  ClassStudent,
  ConsolidatedReport,
  Correction,
  Exam,
  ExamAssignment,
  ExamVersion,
  JoinClassResult,
  MockDb,
  Paginated,
  PdfGenerationConfig,
  ProfessorSummary,
  Question,
  StudentExam,
  StudentGrade,
  StudentGradeDetail,
  User,
  UserRole,
} from '@/types'
import { STUDENT_EMAIL_DOMAIN, emailDomainForRole } from '@/shared/validation/fields'
import { db, resetDb, saveDb } from './db'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message)
  }
}

type DbUser = MockDb['users'][number]
type Session = User | null

const MAX_EXAM_QUESTIONS = 20
const MAX_VERSIONS = 10
const REFRESH_TTL_MS = 7 * 86_400_000

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function now() {
  return new Date().toISOString()
}

function inviteCode() {
  return crypto.randomUUID().slice(0, 8).toUpperCase()
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function sanitizeUser(user: DbUser): User {
  const { password: _, ...rest } = user
  return rest
}

function requireRole(session: Session, role?: UserRole): User {
  if (!session) throw new HttpError(401, 'Não autenticado')
  if (role && session.role !== role) throw new HttpError(403, 'Acesso negado')
  return session
}

function paginate<T>(items: T[], page = 1, limit = 20): Paginated<T> {
  const start = (page - 1) * limit
  return { data: items.slice(start, start + limit), total: items.length, page, limit }
}

function findUser(id: string): DbUser {
  const user = db().users.find((u) => u.id === id)
  if (!user) throw new HttpError(404, 'Usuário não encontrado')
  return user
}

function ownedQuestion(user: User, id: string): Question {
  const q = db().questions.find((x) => x.id === id && x.teacherId === user.id && !x.deletedAt)
  if (!q) throw new HttpError(404, 'Questão não encontrada')
  return q
}

function ownedClass(user: User, id: string): Class {
  const cls = db().classes.find((c) => c.id === id && c.teacherId === user.id)
  if (!cls) throw new HttpError(404, 'Turma não encontrada')
  return cls
}

function activeOwnedClass(user: User, id: string): Class {
  const cls = ownedClass(user, id)
  if (cls.status !== 'active') throw new HttpError(409, 'Turma arquivada não pode ser alterada')
  return cls
}

function ownedExam(user: User, id: string): Exam {
  const exam = db().exams.find((e) => e.id === id && e.teacherId === user.id)
  if (!exam) throw new HttpError(404, 'Prova não encontrada')
  return exam
}

function ownedApplication(user: User, id: string): Application {
  const app = db().applications.find((a) => a.id === id && a.teacherId === user.id)
  if (!app) throw new HttpError(404, 'Aplicação não encontrada')
  return app
}

function examFor(app: Application): Exam {
  return db().exams.find((e) => e.id === app.examId)!
}

function classFor(app: Application): Class {
  return db().classes.find((c) => c.id === app.classId)!
}

function examMaxScore(exam: Exam): number {
  return exam.questions.reduce((sum, eq) => {
    const q = db().questions.find((x) => x.id === eq.questionId)
    return sum + (eq.score ?? q?.maxScore ?? 0)
  }, 0)
}

function orderedExamQuestions(exam: Exam) {
  return [...exam.questions].sort((a, b) => a.order - b.order)
}

function buildAnswerKey(exam: Exam): AnswerKeyItem[] {
  return orderedExamQuestions(exam).map((eq) => {
    const q = db().questions.find((x) => x.id === eq.questionId)!
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

export function computeStats(scores: number[]) {
  const count = scores.length
  const mean = count ? scores.reduce((a, b) => a + b, 0) / count : 0
  const sorted = [...scores].sort((a, b) => a - b)
  const mid = Math.floor(count / 2)
  const median = count ? (count % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2) : 0
  const variance = count > 1 ? scores.reduce((s, x) => s + (x - mean) ** 2, 0) / (count - 1) : 0
  return { mean, median, stdDev: Math.sqrt(variance), count }
}

const DISTRIBUTION_BUCKETS = [
  { range: '0–39%', min: 0, max: 40 },
  { range: '40–69%', min: 40, max: 70 },
  { range: '70–89%', min: 70, max: 90 },
  { range: '90–100%', min: 90, max: Infinity },
]

function issueSession(userId: string): AuthSession {
  const id = uid('rt')
  const refreshToken = `refresh:${crypto.randomUUID()}`
  db().refreshTokens.push({
    id,
    userId,
    tokenHash: refreshToken,
    issuedAt: now(),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
  })
  saveDb()
  return { accessToken: `access:${id}`, refreshToken, user: sanitizeUser(findUser(userId)) }
}

function revokeUserTokens(userId: string) {
  db().refreshTokens.forEach((t) => {
    if (t.userId === userId && !t.revokedAt) t.revokedAt = now()
  })
}

function validRefreshToken(tokenHash: string) {
  return db().refreshTokens.find(
    (t) => t.tokenHash === tokenHash && !t.revokedAt && new Date(t.expiresAt) > new Date(),
  )
}

/** Resolves the user behind an `Authorization: Bearer access:{refreshTokenId}` header. */
export function authenticate(authorization: string | null): Session {
  const token = authorization?.replace(/^Bearer\s+/i, '')
  if (!token?.startsWith('access:')) return null
  const rt = db().refreshTokens.find((t) => t.id === token.slice(7))
  if (!rt || rt.revokedAt || new Date(rt.expiresAt) <= new Date()) return null
  const user = db().users.find((u) => u.id === rt.userId && !u.anonymizedAt)
  return user ? sanitizeUser(user) : null
}

// Auth

export function register(body: {
  role: UserRole
  fullName: string
  email: string
  password: string
}): AuthSession {
  const email = normalizeEmail(body.email)
  const domain = emailDomainForRole(body.role)
  if (!email.endsWith(domain)) throw new HttpError(422, `E-mail deve ser do domínio ${domain}`)
  if (body.password.length < 8) throw new HttpError(422, 'Senha deve ter no mínimo 8 caracteres')
  if (db().users.some((u) => u.email === email && !u.anonymizedAt)) {
    throw new HttpError(409, 'E-mail já cadastrado')
  }
  const user: DbUser = {
    id: uid('usr'),
    role: body.role,
    fullName: body.fullName.trim(),
    email,
    password: body.password,
    createdAt: now(),
  }
  db().users.push(user)
  return issueSession(user.id)
}

export function login(body: { email: string; password: string }): AuthSession {
  const email = normalizeEmail(body.email)
  const user = db().users.find((u) => u.email === email && !u.anonymizedAt)
  if (!user || user.password !== body.password) throw new HttpError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS')
  return issueSession(user.id)
}

export function refresh(body: { refreshToken: string }): AuthSession {
  const rt = validRefreshToken(body.refreshToken)
  if (!rt) throw new HttpError(401, 'Sessão expirada', 'INVALID_REFRESH_TOKEN')
  const user = db().users.find((u) => u.id === rt.userId && !u.anonymizedAt)
  if (!user) throw new HttpError(401, 'Sessão expirada', 'INVALID_REFRESH_TOKEN')
  rt.revokedAt = now()
  return issueSession(rt.userId)
}

export function logout(body: { refreshToken: string }) {
  const rt = db().refreshTokens.find((t) => t.tokenHash === body.refreshToken)
  if (rt && !rt.revokedAt) {
    rt.revokedAt = now()
    saveDb()
  }
}

export function logoutAll(session: Session) {
  const user = requireRole(session)
  revokeUserTokens(user.id)
  saveDb()
}

export function forgotPassword(_body: { email: string }) {
  return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.' }
}

export function resetPassword(body: { token: string; password: string }) {
  if (!body.token) throw new HttpError(400, 'Link inválido ou expirado', 'INVALID_RESET_TOKEN')
  if (body.password.length < 8) throw new HttpError(422, 'Senha deve ter no mínimo 8 caracteres')
  return { message: 'Senha redefinida.' }
}

export function me(session: Session): User {
  return requireRole(session)
}

export function anonymize(session: Session) {
  const user = requireRole(session)
  const dbUser = findUser(user.id)
  dbUser.fullName = 'Usuário removido'
  dbUser.email = `anon-${user.id}@removido.local`
  dbUser.password = ''
  dbUser.anonymizedAt = now()
  revokeUserTokens(user.id)
  saveDb()
}

// Dashboard

export function professorSummary(session: Session): ProfessorSummary {
  const user = requireRole(session, 'professor')
  const apps = db().applications.filter((a) => a.teacherId === user.id)
  const appIds = new Set(apps.map((a) => a.id))
  return {
    questions: db().questions.filter((q) => q.teacherId === user.id && !q.deletedAt).length,
    activeClasses: db().classes.filter((c) => c.teacherId === user.id && c.status === 'active').length,
    exams: db().exams.filter((e) => e.teacherId === user.id).length,
    applications: apps.length,
    pendingCorrections: db().corrections.filter((c) => appIds.has(c.applicationId) && !c.studentId).length,
  }
}

// Questions

export function listQuestions(
  session: Session,
  params: {
    type?: string
    tag?: string
    tags?: string[]
    search?: string
    ids?: string[]
    page?: number
    limit?: number
  },
): Paginated<Question> {
  const user = requireRole(session, 'professor')
  let items = db().questions.filter((q) => q.teacherId === user.id && !q.deletedAt)
  if (params.ids?.length) items = items.filter((q) => params.ids!.includes(q.id))
  if (params.type) items = items.filter((q) => q.type === params.type)
  if (params.tag) {
    const tag = params.tag.toLowerCase()
    items = items.filter((q) => q.tags.some((t) => t.toLowerCase().includes(tag)))
  }
  if (params.tags?.length) items = items.filter((q) => params.tags!.some((t) => q.tags.includes(t)))
  if (params.search) {
    const s = params.search.toLowerCase()
    items = items.filter(
      (q) => q.statement.toLowerCase().includes(s) || q.tags.some((t) => t.toLowerCase().includes(s)),
    )
  }
  return paginate(items, params.page, params.limit)
}

export function listQuestionTags(session: Session): string[] {
  const user = requireRole(session, 'professor')
  const tags = db()
    .questions.filter((q) => q.teacherId === user.id && !q.deletedAt)
    .flatMap((q) => q.tags)
  return [...new Set(tags)].sort((a, b) => a.localeCompare(b))
}

export function getQuestion(session: Session, id: string): Question {
  return ownedQuestion(requireRole(session, 'professor'), id)
}

type QuestionInput = Omit<Question, 'id' | 'teacherId' | 'deletedAt'>

export function createQuestion(session: Session, data: QuestionInput): Question {
  const user = requireRole(session, 'professor')
  const q: Question = { ...data, id: uid('q'), teacherId: user.id }
  db().questions.push(q)
  saveDb()
  return q
}

export function updateQuestion(session: Session, id: string, data: QuestionInput): Question {
  const q = ownedQuestion(requireRole(session, 'professor'), id)
  Object.assign(q, data, { id: q.id, teacherId: q.teacherId, type: q.type })
  saveDb()
  return q
}

export function deleteQuestion(session: Session, id: string) {
  const q = ownedQuestion(requireRole(session, 'professor'), id)
  q.deletedAt = now()
  saveDb()
}

// Classes

export function listClasses(
  session: Session,
  params: { status?: string; name?: string; subject?: string; term?: string },
): Class[] {
  const user = requireRole(session, 'professor')
  let items = db().classes.filter((c) => c.teacherId === user.id)
  if (params.status) items = items.filter((c) => c.status === params.status)
  if (params.name) {
    const s = params.name.toLowerCase()
    items = items.filter((c) => c.name.toLowerCase().includes(s))
  }
  if (params.subject) {
    const s = params.subject.toLowerCase()
    items = items.filter((c) => c.subject.toLowerCase().includes(s))
  }
  if (params.term) items = items.filter((c) => c.term === params.term)
  return items
}

export function getClass(session: Session, id: string): Class {
  return ownedClass(requireRole(session, 'professor'), id)
}

type ClassInput = Pick<Class, 'name' | 'subject' | 'term'>

export function createClass(session: Session, data: ClassInput): Class {
  const user = requireRole(session, 'professor')
  const cls: Class = {
    id: uid('cls'),
    teacherId: user.id,
    name: data.name,
    subject: data.subject,
    term: data.term,
    status: 'active',
    inviteCode: inviteCode(),
    createdAt: now(),
  }
  db().classes.push(cls)
  saveDb()
  return cls
}

export function updateClass(session: Session, id: string, data: ClassInput): Class {
  const cls = activeOwnedClass(requireRole(session, 'professor'), id)
  cls.name = data.name
  cls.subject = data.subject
  cls.term = data.term
  saveDb()
  return cls
}

export function archiveClass(session: Session, id: string): Class {
  const cls = ownedClass(requireRole(session, 'professor'), id)
  cls.status = 'archived'
  saveDb()
  return cls
}

function activeEnrollments(classId: string) {
  return db().enrollments.filter((e) => e.classId === classId && e.status === 'active')
}

export function listClassStudents(session: Session, classId: string): ClassStudent[] {
  ownedClass(requireRole(session, 'professor'), classId)
  return activeEnrollments(classId).map((enrollment) => ({
    enrollment,
    student: sanitizeUser(findUser(enrollment.studentId)),
  }))
}

function enroll(classId: string, studentId: string, via: ClassEnrollment['enrolledVia']): ClassEnrollment {
  const existing = activeEnrollments(classId).find((e) => e.studentId === studentId)
  if (existing) return existing
  const enrollment: ClassEnrollment = {
    id: uid('enr'),
    classId,
    studentId,
    enrolledAt: now(),
    status: 'active',
    enrolledVia: via,
  }
  db().enrollments.push(enrollment)
  return enrollment
}

export function enrollStudent(session: Session, classId: string, body: { email: string }): ClassStudent {
  activeOwnedClass(requireRole(session, 'professor'), classId)
  const email = normalizeEmail(body.email)
  const student = db().users.find((u) => u.email === email && u.role === 'estudante' && !u.anonymizedAt)
  if (!student) throw new HttpError(404, 'Aluno não encontrado com este e-mail')
  const enrollment = enroll(classId, student.id, 'teacher')
  saveDb()
  return { enrollment, student: sanitizeUser(student) }
}

export function removeStudent(session: Session, classId: string, studentId: string) {
  activeOwnedClass(requireRole(session, 'professor'), classId)
  const enrollment = activeEnrollments(classId).find((e) => e.studentId === studentId)
  if (!enrollment) throw new HttpError(404, 'Matrícula não encontrada')
  enrollment.status = 'removed'
  saveDb()
}

export function regenerateInviteCode(session: Session, classId: string): Class {
  const cls = activeOwnedClass(requireRole(session, 'professor'), classId)
  cls.inviteCode = inviteCode()
  saveDb()
  return cls
}

export function joinByCode(
  session: Session,
  body: { inviteCode: string; email?: string; fullName?: string; password?: string },
): JoinClassResult {
  const cls = db().classes.find(
    (c) => c.inviteCode === body.inviteCode.trim().toUpperCase() && c.status === 'active',
  )
  if (!cls) throw new HttpError(404, 'Código de convite inválido')

  if (session) {
    const user = requireRole(session, 'estudante')
    enroll(cls.id, user.id, 'invite_code')
    saveDb()
    return { class: cls, user, session: null }
  }

  const email = normalizeEmail(body.email ?? '')
  const existing = db().users.find((u) => u.email === email && !u.anonymizedAt)
  if (existing) {
    throw new HttpError(409, 'Já existe uma conta com este e-mail. Entre para confirmar a matrícula.', 'LOGIN_REQUIRED')
  }
  if (!body.fullName || !body.password) {
    throw new HttpError(422, 'Conta não encontrada. Informe nome e senha para se cadastrar.', 'ACCOUNT_REQUIRED')
  }
  if (!email.endsWith(STUDENT_EMAIL_DOMAIN)) throw new HttpError(422, `E-mail deve ser ${STUDENT_EMAIL_DOMAIN}`)
  const created = register({ role: 'estudante', fullName: body.fullName, email, password: body.password })
  enroll(cls.id, created.user.id, 'invite_code')
  saveDb()
  return { class: cls, user: created.user, session: created }
}

// Exams

type ExamInput = Pick<Exam, 'title' | 'description' | 'questions'>

function validateExamQuestions(user: User, questions: Exam['questions']) {
  if (questions.length > MAX_EXAM_QUESTIONS) throw new HttpError(422, `Máximo de ${MAX_EXAM_QUESTIONS} questões`)
  questions.forEach((eq) => ownedQuestion(user, eq.questionId))
}

export function listExams(session: Session, params: { status?: string }): Exam[] {
  const user = requireRole(session, 'professor')
  let items = db().exams.filter((e) => e.teacherId === user.id)
  if (params.status) items = items.filter((e) => e.status === params.status)
  return items
}

export function getExam(session: Session, id: string): Exam {
  return ownedExam(requireRole(session, 'professor'), id)
}

export function createExam(session: Session, data: ExamInput): Exam {
  const user = requireRole(session, 'professor')
  validateExamQuestions(user, data.questions)
  const exam: Exam = {
    id: uid('exam'),
    teacherId: user.id,
    title: data.title,
    description: data.description,
    questions: data.questions,
    status: 'draft',
    createdAt: now(),
  }
  db().exams.push(exam)
  saveDb()
  return exam
}

export function updateExam(session: Session, id: string, data: ExamInput): Exam {
  const user = requireRole(session, 'professor')
  const exam = ownedExam(user, id)
  if (exam.status === 'closed') throw new HttpError(409, 'Prova arquivada não pode ser editada')
  validateExamQuestions(user, data.questions)
  exam.title = data.title
  exam.description = data.description
  exam.questions = data.questions
  saveDb()
  return exam
}

export function archiveExam(session: Session, id: string): Exam {
  const exam = ownedExam(requireRole(session, 'professor'), id)
  exam.status = 'closed'
  saveDb()
  return exam
}

// Applications

export function listApplications(session: Session): ApplicationSummary[] {
  const user = requireRole(session, 'professor')
  return db()
    .applications.filter((a) => a.teacherId === user.id)
    .map((a) => ({ ...a, examTitle: examFor(a).title, className: classFor(a).name }))
}

export function getApplication(session: Session, id: string): ApplicationDetail {
  const app = ownedApplication(requireRole(session, 'professor'), id)
  return { application: app, exam: examFor(app), class: classFor(app) }
}

export function createApplication(session: Session, body: { examId: string; classId: string }): Application {
  const user = requireRole(session, 'professor')
  const exam = ownedExam(user, body.examId)
  if (exam.status === 'closed') throw new HttpError(409, 'Prova arquivada não pode ser aplicada')
  activeOwnedClass(user, body.classId)
  if (exam.status === 'draft') exam.status = 'ready'
  const app: Application = {
    id: uid('app'),
    examId: exam.id,
    classId: body.classId,
    teacherId: user.id,
    status: 'draft',
    createdAt: now(),
  }
  db().applications.push(app)
  saveDb()
  return app
}

export function generatePdf(session: Session, applicationId: string, config: PdfGenerationConfig): Application {
  const app = ownedApplication(requireRole(session, 'professor'), applicationId)
  if (config.versions.length < 1 || config.versions.length > MAX_VERSIONS) {
    throw new HttpError(422, `Informe entre 1 e ${MAX_VERSIONS} versões`)
  }
  const hasConfirmed = db().corrections.some((c) => c.applicationId === applicationId && c.syncStatus === 'synced')
  if (hasConfirmed && app.status === 'generated') {
    throw new HttpError(409, 'Não é possível regenerar: já existem correções confirmadas. Crie uma nova aplicação.')
  }

  const data = db()
  const oldVersionIds = new Set(data.examVersions.filter((v) => v.applicationId === applicationId).map((v) => v.id))
  data.examVersions = data.examVersions.filter((v) => !oldVersionIds.has(v.id))
  data.examAssignments = data.examAssignments.filter((a) => !oldVersionIds.has(a.examVersionId))

  const exam = examFor(app)
  const students = activeEnrollments(app.classId)
  config.versions.forEach((v, i) => {
    const version: ExamVersion = {
      id: uid('ver'),
      applicationId,
      versionNumber: i + 1,
      shuffleQuestions: v.shuffleQuestions,
      shuffleAlternatives: v.shuffleAlternatives,
      withStudentIdentification: v.withStudentIdentification,
      layout: { questionOrder: orderedExamQuestions(exam).map((q) => q.questionId), alternativeOrder: [] },
      answerKeyPublished: false,
      publicCode: `GAB-V${i + 1}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      createdAt: now(),
    }
    data.examVersions.push(version)
    if (v.withStudentIdentification) {
      students.forEach((e) => {
        data.examAssignments.push({
          id: uid('asg'),
          examVersionId: version.id,
          studentId: e.studentId,
          studentName: findUser(e.studentId).fullName,
        })
      })
    }
  })
  app.status = 'generated'
  app.pdfUrl = '/mock/prova-consolidada.pdf'
  saveDb()
  return app
}

export function listVersions(session: Session, applicationId: string): ExamVersion[] {
  ownedApplication(requireRole(session, 'professor'), applicationId)
  return db().examVersions.filter((v) => v.applicationId === applicationId)
}

export function listAssignments(session: Session, applicationId: string): ExamAssignment[] {
  ownedApplication(requireRole(session, 'professor'), applicationId)
  const versionIds = new Set(listVersions(session, applicationId).map((v) => v.id))
  return db().examAssignments.filter((a) => versionIds.has(a.examVersionId))
}

export function publishAnswerKey(session: Session, applicationId: string, body: { versionId?: string }): ExamVersion[] {
  ownedApplication(requireRole(session, 'professor'), applicationId)
  const versions = db().examVersions.filter(
    (v) => v.applicationId === applicationId && (!body.versionId || v.id === body.versionId),
  )
  if (body.versionId && !versions.length) throw new HttpError(404, 'Versão não encontrada')
  versions.forEach((v) => {
    v.answerKeyPublished = true
    v.answerKeyPublishedAt = now()
  })
  saveDb()
  return versions
}

export function getPublicAnswerKey(publicCode: string): AnswerKey {
  const version = db().examVersions.find((v) => v.publicCode === publicCode)
  if (!version || !version.answerKeyPublished) throw new HttpError(404, 'Gabarito não disponível')
  const app = db().applications.find((a) => a.id === version.applicationId)!
  return {
    versionNumber: version.versionNumber,
    publicCode,
    published: true,
    items: buildAnswerKey(examFor(app)),
  }
}

// Corrections

export function listCorrections(session: Session, applicationId: string, params: { assigned?: string }): Correction[] {
  ownedApplication(requireRole(session, 'professor'), applicationId)
  let items = db().corrections.filter((c) => c.applicationId === applicationId)
  if (params.assigned === 'false') items = items.filter((c) => !c.studentId)
  else if (params.assigned === 'true') items = items.filter((c) => !!c.studentId)
  return items
}

export function assignCorrection(
  session: Session,
  applicationId: string,
  correctionId: string,
  body: { studentId: string; notes?: string },
): Correction {
  const app = ownedApplication(requireRole(session, 'professor'), applicationId)
  const correction = db().corrections.find((c) => c.id === correctionId && c.applicationId === applicationId)
  if (!correction) throw new HttpError(404, 'Correção não encontrada')
  if (correction.studentId) throw new HttpError(409, 'Correção já atribuída')
  if (!activeEnrollments(app.classId).some((e) => e.studentId === body.studentId)) {
    throw new HttpError(422, 'Aluno não está matriculado nesta turma')
  }
  const duplicate = db().corrections.find(
    (c) => c.id !== correctionId && c.examVersionId === correction.examVersionId && c.studentId === body.studentId,
  )
  if (duplicate) throw new HttpError(409, 'Este aluno já possui nota nesta versão')
  correction.studentId = body.studentId
  correction.notes = body.notes
  saveDb()
  return correction
}

// Reports

function buildApplicationReport(app: Application): ApplicationReport {
  const exam = examFor(app)
  const maxScore = examMaxScore(exam)
  const grades = db()
    .corrections.filter((c) => c.applicationId === app.id && c.studentId)
    .map((c) => ({
      studentId: c.studentId!,
      studentName: findUser(c.studentId!).fullName,
      totalScore: c.totalScore,
      maxScore,
    }))
  const percents = grades.map((g) => (maxScore > 0 ? (g.totalScore / maxScore) * 100 : 0))
  return {
    applicationId: app.id,
    examTitle: exam.title,
    className: classFor(app).name,
    stats: computeStats(grades.map((g) => g.totalScore)),
    grades,
    distribution: DISTRIBUTION_BUCKETS.map((b) => ({
      range: b.range,
      count: percents.filter((p) => p >= b.min && p < b.max).length,
    })),
  }
}

export function getApplicationReport(session: Session, applicationId: string): ApplicationReport {
  return buildApplicationReport(ownedApplication(requireRole(session, 'professor'), applicationId))
}

export function getConsolidatedReport(
  session: Session,
  filters: { classId?: string; subject?: string; term?: string },
): ConsolidatedReport {
  const user = requireRole(session, 'professor')
  const subject = filters.subject?.toLowerCase()
  const reports = db()
    .applications.filter((a) => a.teacherId === user.id && (!filters.classId || a.classId === filters.classId))
    .filter((a) => {
      const cls = classFor(a)
      return (!subject || cls.subject.toLowerCase().includes(subject)) && (!filters.term || cls.term === filters.term)
    })
    .map(buildApplicationReport)
  const { mean, median, count } = computeStats(reports.flatMap((r) => r.grades.map((g) => g.totalScore)))
  return { filters, applications: reports, totals: { mean, median, count } }
}

// Student

function studentClassIds(userId: string) {
  return db()
    .enrollments.filter((e) => e.studentId === userId && e.status === 'active')
    .map((e) => e.classId)
}

export function studentExams(session: Session): StudentExam[] {
  const user = requireRole(session, 'estudante')
  const classIds = studentClassIds(user.id)
  return db()
    .applications.filter((a) => classIds.includes(a.classId) && a.status === 'generated')
    .map((a) => {
      const cls = classFor(a)
      return {
        applicationId: a.id,
        examTitle: examFor(a).title,
        className: cls.name,
        subject: cls.subject,
        term: cls.term,
        appliedAt: a.createdAt,
        hasGrade: db().corrections.some((c) => c.applicationId === a.id && c.studentId === user.id),
      }
    })
}

function toStudentGrade(c: Correction): StudentGrade {
  const app = db().applications.find((a) => a.id === c.applicationId)!
  const exam = examFor(app)
  const cls = classFor(app)
  return {
    applicationId: app.id,
    examTitle: exam.title,
    className: cls.name,
    subject: cls.subject,
    term: cls.term,
    totalScore: c.totalScore,
    maxScore: examMaxScore(exam),
    correctedAt: c.confirmedAt,
    professorName: findUser(app.teacherId).fullName,
  }
}

export function studentGrades(session: Session): StudentGrade[] {
  const user = requireRole(session, 'estudante')
  return db()
    .corrections.filter((c) => c.studentId === user.id)
    .map(toStudentGrade)
}

export function studentGradeDetail(session: Session, applicationId: string): StudentGradeDetail {
  const user = requireRole(session, 'estudante')
  const correction = db().corrections.find((c) => c.applicationId === applicationId && c.studentId === user.id)
  if (!correction) throw new HttpError(404, 'Nota não encontrada')
  const app = db().applications.find((a) => a.id === applicationId)!
  const exam = examFor(app)
  const version = db().examVersions.find((v) => v.id === correction.examVersionId)
  const answerKeyAvailable = !!version?.answerKeyPublished
  const results = orderedExamQuestions(exam).flatMap((eq, index) => {
    const q = db().questions.find((x) => x.id === eq.questionId)
    const objective = correction.objectiveResults.find((r) => r.questionId === eq.questionId)
    const discursive = correction.discursiveScores.find((r) => r.questionId === eq.questionId)
    if (!objective && !discursive) return []
    return [
      {
        number: index + 1,
        questionId: eq.questionId,
        type: q?.type ?? (objective ? 'objetiva' : 'discursiva'),
        correct: objective?.correct,
        score: objective?.score ?? discursive!.score,
        maxScore: eq.score,
      } as const,
    ]
  })
  return {
    ...toStudentGrade(correction),
    results,
    answerKeyAvailable,
    answerKey: answerKeyAvailable ? buildAnswerKey(exam) : undefined,
  }
}

// Mock-only

export function resetMockData() {
  resetDb()
}
