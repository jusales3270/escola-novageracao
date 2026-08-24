# @somaverso/ledger

Cadeia de evidência append-only, encadeada por hash (PRD §10), sobre
Postgres. Implementa `registra()` e `verifica()`.

- `registra(pool, escolaId, evento)` — grava um evento sob `SELECT ...
  FOR UPDATE` na linha de controle de sequência da escola
  (`escola_ledger_seq`), calcula o hash a partir da serialização canônica
  (`src/canonico.ts`) e insere em `ledger_evento`.
- `verifica(pool, escolaId)` — percorre a cadeia da escola, recalcula cada
  hash e retorna `{ integra: true }` ou `{ integra: false, rompeuEm: seq }`.

A tabela `ledger_evento` é protegida em duas camadas independentes contra
alteração (D-09, I-4, I-5): um trigger `BEFORE UPDATE OR DELETE` que
levanta exceção para qualquer role, e `REVOKE UPDATE, DELETE` do papel de
aplicação (`soma_app`). Ver `infra/db/migrations/0003_ledger_evento.sql`
e `0004_papel_app_e_grants.sql`.

## Rodando os testes

Testes unitários (`src/canonico.ts`, `src/hash.ts`) não precisam de banco:

```bash
pnpm --filter @somaverso/ledger test
```

Testes de integração precisam do Postgres local de pé e migrado:

```bash
pnpm db:up
pnpm db:migrate
pnpm --filter @somaverso/ledger test:integration
```
