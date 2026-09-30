import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import type { UserRole } from "@/types";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    guest?: boolean;
    public?: boolean;
    requiresAuth?: boolean;
    role?: UserRole;
    centered?: boolean;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/layouts/AuthLayout.vue"),
      children: [
        { path: "", redirect: "/login" },
        {
          path: "/login",
          name: "login",
          component: () => import("@/views/auth/Login.vue"),
          meta: { guest: true, title: "Entrar" },
        },
        {
          path: "/register/:role(professor|estudante)",
          name: "register",
          component: () => import("@/views/auth/Register.vue"),
          meta: { guest: true, title: "Cadastro" },
        },
        {
          path: "/forgot-password",
          name: "forgot-password",
          component: () => import("@/views/auth/ForgotPassword.vue"),
          meta: { guest: true, title: "Recuperar senha" },
        },
        {
          path: "/reset-password",
          name: "reset-password",
          component: () => import("@/views/auth/ResetPassword.vue"),
          meta: { guest: true, title: "Nova senha" },
        },
        {
          path: "/join",
          name: "join",
          component: () => import("@/views/public/JoinClass.vue"),
          meta: { public: true, title: "Entrar na turma" },
        },
        {
          path: "/403",
          name: "forbidden",
          component: () => import("@/views/errors/Forbidden.vue"),
          meta: { public: true, centered: true, title: "Acesso negado" },
        },
        {
          path: "/:pathMatch(.*)*",
          name: "not-found",
          component: () => import("@/views/errors/NotFound.vue"),
          meta: { public: true, centered: true, title: "Página não encontrada" },
        },
      ],
    },
    {
      path: "/gabarito/:publicCode",
      name: "public-answer-key",
      component: () => import("@/views/public/AnswerKey.vue"),
      meta: { public: true, title: "Gabarito" },
    },
    {
      path: "/professor",
      component: () => import("@/layouts/ProfessorLayout.vue"),
      meta: { requiresAuth: true, role: "professor" },
      children: [
        { path: "", redirect: "/professor/dashboard" },
        {
          path: "dashboard",
          name: "professor-dashboard",
          component: () => import("@/views/professor/Dashboard.vue"),
          meta: { title: "Início" },
        },
        {
          path: "questions",
          name: "questions",
          component: () => import("@/views/professor/questions/QuestionList.vue"),
          meta: { title: "Questões" },
        },
        {
          path: "questions/new",
          name: "question-new",
          component: () => import("@/views/professor/questions/QuestionForm.vue"),
          meta: { title: "Nova questão" },
        },
        {
          path: "questions/:id/edit",
          name: "question-edit",
          component: () => import("@/views/professor/questions/QuestionForm.vue"),
          meta: { title: "Editar questão" },
        },
        {
          path: "classes",
          name: "classes",
          component: () => import("@/views/professor/classes/ClassList.vue"),
          meta: { title: "Turmas" },
        },
        {
          path: "classes/new",
          name: "class-new",
          component: () => import("@/views/professor/classes/ClassForm.vue"),
          meta: { title: "Nova turma" },
        },
        {
          path: "classes/:id",
          name: "class-detail",
          component: () => import("@/views/professor/classes/ClassDetail.vue"),
          meta: { title: "Turma" },
        },
        {
          path: "exams",
          name: "exams",
          component: () => import("@/views/professor/exams/ExamList.vue"),
          meta: { title: "Provas" },
        },
        {
          path: "exams/new",
          name: "exam-new",
          component: () => import("@/views/professor/exams/ExamForm.vue"),
          meta: { title: "Nova prova" },
        },
        {
          path: "exams/:id/edit",
          name: "exam-edit",
          component: () => import("@/views/professor/exams/ExamForm.vue"),
          meta: { title: "Editar prova" },
        },
        {
          path: "applications",
          name: "applications",
          component: () => import("@/views/professor/applications/ApplicationList.vue"),
          meta: { title: "Aplicações" },
        },
        {
          path: "applications/new",
          name: "application-new",
          component: () => import("@/views/professor/applications/ApplicationForm.vue"),
          meta: { title: "Nova aplicação" },
        },
        {
          path: "applications/:id",
          name: "application-detail",
          component: () => import("@/views/professor/applications/ApplicationDetail.vue"),
          meta: { title: "Aplicação" },
        },
        {
          path: "reports",
          name: "reports",
          component: () => import("@/views/professor/reports/Reports.vue"),
          meta: { title: "Relatórios" },
        },
        {
          path: "profile",
          name: "professor-profile",
          component: () => import("@/views/shared/Profile.vue"),
          meta: { title: "Meu perfil" },
        },
      ],
    },
    {
      path: "/aluno",
      component: () => import("@/layouts/StudentLayout.vue"),
      meta: { requiresAuth: true, role: "estudante" },
      children: [
        { path: "", redirect: "/aluno/dashboard" },
        {
          path: "dashboard",
          name: "student-dashboard",
          component: () => import("@/views/student/Dashboard.vue"),
          meta: { title: "Início" },
        },
        {
          path: "exams",
          name: "student-exams",
          component: () => import("@/views/student/Exams.vue"),
          meta: { title: "Minhas provas" },
        },
        {
          path: "grades",
          name: "student-grades",
          component: () => import("@/views/student/Grades.vue"),
          meta: { title: "Histórico de notas" },
        },
        {
          path: "grades/:applicationId",
          name: "student-grade-detail",
          component: () => import("@/views/student/GradeDetail.vue"),
          meta: { title: "Detalhe da nota" },
        },
        {
          path: "profile",
          name: "student-profile",
          component: () => import("@/views/shared/Profile.vue"),
          meta: { title: "Meu perfil" },
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.guest && auth.isAuthenticated) {
    return auth.homePath;
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return { name: "forbidden" };
  }

  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · SGP Católica` : "SGP Católica";
});

export default router;
