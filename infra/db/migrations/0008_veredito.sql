-- PRD §8.1/§9/D-11 — hash inclui motor_versao e tabela_preco_id (a API
-- monta esse material antes de gravar; ver apps/api/src/servicos/veredito.ts).
CREATE TYPE veredito_decisao AS ENUM ('LIBERADO', 'BLOQUEADO');

CREATE TABLE veredito (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id       uuid NOT NULL REFERENCES escola(id),
  matricula_id    uuid NOT NULL REFERENCES matricula(id),
  tabela_preco_id uuid NOT NULL REFERENCES tabela_preco(id),
  motor_versao    text NOT NULL,
  decisao         veredito_decisao NOT NULL,
  vereditos       jsonb NOT NULL,
  hash            text NOT NULL,
  criado_por      uuid NOT NULL REFERENCES usuario(id),
  criado_em       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT veredito_hash_hex64 CHECK (hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX veredito_matricula_idx ON veredito (escola_id, matricula_id, criado_em DESC);

ALTER TABLE veredito ENABLE ROW LEVEL SECURITY;
ALTER TABLE veredito FORCE ROW LEVEL SECURITY;
CREATE POLICY veredito_isolamento ON veredito
  USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);
