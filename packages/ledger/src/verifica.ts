import type { Pool } from "pg";
import type { ResultadoVerificacao, TipoEvento } from "./tipos.js";
import { GENESE } from "./tipos.js";
import { montaMaterialCanonico } from "./canonico.js";
import { sha256Hex } from "./hash.js";
import { fixaEscolaAtual } from "./db.js";

interface LinhaLedger {
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
 * PRD §10 — "percorre a cadeia, recalcula, retorna {integra: true} ou
 * {integra: false, rompeuEm: seq}". `payload::text` no SELECT lê o texto
 * exato armazenado na coluna `json` (sem reparse/reordenação do driver),
 * para que a verificação use literalmente os mesmos bytes hasheados na
 * escrita — é por isso que a coluna é `json`, não `jsonb` (§7 do plano de
 * implementação: jsonb reordenaria chaves e quebraria isso mesmo sem
 * adulteração real).
 */
export async function verifica(pool: Pool, escolaId: string): Promise<ResultadoVerificacao> {
  const client = await pool.connect();
  try {
    // `set_config(..., true)` é escopado à transação atual (equivalente a
    // SET LOCAL) — de propósito, para não vazar entre reaproveitamentos de
    // uma mesma conexão do pool. Isso exige que a fixação e a consulta
    // corram na MESMA transação explícita: fora de um BEGIN, cada
    // `client.query()` é sua própria transação implícita e a variável de
    // sessão reverte antes da consulta seguinte rodar — a RLS filtraria
    // tudo (retornando 0 linhas) em vez de aplicar o isolamento correto.
    await client.query("BEGIN");
    await fixaEscolaAtual(client, escolaId);
    const { rows } = await client.query<LinhaLedger>(
      `SELECT seq, em, tipo, ator, matricula_id, payload::text AS payload_texto, hash_anterior, hash
       FROM ledger_evento WHERE escola_id = $1 ORDER BY seq ASC`,
      [escolaId],
    );
    await client.query("COMMIT");

    let hashAnteriorEsperado = GENESE;
    for (const row of rows) {
      const hashRecalculado = sha256Hex(
        montaMaterialCanonico({
          seq: row.seq,
          em: row.em,
          tipo: row.tipo,
          ator: row.ator,
          matriculaId: row.matricula_id,
          payloadJson: row.payload_texto,
          hashAnterior: row.hash_anterior,
        }),
      );
      if (row.hash_anterior !== hashAnteriorEsperado || hashRecalculado !== row.hash) {
        return { integra: false, rompeuEm: row.seq };
      }
      hashAnteriorEsperado = row.hash;
    }
    return { integra: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
