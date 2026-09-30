# Checklist — contrato com backend

Preencher com o time backend antes da integração (S2+). O contrato implementado hoje pelo mock está em `src/mock/handlers.ts` (rotas) e `src/mock/backend.ts` (regras); os clientes correspondentes estão em `src/api/`.

- [ ] OpenAPI 3.x exportado
- [ ] Exemplo `.env` (`VITE_API_BASE_URL`)
- [ ] Fluxo JWT + refresh documentado (body, expiração, rotação)
- [ ] Refresh token em cookie `httpOnly` + `Secure` + `SameSite` (ver abaixo)
- [ ] Payloads de erro padronizados (`{ message, code }`)
- [ ] Rate limit com `429` + `Retry-After`
- [ ] Amostra de `pdfUrl` funcional (signed URL? CORS?)
- [ ] Confirmação sobre campo **matrícula** do aluno
- [ ] Padrão de paginação (`page/limit` vs cursor)
- [ ] Cronograma de disponibilidade por endpoint
- [ ] Ambiente staging para testes integrados

## Decisões assumidas no mock

| Tópico | Mock atual |
|--------|------------|
| Auth tokens | Access token em memória (`access:{refreshTokenId}`); refresh token rotacionado a cada uso e guardado em `localStorage` |
| Sessão expirada | `401` → um único `POST /auth/refresh`; se falhar, volta ao login com `?redirect=` |
| Erros | `{ message, code }`; códigos usados pela UI: `INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN`, `LOGIN_REQUIRED`, `ACCOUNT_REQUIRED`, `INVALID_RESET_TOKEN` |
| Recuperação de senha | Resposta sempre genérica (não revela se o e-mail existe) |
| Autorização | Todo recurso é filtrado pelo professor dono; turmas arquivadas são somente leitura |
| Entrada por código | `POST /join`: autenticado matricula direto; anônimo com conta existente recebe `409 LOGIN_REQUIRED`; conta nova sem dados recebe `422 ACCOUNT_REQUIRED` |
| Paginação | `page/limit` em `GET /questions` (filtros `type`, `tag`, `tags`, `search`, `ids`) |
| Provas | Até 20 questões, todas do próprio professor |
| PDF | 1 a 10 versões; download simulado como `.txt` |
| Gabarito público | Link só existe após publicação |
| Relatórios | Exportação CSV feita no cliente (`;`, BOM UTF-8, proteção contra fórmulas) |
| Matrícula | Campo `reportedStudentRegistration` só em Correction |
| Edição prova ready | Permitida no mock |
| Application closed | Sem endpoint — omitido na UI |

## Migração do refresh token para cookie `httpOnly`

Hoje o refresh token fica em `localStorage`, o que o expõe a qualquer XSS. Com a API real:

1. `POST /auth/login`, `/auth/register`, `/auth/refresh` e `/join` passam a devolver o refresh token em `Set-Cookie` (`HttpOnly; Secure; SameSite=Strict; Path=/auth`) e apenas o access token no corpo.
2. `apiFetch` passa a enviar `credentials: 'include'` nas rotas de auth.
3. `src/shared/api/session.ts` deixa de ler/escrever `sgp-refresh-token`; `refreshSession()` chama `/auth/refresh` sem body.
4. `/auth/logout` limpa o cookie no servidor.
