# SGP Católica — Frontend Web

SPA em **Vue 3 + Vite** para professores e alunos. Enquanto a API não existe, todas as requisições HTTP são interceptadas pelo [MSW](https://mswjs.io/) e respondidas por um backend simulado que persiste em `localStorage`, seguindo o modelo do spec v1.10.

## Stack

- Vue 3, TypeScript, Vue Router, Pinia
- Tailwind CSS v4 (classes utilitárias nos templates)
- Zod para validação de formulários
- MSW para simular a API (navegador e testes)
- Vitest + Vue Test Utils para testes unitários e de fluxo

## Como rodar

```bash
cd sgp-web
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Credenciais demo

| Papel     | E-mail                       | Senha     |
| --------- | ---------------------------- | --------- |
| Professor | professor1@catolicasc.org.br | senha1234 |
| Aluno     | aluno1@catolicasc.edu.br     | senha1234 |

Com os mocks ativos, a tela de login mostra os botões **Professor demo** / **Aluno demo**.

## Funcionalidades

### Professor

- Auth (cadastro, login, logout, logout-all, recuperação de senha, anonimização LGPD)
- Banco de questões paginado (objetiva/discursiva, Markdown básico, tags)
- Turmas (matrícula, código de convite, entrada pública por código)
- Provas (builder com até 20 questões, reordenação por arrastar ou teclado, soma de pontos informativa)
- Aplicações (timeline, geração de até 10 versões, gabaritos públicos, atribuição de correções)
- Relatórios por aplicação ou consolidados, com exportação CSV

### Aluno

- Provas atribuídas, histórico de notas com filtros e gráfico de evolução
- Detalhe da nota com gabarito (quando publicado)

### Público

- `/join?code=` — matrícula por código de convite (cria conta quando necessário)
- `/gabarito/:publicCode` — consulta de gabarito publicado

## Estrutura

```
src/
  api/           # Um módulo por recurso (authApi, questionsApi, ...) sobre apiFetch
  components/    # Componentes base (BaseButton, DataTable, Modal, DropdownMenu, ...)
  layouts/       # Auth, Professor (sidebar) e Aluno (header)
  mock/          # Backend simulado: handlers MSW, regras (backend.ts) e dados (initialDb.ts)
  router/        # Rotas, guards por papel e títulos de página
  shared/        # Cliente HTTP, sessão, markdown, validação (Zod), composables
  stores/        # Pinia (auth, toast)
  types/         # Interfaces alinhadas ao spec
  views/         # Páginas por feature
```

### Fluxo de uma requisição

`view → src/api/*.ts → apiFetch → fetch → (MSW → mock/backend.ts)`

As views nunca importam nada de `src/mock`. Desligar os mocks basta para apontar o app para a API real.

### Sessão

- O access token fica apenas em memória; o refresh token fica em `localStorage` (`sgp-refresh-token`).
- Um `401` dispara um único refresh compartilhado entre requisições concorrentes. Se falhar, o usuário volta ao login com `?redirect=`.
- Quando a API real existir, o refresh token deve migrar para um cookie `httpOnly` + `SameSite`, removendo-o do `localStorage` (veja `BACKEND.md`).

## Integração com a API real

1. Copie `.env.example` → `.env`
2. Configure `VITE_API_BASE_URL`
3. Defina `VITE_USE_MOCKS=false`

Com os mocks desligados, o MSW não é carregado, os botões de demo e o reset de dados somem.

## Reset de dados mock

Perfil → **Resetar dados mock** (restaura `initialDb.ts` e encerra a sessão).

## Scripts

| Comando         | Descrição                                   |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Servidor de desenvolvimento                 |
| `npm run build` | Type-check (`vue-tsc -b`) + build de produção |
| `npm run test`  | Testes Vitest (unitários, backend mock e fluxos) |
