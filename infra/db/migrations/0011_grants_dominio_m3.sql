-- soma_app precisa de GRANT explícito em toda tabela nova — RLS FORCE +
-- ausência de GRANT é "sem acesso", não "acesso total" (mesmo padrão de
-- 0004_papel_app_e_grants.sql).
GRANT SELECT, INSERT, UPDATE ON tabela_preco TO soma_app;
GRANT SELECT, INSERT ON tabela_preco_linha TO soma_app;
GRANT SELECT, INSERT ON tabela_preco_adicional TO soma_app;
GRANT SELECT, INSERT ON tabela_preco_degrau TO soma_app;
GRANT SELECT, INSERT, UPDATE ON matricula TO soma_app;
GRANT SELECT, INSERT ON veredito TO soma_app;
GRANT SELECT, INSERT ON idempotencia TO soma_app;
