# Checklist — contrato com backend

Preencher com o time backend antes da integração (S2+).

- [ ] OpenAPI 3.x exportado
- [ ] Exemplo `.env` (`VITE_API_BASE_URL`)
- [ ] Fluxo JWT + refresh documentado (body, expiração, rotação)
- [ ] Payloads de erro padronizados
- [ ] Amostra de `pdfUrl` funcional (signed URL? CORS?)
- [ ] Confirmação sobre campo **matrícula** do aluno
- [ ] Padrão de paginação (`page/limit` vs cursor)
- [ ] Cronograma de disponibilidade por endpoint
- [ ] Ambiente staging para testes integrados

## Decisões assumidas no mock

| Tópico | Mock atual |
|--------|------------|
| Auth tokens | `access:{userId}` + refresh em localStorage |
| Paginação | `page/limit`, default 20 |
| PDF | Download simulado (blob texto) |
| Matrícula | Campo `reportedStudentRegistration` só em Correction |
| Edição prova ready | Permitida no mock |
| Application closed | Sem endpoint — omitido na UI |
