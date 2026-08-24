-- PRD I-6/§18.6 — DPA é estado do servidor a nível de escola (controlador/
-- operador), não por matrícula. Nenhuma rota de M3 expõe escrita destes
-- campos: §18.6 é uma pendência jurídica ainda não resolvida — o sistema
-- não oferece nem um caminho de self-service para marcá-la, só leitura
-- indireta via R-12. Alteração é manual (SQL direto pela role migradora)
-- até essa decisão ser tomada pela assessoria jurídica do cliente.
ALTER TABLE escola ADD COLUMN dpa_assinado_em timestamptz;
ALTER TABLE escola ADD COLUMN dpa_assinado_por text;
