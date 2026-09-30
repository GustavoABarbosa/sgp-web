import { HttpResponse, delay, http } from 'msw'
import type { User } from '@/types'
import { API_BASE_URL } from '@/shared/env'
import * as backend from './backend'

interface RouteContext {
  user: User | null
  params: Record<string, string>
  query: URLSearchParams
  body: any
}

function route(resolve: (ctx: RouteContext) => unknown) {
  return async ({ request, params }: { request: Request; params: Record<string, string | readonly string[] | undefined> }) => {
    if (import.meta.env.MODE !== 'test') await delay()
    try {
      const text = request.method === 'GET' ? '' : await request.text()
      const result = resolve({
        user: backend.authenticate(request.headers.get('Authorization')),
        params: params as Record<string, string>,
        query: new URL(request.url).searchParams,
        body: text ? JSON.parse(text) : {},
      })
      return result === undefined ? new HttpResponse(null, { status: 204 }) : HttpResponse.json(result)
    } catch (e) {
      if (e instanceof backend.HttpError) {
        return HttpResponse.json({ message: e.message, code: e.code }, { status: e.status })
      }
      throw e
    }
  }
}

function num(value: string | null) {
  return value ? Number(value) : undefined
}

function list(value: string | null) {
  return value ? value.split(',').filter(Boolean) : undefined
}

function str(value: string | null) {
  return value ?? undefined
}

const api = (path: string) => `${API_BASE_URL}${path}`

export const handlers = [
  // Auth
  http.post(api('/auth/register'), route(({ body }) => backend.register(body))),
  http.post(api('/auth/login'), route(({ body }) => backend.login(body))),
  http.post(api('/auth/refresh'), route(({ body }) => backend.refresh(body))),
  http.post(api('/auth/logout'), route(({ body }) => backend.logout(body))),
  http.post(api('/auth/logout-all'), route(({ user }) => backend.logoutAll(user))),
  http.post(api('/auth/forgot-password'), route(({ body }) => backend.forgotPassword(body))),
  http.post(api('/auth/reset-password'), route(({ body }) => backend.resetPassword(body))),
  http.post(api('/auth/anonymize'), route(({ user }) => backend.anonymize(user))),
  http.get(api('/auth/me'), route(({ user }) => backend.me(user))),

  // Dashboard
  http.get(api('/dashboard/summary'), route(({ user }) => backend.professorSummary(user))),

  // Questions
  http.get(
    api('/questions'),
    route(({ user, query }) =>
      backend.listQuestions(user, {
        type: str(query.get('type')),
        tag: str(query.get('tag')),
        tags: list(query.get('tags')),
        search: str(query.get('search')),
        ids: list(query.get('ids')),
        page: num(query.get('page')),
        limit: num(query.get('limit')),
      }),
    ),
  ),
  http.get(api('/questions/tags'), route(({ user }) => backend.listQuestionTags(user))),
  http.post(api('/questions'), route(({ user, body }) => backend.createQuestion(user, body))),
  http.get(api('/questions/:id'), route(({ user, params }) => backend.getQuestion(user, params.id!))),
  http.put(api('/questions/:id'), route(({ user, params, body }) => backend.updateQuestion(user, params.id!, body))),
  http.delete(api('/questions/:id'), route(({ user, params }) => backend.deleteQuestion(user, params.id!))),

  // Classes
  http.get(
    api('/classes'),
    route(({ user, query }) =>
      backend.listClasses(user, {
        status: str(query.get('status')),
        name: str(query.get('name')),
        subject: str(query.get('subject')),
        term: str(query.get('term')),
      }),
    ),
  ),
  http.post(api('/classes'), route(({ user, body }) => backend.createClass(user, body))),
  http.get(api('/classes/:id'), route(({ user, params }) => backend.getClass(user, params.id!))),
  http.patch(api('/classes/:id'), route(({ user, params, body }) => backend.updateClass(user, params.id!, body))),
  http.post(api('/classes/:id/archive'), route(({ user, params }) => backend.archiveClass(user, params.id!))),
  http.get(api('/classes/:id/students'), route(({ user, params }) => backend.listClassStudents(user, params.id!))),
  http.post(
    api('/classes/:id/students'),
    route(({ user, params, body }) => backend.enrollStudent(user, params.id!, body)),
  ),
  http.delete(
    api('/classes/:id/students/:studentId'),
    route(({ user, params }) => backend.removeStudent(user, params.id!, params.studentId!)),
  ),
  http.post(
    api('/classes/:id/invite-code'),
    route(({ user, params }) => backend.regenerateInviteCode(user, params.id!)),
  ),
  http.post(api('/join'), route(({ user, body }) => backend.joinByCode(user, body))),

  // Exams
  http.get(api('/exams'), route(({ user, query }) => backend.listExams(user, { status: str(query.get('status')) }))),
  http.post(api('/exams'), route(({ user, body }) => backend.createExam(user, body))),
  http.get(api('/exams/:id'), route(({ user, params }) => backend.getExam(user, params.id!))),
  http.put(api('/exams/:id'), route(({ user, params, body }) => backend.updateExam(user, params.id!, body))),
  http.post(api('/exams/:id/archive'), route(({ user, params }) => backend.archiveExam(user, params.id!))),

  // Applications
  http.get(api('/applications'), route(({ user }) => backend.listApplications(user))),
  http.post(api('/applications'), route(({ user, body }) => backend.createApplication(user, body))),
  http.get(api('/applications/:id'), route(({ user, params }) => backend.getApplication(user, params.id!))),
  http.post(
    api('/applications/:id/pdf'),
    route(({ user, params, body }) => backend.generatePdf(user, params.id!, body)),
  ),
  http.get(api('/applications/:id/versions'), route(({ user, params }) => backend.listVersions(user, params.id!))),
  http.get(
    api('/applications/:id/assignments'),
    route(({ user, params }) => backend.listAssignments(user, params.id!)),
  ),
  http.post(
    api('/applications/:id/answer-key/publish'),
    route(({ user, params, body }) => backend.publishAnswerKey(user, params.id!, body)),
  ),
  http.get(
    api('/applications/:id/corrections'),
    route(({ user, params, query }) =>
      backend.listCorrections(user, params.id!, { assigned: str(query.get('assigned')) }),
    ),
  ),
  http.post(
    api('/applications/:id/corrections/:correctionId/assign'),
    route(({ user, params, body }) => backend.assignCorrection(user, params.id!, params.correctionId!, body)),
  ),
  http.get(api('/answer-keys/:publicCode'), route(({ params }) => backend.getPublicAnswerKey(params.publicCode!))),

  // Reports
  http.get(
    api('/reports/applications/:id'),
    route(({ user, params }) => backend.getApplicationReport(user, params.id!)),
  ),
  http.get(
    api('/reports/consolidated'),
    route(({ user, query }) =>
      backend.getConsolidatedReport(user, {
        classId: str(query.get('classId')),
        subject: str(query.get('subject')),
        term: str(query.get('term')),
      }),
    ),
  ),

  // Student
  http.get(api('/student/exams'), route(({ user }) => backend.studentExams(user))),
  http.get(api('/student/grades'), route(({ user }) => backend.studentGrades(user))),
  http.get(
    api('/student/grades/:applicationId'),
    route(({ user, params }) => backend.studentGradeDetail(user, params.applicationId!)),
  ),

  // Mock-only
  http.post(api('/__mock/reset'), route(() => backend.resetMockData())),
]
