-- Postgres exige privilégio UPDATE (não apenas SELECT) para usar
-- `SELECT ... FOR UPDATE` — mesmo que a aplicação nunca emita um UPDATE de
-- verdade em `idempotencia` (as linhas são imutáveis após inseridas). Sem
-- este grant, a checagem de idempotência de POST /matriculas/:id/emissao
-- falha com "permission denied" antes mesmo de tentar bloquear a linha.
GRANT UPDATE ON idempotencia TO soma_app;
