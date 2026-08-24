import type { Pool } from "pg";
import type { Evento, TipoEvento } from "./tipos.js";
import { fixaEscolaAtual } from "./db.js";

interface LinhaTrilha {
  seq: number;
  em: string;
  tipo: TipoEvento;
  ator: string;
  matricula_id: string | null;
  payload_texto: string;
  hash_anterior: string;
  hash: string;
}

/**
 * PRD §15 — `GET /matriculas/:id/trilha`: eventos de UMA matrícula,
 * em ordem. Distinto de `verifica()` (que percorre a cadeia inteira da
 * escola para recalcular hashes) — este é só leitura para exibição.
 */
export async function listaEventosDaMatricula(pool: Pool, escolaId: string, matriculaId: string): Promise<Evento[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await fixaEscolaAtual(client, escolaId);
    const { rows } = await client.query<LinhaTrilha>(
      `SELECT seq, em, tipo, ator, matricula_id, payload::text AS payload_texto, hash_anterior, hash
       FROM ledger_evento WHERE escola_id = $1 AND matricula_id = $2 ORDER BY seq ASC`,
      [escolaId, matriculaId],
    );
    await client.query("COMMIT");

    return rows.map((row) => ({
      seq: row.seq,
      em: row.em,
      tipo: row.tipo,
      ator: row.ator,
      matriculaId: row.matricula_id,
      payload: JSON.parse(row.payload_texto) as Record<string, unknown>,
      hashAnterior: row.hash_anterior,
      hash: row.hash,
    }));
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
