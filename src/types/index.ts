export type UserRole = 'professor' | 'estudante'

export interface User {
  id: string
  role: UserRole
  fullName: string
  email: string
  createdAt: string
  anonymizedAt?: string
}

export interface RefreshToken {
  id: string
  userId: string
  tokenHash: string
  deviceInfo?: string
  issuedAt: string
  expiresAt: string
  revokedAt?: string
}

export interface QuestionAlternative {
  id: string
  text: string
}

export interface Question {
  id: string
  teacherId: string
  type: 'objetiva' | 'discursiva'
  statement: string
  tags: string[]
  alternatives?: QuestionAlternative[]
  correctAlternativeId?: string
  maxScore?: number
  deletedAt?: string
}

export interface Class {
  id: string
  teacherId: string
  name: string
  subject: string
  term: string
  status: 'active' | 'archived'
  inviteCode: string
  createdAt: string
}

export interface ClassEnrollment {
  id: string
  classId: string
  studentId: string
  enrolledAt: string
  status: 'active' | 'removed'
  enrolledVia: 'teacher' | 'invite_code'
}

export interface ExamQuestion {
  questionId: string
  order: number
  score: number
}

export interface Exam {
  id: string
  teacherId: string
  title: string
  description?: string
  questions: ExamQuestion[]
  status: 'draft' | 'ready' | 'closed'
  createdAt: string
}

export interface Application {
  id: string
  examId: string
  classId: string
  teacherId: string
  status: 'draft' | 'generated' | 'closed'
  pdfUrl?: string
  createdAt: string
}

export interface ExamVersionLayout {
  questionOrder: string[]
  alternativeOrder: {
    questionId: string
    printedOrder: string[]
  }[]
}

export interface ExamVersion {
  id: string
  applicationId: string
  versionNumber: number
  shuffleQuestions: boolean
  shuffleAlternatives: boolean
  withStudentIdentification: boolean
  layout: ExamVersionLayout
  answerKeyPublished: boolean
  answerKeyPublishedAt?: string
  publicCode: string
  createdAt: string
}

export interface ExamAssignment {
  id: string
  examVersionId: string
  studentId: string
  studentName: string
}

export interface ObjectiveResult {
  questionId: string
  correct: boolean
  score: number
}

export interface DiscursiveScore {
  questionId: string
  score: number
}

export interface Correction {
  id: string
  examVersionId: string
  applicationId: string
  studentId?: string
  reportedStudentName?: string
  reportedStudentRegistration?: string
  objectiveResults: ObjectiveResult[]
  discursiveScores: DiscursiveScore[]
  totalScore: number
  notes?: string
  confirmedAt: string
  correctedBy: string
  isAutomaticallyAssigned: boolean
  clientCorrectionId: string
  syncStatus: 'pending' | 'synced' | 'error'
  syncError?: string
}

export interface AnswerKeyItem {
  questionId: string
  statement: string
  type: 'objetiva' | 'discursiva'
  correctAlternativeId?: string
  alternatives?: QuestionAlternative[]
  maxScore?: number
}

export interface AnswerKey {
  versionNumber: number
  publicCode: string
  published: boolean
  items: AnswerKeyItem[]
}

export interface StudentExam {
  applicationId: string
  examTitle: string
  className: string
  subject: string
  term: string
  appliedAt: string
}

export interface StudentGrade {
  applicationId: string
  examTitle: string
  className: string
  subject: string
  term: string
  totalScore: number
  maxScore: number
  correctedAt: string
  professorName: string
}

export interface StudentGradeDetail extends StudentGrade {
  objectiveResults: ObjectiveResult[]
  discursiveScores: DiscursiveScore[]
  answerKeyAvailable: boolean
  answerKey?: AnswerKeyItem[]
}

export interface ApplicationReport {
  applicationId: string
  examTitle: string
  className: string
  stats: {
    mean: number
    median: number
    stdDev: number
    count: number
  }
  grades: {
    studentId: string
    studentName: string
    totalScore: number
    maxScore: number
  }[]
  distribution: { range: string; count: number }[]
}

export interface ConsolidatedReport {
  filters: { classId?: string; subject?: string; term?: string }
  applications: ApplicationReport[]
  totals: { mean: number; median: number; count: number }
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ApiError {
  message: string
  code?: string
  status: number
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface PdfGenerationConfig {
  versions: {
    shuffleQuestions: boolean
    shuffleAlternatives: boolean
    withStudentIdentification: boolean
  }[]
}

export interface MockDb {
  users: (User & { password: string })[]
  refreshTokens: RefreshToken[]
  questions: Question[]
  classes: Class[]
  enrollments: ClassEnrollment[]
  exams: Exam[]
  applications: Application[]
  examVersions: ExamVersion[]
  examAssignments: ExamAssignment[]
  corrections: Correction[]
}
