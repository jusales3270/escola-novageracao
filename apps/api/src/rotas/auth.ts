import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import type { Papel } from "@somaverso/schemas";
import { LoginRequest, type LoginResponse } from "../schemas/auth.js";
import { NaoAutenticadoErro } from "../erros/problema.js";
import type { Pool } from "pg";

interface LinhaUsuario {
  id: string;
  escola_id: string;
  nome: string;
  senha_hash: string;
}

interface BuscaLogin {
  usuario: LinhaUsuario | null;
  ambiguo: boolean;
  papeis: Papel[];
}

/**
 * Roda com `app.login_em_andamento = true` (ver migration
 * 0012_rls_login.sql) — sem isso, a RLS de `usuario`/`usuario_papel`
 * bloquearia a própria consulta, já que `escola_id` ainda não é
 * conhecido antes do login. Não lança erro aqui dentro: só busca dados e
 * devolve; a rota decide o que fazer, já fora da transação.
 */
async function buscaCredenciais(pool: Pool, email: string): Promise<BuscaLogin> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.login_em_andamento', 'true', true)");

    const { rows } = await client.query<LinhaUsuario>("SELECT id, escola_id, nome, senha_hash FROM usuario WHERE email = $1", [email]);
    if (rows.length !== 1) {
      await client.query("COMMIT");
      return { usuario: null, ambiguo: rows.length > 1, papeis: [] };
    }
    const usuario = rows[0]!;

    const { rows: linhasPapel } = await client.query<{ papel: Papel }>("SELECT papel FROM usuario_papel WHERE usuario_id = $1", [
      usuario.id,
    ]);
    await client.query("COMMIT");
    return { usuario, ambiguo: false, papeis: linhasPapel.map((r) => r.papel) };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Limitação conhecida do M3: `email` é único por escola (`UNIQUE
 * (escola_id, email)`), não globalmente. Login busca por email em todas
 * as escolas; se houver mais de um resultado, pede desambiguação — regra
 * aceitável para o piloto de uma única escola, revisitar se o produto
 * crescer para múltiplas escolas usando o mesmo domínio de e-mail.
 */
export function registraRotasAuth(app: FastifyInstance, pool: Pool): void {
  app.post("/v1/auth/login", async (request, reply) => {
    const corpo = LoginRequest.parse(request.body);

    const { usuario, ambiguo, papeis } = await buscaCredenciais(pool, corpo.email);
    if (ambiguo) throw new NaoAutenticadoErro("E-mail associado a mais de uma escola — contate o suporte.");
    if (!usuario) throw new NaoAutenticadoErro();

    const senhaConfere = await bcrypt.compare(corpo.senha, usuario.senha_hash);
    if (!senhaConfere) throw new NaoAutenticadoErro();
    if (papeis.length === 0) throw new NaoAutenticadoErro("Usuário sem papel atribuído.");

    const token = await reply.jwtSign({ sub: usuario.id, escolaId: usuario.escola_id, papeis, nome: usuario.nome });

    const corpoResposta: LoginResponse = {
      token,
      usuario: { id: usuario.id, nome: usuario.nome, escolaId: usuario.escola_id, papeis },
    };
    return corpoResposta;
  });
}
