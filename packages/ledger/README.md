# @somaverso/ledger (stub — M2)

Cadeia de evidência append-only, encadeada por hash (PRD §10). Este stub só
declara o shape de `Evento` para `apps/api` poder tipar contra ele cedo.

**Implementação real (M2):**
- Postgres, não estrutura em memória (D-09).
- `seq` por escola, atribuído sob `SELECT ... FOR UPDATE` na linha de
  controle do tenant.
- Trigger `BEFORE UPDATE OR DELETE ON ledger_evento` levanta exceção;
  `REVOKE UPDATE, DELETE` do papel da aplicação.
- Serialização canônica obrigatória para o hash: chaves na ordem declarada
  em `Evento`, sem espaços, UTF-8, timestamps ISO-8601 UTC com
  milissegundos — qualquer variação quebra a verificação.
- Job diário + endpoint `GET /v1/ledger/verificacao` sob demanda.
