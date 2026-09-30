import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { db, resetDb } from '@/mock/db'
import { DEMO_CREDENTIALS } from '@/mock/demoCredentials'
import { session } from '@/shared/api/session'

const IconStub = defineComponent({ render: () => h('i') })
const body = new DOMWrapper(document.body)
let wrapper: VueWrapper | null = null

async function renderApp(path: string, { asProfessor = false } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  if (asProfessor) {
    const { email, password } = DEMO_CREDENTIALS.professor
    await useAuthStore().login(email, password)
  }
  wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [pinia, router], components: { Icon: IconStub } },
  })
  await router.push(path)
  await flushPromises()
  return wrapper
}

async function find(selector: string, text?: string) {
  return vi.waitFor(() => {
    const match = body.findAll(selector).find((el) => text === undefined || el.text().includes(text))
    if (!match) throw new Error(`Not found: ${selector} ${text ?? ''}`)
    return match
  })
}

async function field(label: string) {
  const el = await find('label', label)
  return body.find(`[id="${el.attributes('for')}"]`)
}

async function waitForPath(path: string) {
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(path))
}

beforeEach(() => {
  resetDb()
  session.clear()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('user flows', () => {
  it('logs in with the demo professor and follows a safe redirect', async () => {
    await renderApp('/login?redirect=/professor/exams')

    await (await find('button', 'Professor demo')).trigger('click')
    await (await find('button[type="submit"]', 'Entrar')).trigger('submit')

    await waitForPath('/professor/exams')
    expect(document.title).toBe('Provas · SGP Católica')
  })

  it('creates an objective question', async () => {
    await renderApp('/professor/questions/new', { asProfessor: true })

    await (await find('#statement')).setValue('Quanto é 2 + 2?')
    await (await find('textarea[aria-label="Texto da alternativa 1"]')).setValue('3')
    await (await find('textarea[aria-label="Texto da alternativa 2"]')).setValue('4')
    await body.findAll('input[type="radio"]')[1]!.setValue(true)
    await (await find('button[type="submit"]', 'Salvar')).trigger('submit')

    await waitForPath('/professor/questions')
    const created = db().questions.find((q) => q.statement === 'Quanto é 2 + 2?')
    expect(created?.alternatives?.map((a) => a.text)).toEqual(['3', '4'])
    expect(created?.correctAlternativeId).toBe(created?.alternatives?.[1]?.id)
  })

  it('builds an exam from the question bank', async () => {
    await renderApp('/professor/exams/new', { asProfessor: true })

    await (await field('Título')).setValue('Prova de fluxo')
    await (await find('button', 'Adicionar questão')).trigger('click')
    await (await find('button[aria-label^="Adicionar questão:"]')).trigger('click')
    await (await find('button[type="submit"]', 'Salvar prova')).trigger('submit')

    await waitForPath('/professor/exams')
    const exam = db().exams.find((e) => e.title === 'Prova de fluxo')
    expect(exam?.questions).toHaveLength(1)
    expect(exam?.questions[0]?.order).toBe(1)
  })

  it('assigns a pending correction to a student', async () => {
    const app = db().applications.find((a) => a.id === 'app-001')!
    const graded = new Set(db().corrections.filter((c) => c.applicationId === app.id).map((c) => c.studentId))
    const student = db().enrollments.find(
      (e) => e.classId === app.classId && e.status === 'active' && !graded.has(e.studentId),
    )!

    await renderApp(`/professor/applications/${app.id}`, { asProfessor: true })

    await (await find('button', 'Atribuir aluno')).trigger('click')
    await (await field('Aluno da turma')).setValue(student.studentId)
    await (await find('dialog form')).trigger('submit')

    await vi.waitFor(() => {
      expect(db().corrections.find((c) => c.id === 'cor-002')?.studentId).toBe(student.studentId)
    })
  })
})
