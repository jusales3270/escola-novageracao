-- PRD §5 — RBAC. SISTEMA não é papel atribuível a um usuário (é o "ator"
-- de eventos automáticos do motor/fila/webhook — ver ledger_evento.ator),
-- por isso não entra neste enum.
CREATE TYPE papel_usuario AS ENUM ('SECRETARIA', 'COORDENACAO', 'DIRECAO', 'AUDITOR');

CREATE TABLE usuario (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id  uuid NOT NULL REFERENCES escola(id),
  nome       text NOT NULL,
  email      text NOT NULL,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usuario_nome_minimo CHECK (char_length(nome) >= 3),
  CONSTRAINT usuario_email_por_escola UNIQUE (escola_id, email)
);

CREATE TABLE usuario_papel (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  escola_id  uuid NOT NULL REFERENCES escola(id),
  papel      papel_usuario NOT NULL,
  criado_em  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usuario_papel_unico UNIQUE (usuario_id, papel)
);

-- PRD §14 — RLS por escola_id derivado do JWT em
-- current_setting('app.escola_id'). NULLIF(..., '') cobre variável setada
-- como string vazia; o `true` em current_setting evita erro quando a
-- variável nunca foi definida (retorna NULL) — em ambos os casos a
-- comparação com escola_id dá false: falha fechado por padrão.
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario FORCE ROW LEVEL SECURITY;
CREATE POLICY usuario_isolamento_por_escola ON usuario
  USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);

ALTER TABLE usuario_papel ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_papel FORCE ROW LEVEL SECURITY;
CREATE POLICY usuario_papel_isolamento_por_escola ON usuario_papel
  USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);
