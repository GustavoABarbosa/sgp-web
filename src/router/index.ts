import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { mockApi } from '@/mock/mockApi'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register/:role',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { guest: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { guest: true },
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('@/views/public/JoinClassView.vue'),
      meta: { public: true },
    },
    {
      path: '/gabarito/:publicCode',
      name: 'public-answer-key',
      component: () => import('@/views/public/AnswerKeyView.vue'),
      meta: { public: true },
    },
    {
      path: '/professor',
      component: () => import('@/layouts/ProfessorLayout.vue'),
      meta: { requiresAuth: true, role: 'professor' },
      children: [
        { path: '', redirect: '/professor/dashboard' },
        {
          path: 'dashboard',
          name: 'professor-dashboard',
          component: () => import('@/views/professor/DashboardView.vue'),
        },
        {
          path: 'questions',
          name: 'questions',
          component: () => import('@/views/professor/questions/QuestionListView.vue'),
        },
        {
          path: 'questions/new',
          name: 'question-new',
          component: () => import('@/views/professor/questions/QuestionFormView.vue'),
        },
        {
          path: 'questions/:id/edit',
          name: 'question-edit',
          component: () => import('@/views/professor/questions/QuestionFormView.vue'),
        },
        {
          path: 'classes',
          name: 'classes',
          component: () => import('@/views/professor/classes/ClassListView.vue'),
        },
        {
          path: 'classes/new',
          name: 'class-new',
          component: () => import('@/views/professor/classes/ClassFormView.vue'),
        },
        {
          path: 'classes/:id',
          name: 'class-detail',
          component: () => import('@/views/professor/classes/ClassDetailView.vue'),
        },
        {
          path: 'exams',
          name: 'exams',
          component: () => import('@/views/professor/exams/ExamListView.vue'),
        },
        {
          path: 'exams/new',
          name: 'exam-new',
          component: () => import('@/views/professor/exams/ExamFormView.vue'),
        },
        {
          path: 'exams/:id/edit',
          name: 'exam-edit',
          component: () => import('@/views/professor/exams/ExamFormView.vue'),
        },
        {
          path: 'applications',
          name: 'applications',
          component: () => import('@/views/professor/applications/ApplicationListView.vue'),
        },
        {
          path: 'applications/new',
          name: 'application-new',
          component: () => import('@/views/professor/applications/ApplicationFormView.vue'),
        },
        {
          path: 'applications/:id',
          name: 'application-detail',
          component: () => import('@/views/professor/applications/ApplicationDetailView.vue'),
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/views/professor/reports/ReportsView.vue'),
        },
        {
          path: 'profile',
          name: 'professor-profile',
          component: () => import('@/views/shared/ProfileView.vue'),
        },
      ],
    },
    {
      path: '/aluno',
      component: () => import('@/layouts/StudentLayout.vue'),
      meta: { requiresAuth: true, role: 'estudante' },
      children: [
        { path: '', redirect: '/aluno/dashboard' },
        {
          path: 'dashboard',
          name: 'student-dashboard',
          component: () => import('@/views/student/DashboardView.vue'),
        },
        {
          path: 'exams',
          name: 'student-exams',
          component: () => import('@/views/student/ExamsView.vue'),
        },
        {
          path: 'grades',
          name: 'student-grades',
          component: () => import('@/views/student/GradesView.vue'),
        },
        {
          path: 'grades/:applicationId',
          name: 'student-grade-detail',
          component: () => import('@/views/student/GradeDetailView.vue'),
        },
        {
          path: 'profile',
          name: 'student-profile',
          component: () => import('@/views/shared/ProfileView.vue'),
        },
      ],
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/errors/ForbiddenView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/errors/NotFoundView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.user && !to.meta.public && !to.meta.guest) {
    if (mockApi.getCurrentUser()) await auth.init()
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return auth.isProfessor ? '/professor/dashboard' : '/aluno/dashboard'
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return '/403'
  }

  return true
})

export default router
