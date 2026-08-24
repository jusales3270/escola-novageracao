-- PRD §10 — cadeia de evidência. "seq é sequência por escola, atribuída
-- sob SELECT ... FOR UPDATE na linha de controle do tenant" — esta tabela
-- é literalmente essa linha de controle.
CREATE TABLE escola_ledger_seq (
  escola_id     uuid PRIMARY KEY REFERENCES escola(id),
  proximo_seq   integer NOT NULL DEFAULT 1,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escola_ledger_seq_positivo CHECK (proximo_seq >= 1)
);

-- Toda escola nasce com sua linha de controle já existindo — registra()
-- nunca precisa criar essa linha sob demanda (evita corrida no primeiro
-- evento de uma escola nova).
CREATE FUNCTION cria_controle_seq_ledger() RETURNS trigger AS $$
BEGIN
  INSERT INTO escola_ledger_seq (escola_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER escola_cria_controle_seq
  AFTER INSERT ON escola
  FOR EACH ROW EXECUTE FUNCTION cria_controle_seq_ledger();

ALTER TABLE escola_ledger_seq ENABLE ROW LEVEL SECURITY;
ALTER TABLE escola_ledger_seq FORCE ROW LEVEL SECURITY;
CREATE POLICY escola_ledger_seq_isolamento ON escola_ledger_seq
  USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);

-- PRD §10 — tipos de evento, literais.
CREATE TYPE ledger_tipo_evento AS ENUM (
  'PEDIDO_RECEBIDO', 'VEREDITO_MOTOR', 'CONSENTIMENTO_REGISTRADO',
  'CONSENTIMENTO_REVOGADO', 'DOCUMENTO_GERADO', 'ENVELOPE_ENVIADO',
  'ENVELOPE_ENTREGUE', 'ASSINATURA_CONCLUIDA', 'ENVELOPE_RECUSADO',
  'ENVELOPE_ANULADO', 'DOCUMENTO_ARQUIVADO', 'TABELA_APROVADA',
  'ALTERACAO_CONTRATUAL'
);

-- payload é `json`, NÃO `jsonb`: jsonb reordena chaves e não preserva o
-- texto de entrada — quebraria a verificação de hash a cada leitura,
-- mesmo sem qualquer adulteração. `json` guarda o texto exato inserido.
-- `em` é `text` com o ISO-8601 canônico exato usado no hash (não
-- `timestamptz` — além do cast texto→timestamptz depender do TimeZone da
-- sessão, o que o tornaria não-IMMUTABLE e inviável numa coluna gerada,
-- guardar o texto exato é o que garante reproduzir o material hasheado
-- byte a byte). Ordenação/índice por data usam o próprio `em`: ISO-8601
-- UTC com campos de largura fixa ordena lexicograficamente igual à ordem
-- cronológica, então um índice de texto simples já serve.
-- `matricula_id` é opcional: eventos de escola (ex.: TABELA_APROVADA) não
-- têm matrícula associada.
CREATE TABLE ledger_evento (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id      uuid NOT NULL REFERENCES escola(id),
  seq            integer NOT NULL,
  em             text NOT NULL,
  tipo           ledger_tipo_evento NOT NULL,
  ator           text NOT NULL,
  matricula_id   uuid,
  payload        json NOT NULL,
  hash_anterior  text NOT NULL,
  hash           text NOT NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_evento_seq_por_escola UNIQUE (escola_id, seq),
  CONSTRAINT ledger_evento_seq_positivo CHECK (seq >= 1),
  CONSTRAINT ledger_evento_em_iso8601_ms
    CHECK (em ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$'),
  CONSTRAINT ledger_evento_hash_hex64 CHECK (hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT ledger_evento_hash_anterior_hex64 CHECK (hash_anterior ~ '^[0-9a-f]{64}$')
);

CREATE INDEX ledger_evento_escola_matricula_idx
  ON ledger_evento (escola_id, matricula_id);

CREATE INDEX ledger_evento_escola_em_idx
  ON ledger_evento (escola_id, em);

-- I-4/I-5 e PRD §10 — trigger BEFORE UPDATE OR DELETE. Dispara para
-- qualquer role, incluindo o dono da tabela — só ALTER TABLE ... DISABLE
-- TRIGGER (privilégio de dono/superuser) desliga isso, nunca um GRANT.
CREATE FUNCTION ledger_evento_bloqueia_alteracao() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION
    'ledger_evento é append-only — % não é permitido (escola_id=%, seq=%)',
    TG_OP, OLD.escola_id, OLD.seq
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_evento_append_only
  BEFORE UPDATE OR DELETE ON ledger_evento
  FOR EACH ROW EXECUTE FUNCTION ledger_evento_bloqueia_alteracao();

ALTER TABLE ledger_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_evento FORCE ROW LEVEL SECURITY;

CREATE POLICY ledger_evento_select_por_escola ON ledger_evento
  FOR SELECT USING (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);

CREATE POLICY ledger_evento_insert_por_escola ON ledger_evento
  FOR INSERT WITH CHECK (escola_id = NULLIF(current_setting('app.escola_id', true), '')::uuid);

-- Sem política de UPDATE/DELETE: a ausência de política, combinada com
-- FORCE ROW LEVEL SECURITY e o REVOKE explícito na migration seguinte, é
-- a segunda camada de proteção — a primeira é o trigger acima.
