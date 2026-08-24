import { Pool, type PoolClient } from "pg";

export function criaPool(connectionString: string = process.env["DATABASE_URL"] ?? ""): Pool {
  if (!connectionString) throw new Error("DATABASE_URL não definida");
  return new Pool({ connectionString });
}

/**
 * PRD §14 — RLS por `current_setting('app.escola_id')`. Usa
 * `set_config` (aceita bind parameter) em vez de `SET LOCAL app.escola_id
 * = '<valor>'` concatenado por string — nunca interpolar `escolaId` numa
 * query SQL.
 */
export async function fixaEscolaAtual(client: PoolClient, escolaId: string): Promise<void> {
  await client.query("SELECT set_config('app.escola_id', $1, true)", [escolaId]);
}
