-- PRD §8.1 — matricula: snapshot do pedido em jsonb, status, tabela_preco_id.
-- Escopo M3 (decisão registrada): aluno/pessoa/vinculo/ficha_saude
-- normalizados ficam para quando M4 (documentos) definir os requisitos
-- reais de join (ex.: rematrícula reaproveitando cadastro). Até lá,
-- pedido_snapshot (validado contra Pedido.strict() na API) é a única
-- fonte de verdade do pedido.
--
-- testemunhas e prescricao_anexo_id são o Contexto por-matrícula (I-6):
-- só a API grava esses campos, e só quando o papel atuante é DIRECAO
-- (testemunhas) — nunca a partir do corpo cru do cliente sem checagem.
--
-- consentimentos_historico é jsonb *append-only* (nunca mutado in-place):
-- array de decisões por canal com vigência. Revogação sempre ACRESCENTA
-- uma entrada nova (PRD §14: "revogação é evento novo, nunca edição do
-- anterior"). A API materializa o Record<Canal,boolean> mais recente por
-- canal antes de chamar avalia() — packages/schemas/motor não mudam.
CREATE TYPE matricula_status AS ENUM ('RASCUNHO', 'INCOMPLETO', 'BLOQUEADO', 'LIBERADO');
CREATE TYPE matricula_tipo AS ENUM ('MATRICULA', 'REMATRICULA');

CREATE TABLE matricula (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id                uuid NOT NULL REFERENCES escola(id),
  ano_letivo               integer NOT NULL,
  tipo                     matricula_tipo NOT NULL,
  status                   matricula_status NOT NULL DEFAULT 'RASCUNHO',
  pedido_snapshot          jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Sem FK de propósito: a tabela `anexo` é M4. Uma FK real entra quando
  -- `anexo` existir; até lá é um uuid solto, validado como formato apenas.
  prescricao_anexo_id      uuid,
  testemunhas              jsonb NOT NULL DEFAULT '[]'::jsonb,
  consentimentos_historico jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_por               uuid NOT NULL REFERENCES usuario(id),
  criado_em                timestamptz NOT NULL DEFAULT now(),
  atualizado_em            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX matricula_escola_ano_idx ON matricula (escola_id, ano_letivo);

ALTER TABLE matricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE matricula FORCE ROW LEVEL SECURITY;
CREATE POLICY matricula_isolamento ON matricula
  USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);
