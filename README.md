# SGP Católica — Frontend Web

SPA em **Vue 3 + Vite** para professores e alunos. Dados mockados em JSON (localStorage) seguindo o modelo do spec v1.10.

## Stack

- Vue 3, TypeScript, Vue Router, Pinia
- Tailwind CSS v4 (utility classes directly in templates)
- Vitest para testes unitários

## Como rodar

```bash
cd sgp-web
npm install
npm run dev
```

Acesse `http://localhost:5173`

## Credenciais demo

| Papel     | E-mail                       | Senha     |
| --------- | ---------------------------- | --------- |
| Professor | professor1@catolicasc.org.br | senha1234 |
| Aluno     | aluno1@catolicasc.edu.br     | senha1234 |

Na tela de login, use os botões **Professor demo** / **Aluno demo**.

## Funcionalidades (MVP mock)

### Professor

- Auth (cadastro, login, logout, logout-all, recuperação de senha, anonimização LGPD)
- CRUD de questões (objetiva/discursiva, Markdown básico, tags)
- Turmas (matrícula, código convite, join público)
- Provas (builder até 20 questões, soma de pontos informativa)
- Aplicações (criar, timeline, gerar PDF, versões, gabarito)
- Lançamento manual de notas (correções pendentes)
- Relatórios (stats, distribuição, export mock)

### Aluno

- Provas atribuídas, histórico de notas, detalhe com gabarito (se publicado)
- Gráfico simples de evolução (CSS bars)

### Público

- `/join` — matrícula por código de convite
- `/gabarito/:publicCode` — consulta de gabarito publicado

## Estrutura

```
src/
  mock/          # initialDb.ts + mockApi.ts (simula todos os endpoints)
  types/         # Interfaces alinhadas ao spec
  stores/        # Pinia (auth)
  router/        # Rotas + guards por role
  layouts/       # Professor (sidebar) e Aluno (header)
  views/         # Páginas por feature
  shared/        # utils, api client (futuro)
```

## Integração com API real

Quando o backend estiver disponível:

1. Copie `.env.example` → `.env`
2. Configure `VITE_API_BASE_URL`
3. Defina `VITE_USE_MOCKS=false`
4. Substitua chamadas `mockApi.*` pelo `apiFetch` em `src/shared/api/client.ts`

## Reset de dados mock

Perfil → **Resetar dados mock** (restaura `initialDb.ts`).

## Scripts

| Comando         | Descrição                   |
| --------------- | --------------------------- |
| `npm run dev`   | Servidor de desenvolvimento |
| `npm run build` | Build de produção           |
| `npm run test`  | Testes Vitest               |
