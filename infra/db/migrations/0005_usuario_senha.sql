-- M3 (decisão do time) — autenticação JWT própria (email + senha), sem
-- provedor terceiro. bcryptjs (puro JS) evita módulo nativo no monorepo;
-- custo de hash 12 (padrão atual). Tabela usuario ainda não tem linhas
-- reais neste estágio do projeto — por isso a coluna pode nascer NOT NULL
-- sem passo de backfill.
ALTER TABLE usuario ADD COLUMN senha_hash text NOT NULL;

-- Formato bcrypt: $2a$/$2b$/$2y$, custo de 2 dígitos, 53 chars de sal+hash.
ALTER TABLE usuario ADD CONSTRAINT usuario_senha_hash_formato
  CHECK (senha_hash ~ '^\$2[aby]\$\d{2}\$.{53}$');
