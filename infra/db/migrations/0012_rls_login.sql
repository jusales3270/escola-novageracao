-- Login (POST /v1/auth/login) não conhece `escola_id` ainda — é o que está
-- resolvendo. A política de isolamento normal (0002_usuario.sql) bloqueia
-- qualquer SELECT sem `app.escola_id` já definido, então a própria busca
-- de credenciais falharia (RLS "fail-closed" demais para este caso
-- específico). Esta política adicional só libera leitura quando a rota de
-- login explicitamente sinaliza `set_config('app.login_em_andamento',
-- 'true', true)` — escopado à transação da busca, nunca ligado por
-- padrão. Políticas permissivas do mesmo comando (SELECT) se combinam com
-- OR, então a política de isolamento por escola continua valendo fora
-- desse flag.
CREATE POLICY usuario_leitura_para_login ON usuario
  FOR SELECT
  USING (current_setting('app.login_em_andamento', true) = 'true');

CREATE POLICY usuario_papel_leitura_para_login ON usuario_papel
  FOR SELECT
  USING (current_setting('app.login_em_andamento', true) = 'true');
