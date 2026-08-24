-- Papel de aplicação restrito (PRD §14). A senha real nunca fica neste
-- arquivo: o runner (infra/db/scripts/migrate.mjs) substitui o token
-- __APP_DB_PASSWORD__ pelo valor de APP_DB_PASSWORD antes de executar —
-- o texto abaixo é o que fica versionado no git.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'soma_app') THEN
    CREATE ROLE soma_app LOGIN PASSWORD '__APP_DB_PASSWORD__';
  END IF;
END
$$;

-- CONNECT no banco já é concedido a PUBLIC por padrão pelo Postgres; não
-- há GRANT ON DATABASE aqui de propósito.
GRANT USAGE ON SCHEMA public TO soma_app;

GRANT SELECT, INSERT, UPDATE ON escola TO soma_app;

GRANT SELECT, INSERT, UPDATE ON usuario TO soma_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON usuario_papel TO soma_app;

-- soma_app só pode avançar o contador, nunca trocar de qual escola é a
-- linha (privilégio de coluna, não de tabela inteira).
GRANT SELECT ON escola_ledger_seq TO soma_app;
GRANT UPDATE (proximo_seq, atualizado_em) ON escola_ledger_seq TO soma_app;

-- PRD §10/§14 — o cerne do M2: leitura e inserção, nunca alteração.
GRANT SELECT, INSERT ON ledger_evento TO soma_app;
REVOKE UPDATE, DELETE ON ledger_evento FROM soma_app;
REVOKE UPDATE, DELETE ON ledger_evento FROM PUBLIC;
