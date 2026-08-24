-- PRD §8.1/§15 — POST /matriculas/:id/emissao exige Idempotency-Key.
CREATE TABLE idempotencia (
  escola_id    uuid NOT NULL REFERENCES escola(id),
  rota         text NOT NULL,
  chave        text NOT NULL,
  matricula_id uuid,
  status_code  integer NOT NULL,
  resposta     jsonb NOT NULL,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  expira_em    timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  PRIMARY KEY (escola_id, rota, chave)
);

ALTER TABLE idempotencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotencia FORCE ROW LEVEL SECURITY;
CREATE POLICY idempotencia_isolamento ON idempotencia
  USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);
