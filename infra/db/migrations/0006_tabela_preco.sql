-- PRD §7/§8.1 — tabela_preco versionada. Sem aprovadaPor, motor bloqueia
-- em R-07. UNIQUE parcial (não total) em (escola_id, ano_letivo): permite
-- rascunhos múltiplos de um mesmo ano antes da aprovação (correção sem
-- UPDATE, já que não existe PATCH /tabelas-preco/:id no §15), mas só uma
-- pode estar aprovada por ano letivo.
CREATE TYPE tabela_preco_status AS ENUM ('RASCUNHO', 'APROVADA');

CREATE TABLE tabela_preco (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id                 uuid NOT NULL REFERENCES escola(id),
  ano_letivo                integer NOT NULL,
  vigencia_inicio           date NOT NULL,
  status                    tabela_preco_status NOT NULL DEFAULT 'RASCUNHO',
  -- aprovada_por_usuario_id é a FK real para integridade; a API resolve o
  -- nome do usuário na leitura para preencher TabelaPreco.aprovadaPor
  -- (string) do @somaverso/schemas sem quebrar esse contrato Zod.
  aprovada_por_usuario_id   uuid REFERENCES usuario(id),
  aprovada_em               timestamptz,
  parcelas                  integer NOT NULL,
  desconto_pontualidade_pct numeric(5,2) NOT NULL,
  matricula_cheia           numeric(10,2) NOT NULL,
  hash_conteudo             text NOT NULL,
  criado_por                uuid NOT NULL REFERENCES usuario(id),
  criado_em                 timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tabela_preco_ano_positivo CHECK (ano_letivo >= 2000),
  CONSTRAINT tabela_preco_aprovacao_coerente
    CHECK ((status = 'APROVADA') = (aprovada_por_usuario_id IS NOT NULL AND aprovada_em IS NOT NULL))
);

CREATE UNIQUE INDEX tabela_preco_uma_aprovada_por_ano
  ON tabela_preco (escola_id, ano_letivo)
  WHERE status = 'APROVADA';

CREATE TABLE tabela_preco_linha (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id                   uuid NOT NULL REFERENCES escola(id),
  tabela_preco_id             uuid NOT NULL REFERENCES tabela_preco(id) ON DELETE CASCADE,
  faixa                       text NOT NULL,
  periodo                     text NOT NULL,
  mensalidade                 numeric(10,2) NOT NULL,
  anuidade_declarada_contrato numeric(10,2) NOT NULL,
  alimentacao_inclusa         boolean NOT NULL,
  descricao_contrato          text NOT NULL,
  CONSTRAINT tabela_preco_linha_faixa_valida CHECK (faixa IN ('BERCARIO','MINI_MATERNAL','MATERNAL_JARDIM_ALFA')),
  CONSTRAINT tabela_preco_linha_periodo_valido CHECK (periodo IN ('MEIO','INTEGRAL')),
  CONSTRAINT tabela_preco_linha_unica UNIQUE (tabela_preco_id, faixa, periodo)
);

CREATE TABLE tabela_preco_adicional (
  tabela_preco_id    uuid PRIMARY KEY REFERENCES tabela_preco(id) ON DELETE CASCADE,
  escola_id          uuid NOT NULL REFERENCES escola(id),
  hora_adicional     numeric(10,2) NOT NULL,
  almoco             numeric(10,2) NOT NULL,
  almoco_jantar      numeric(10,2) NOT NULL,
  almoco_ou_jantar   numeric(10,2) NOT NULL,
  fraldario_meio     numeric(10,2) NOT NULL,
  fraldario_integral numeric(10,2) NOT NULL,
  fraldario_avulso   numeric(10,2) NOT NULL
);

CREATE TABLE tabela_preco_degrau (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id        uuid NOT NULL REFERENCES escola(id),
  tabela_preco_id  uuid NOT NULL REFERENCES tabela_preco(id) ON DELETE CASCADE,
  chave            text NOT NULL,
  pct              numeric(5,2) NOT NULL,
  parcelas         integer NOT NULL,
  valor_declarado  numeric(10,2) NOT NULL,
  CONSTRAINT tabela_preco_degrau_unico UNIQUE (tabela_preco_id, chave)
);

-- RLS — mesmo padrão de 0002_usuario.sql em todas as quatro tabelas.
ALTER TABLE tabela_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabela_preco FORCE ROW LEVEL SECURITY;
CREATE POLICY tabela_preco_isolamento ON tabela_preco
  USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);

ALTER TABLE tabela_preco_linha ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabela_preco_linha FORCE ROW LEVEL SECURITY;
CREATE POLICY tabela_preco_linha_isolamento ON tabela_preco_linha
  USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);

ALTER TABLE tabela_preco_adicional ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabela_preco_adicional FORCE ROW LEVEL SECURITY;
CREATE POLICY tabela_preco_adicional_isolamento ON tabela_preco_adicional
  USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);

ALTER TABLE tabela_preco_degrau ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabela_preco_degrau FORCE ROW LEVEL SECURITY;
CREATE POLICY tabela_preco_degrau_isolamento ON tabela_preco_degrau
  USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);
