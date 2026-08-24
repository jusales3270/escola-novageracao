import { Pool, type PoolClient } from "pg";
import { fixaEscolaAtual } from "@somaverso/ledger";

export function criaPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}

/**
 * Toda rota de escrita usa isto: abre UMA transação, fixa `app.escola_id`
 * (RLS, PRD §14) e roda `fn` nela. `fixaEscolaAtual` usa `set_config(...,
 * true)` — escopado à transação atual — então fixar e consultar/escrever
 * PRECISAM estar no mesmo BEGIN/COMMIT. É também isso que permite ao
 * `fn` chamar `registraNaTransacao` (packages/ledger) na MESMA transação
 * da escrita de domínio, para que I-4 (evento na cadeia atomicamente com
 * o efeito) seja garantido de verdade, não só por convenção.
 */
export async function withTransacao<T>(pool: Pool, escolaId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await fixaEscolaAtual(client, escolaId);
    const resultado = await fn(client);
    await client.query("COMMIT");
    return resultado;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Mesma mecânica de `withTransacao`, mas `READ ONLY` — rede de segurança contra escrita acidental num GET. */
export async function withLeitura<T>(pool: Pool, escolaId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    await fixaEscolaAtual(client, escolaId);
    const resultado = await fn(client);
    await client.query("COMMIT");
    return resultado;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
