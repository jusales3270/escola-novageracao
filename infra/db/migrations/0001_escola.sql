-- PRD §8.1 — tenant. Toda tabela do domínio carrega escola_id.
-- gen_random_uuid() é função nativa do Postgres desde a versão 13 (core,
-- sem precisar de extensão pgcrypto).
CREATE TABLE escola (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  cnpj       text NOT NULL,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escola_cnpj_formato CHECK (cnpj ~ '^\d{14}$'),
  CONSTRAINT escola_cnpj_unico UNIQUE (cnpj)
);

COMMENT ON TABLE escola IS
  'Tenant raiz (PRD §8.1). Não carrega escola_id — é a própria raiz do isolamento.';
