# infra/db (stub — M2)

Migrations SQL, RLS e triggers Postgres 16 (PRD §6, §8.1, §14).

## Checklist de entidades a migrar (PRD §8.1)

- [ ] `escola` — tenant; toda tabela carrega `escola_id`.
- [ ] `usuario`, `usuario_papel` — RBAC de §5.
- [ ] `aluno`
- [ ] `pessoa` — responsáveis, autorizados, testemunhas; CPF normalizado (11 dígitos).
- [ ] `vinculo` — (aluno, pessoa, tipo: LEGAL | FINANCEIRO | AUTORIZADO_RETIRADA).
- [ ] `ficha_saude` — dado sensível (LGPD art. 14); cifrado em repouso.
- [ ] `anexo` — sha256, mime, bytes, antivírus.
- [ ] `tabela_preco`, `tabela_preco_linha`, `tabela_preco_adicional`, `tabela_preco_degrau`.
- [ ] `matricula` — snapshot do pedido em jsonb.
- [ ] `veredito` — motor_versao, decisao, vereditos[] em jsonb, hash.
- [ ] `consentimento` — canal, concedido, vigencia_inicio/fim, evento_id.
- [ ] `documento` — sha256, storage_uri, bytes.
- [ ] `envelope`, `signatario`.
- [ ] `ledger_evento` — append-only, encadeado (§10); sem UPDATE/DELETE para qualquer papel de aplicação.
- [ ] `idempotencia` — chave, rota, resposta, expira_em.

## RLS (PRD §14)

Política por `escola_id` derivada do JWT em
`current_setting('app.escola_id')`; políticas de leitura/escrita por papel.
