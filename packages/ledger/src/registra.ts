import type { Pool, PoolClient } from "pg";
import type { Evento, TipoEvento } from "./tipos.js";
import { GENESE } from "./tipos.js";
import { montaMaterialCanonico, ordenaChavesRecursivo } from "./canonico.js";
import { sha256Hex } from "./hash.js";
import { fixaEscolaAtual } from "./db.js";

export interface NovoEvento {
  tipo: TipoEvento;
  ator: string;
  matriculaId: string | null;
  payload: Record<string, unknown>;
  /**
   * Opcional — default `new Date().toISOString()`. Parametrizável para
   * testes determinísticos; nunca vem do cliente em produção (I-6:
   * ambiente, aprovação de tabela, testemunhas e DPA são estado do
   * servidor — o mesmo vale para o timestamp do evento jurídico).
   */
  em?: string;
}

/**
 * PRD §10 — grava um evento na cadeia de evidência da escola, dentro de
 * uma transação já aberta pelo chamador. Não gerencia `BEGIN`/`COMMIT` —
 * isso é o que permite ao chamador (ex.: uma rota de `apps/api`) gravar o
 * efeito de domínio (uma `matricula`, um `veredito`) e o evento do ledger
 * na MESMA transação. I-4 exige que "todo evento com efeito jurídico
 * entre na cadeia antes de o efeito ocorrer" — sem atomicidade real entre
 * as duas escritas, existiria uma janela onde um efeito de domínio fica
 * durável sem o evento correspondente na cadeia (ou vice-versa).
 *
 * `seq` é atribuído sob `SELECT ... FOR UPDATE` na linha de controle do
 * tenant (`escola_ledger_seq`) — "encadeamento não tolera concorrência
 * otimista": duas chamadas concorrentes para a mesma escola serializam
 * nessa trava, nunca produzem `seq` duplicado.
 */
export async function registraNaTransacao(client: PoolClient, escolaId: string, evento: NovoEvento): Promise<Evento> {
  await fixaEscolaAtual(client, escolaId);

  const controle = await client.query<{ proximo_seq: number }>(
    "SELECT proximo_seq FROM escola_ledger_seq WHERE escola_id = $1 FOR UPDATE",
    [escolaId],
  );
  const linhaControle = controle.rows[0];
  if (!linhaControle) throw new Error(`escola ${escolaId} sem linha de controle de sequência`);
  const seq = linhaControle.proximo_seq;

  let hashAnterior = GENESE;
  if (seq > 1) {
    const anterior = await client.query<{ hash: string }>(
      "SELECT hash FROM ledger_evento WHERE escola_id = $1 AND seq = $2",
      [escolaId, seq - 1],
    );
    const linhaAnterior = anterior.rows[0];
    if (!linhaAnterior) throw new Error(`cadeia inconsistente: evento seq=${seq - 1} ausente para escola ${escolaId}`);
    hashAnterior = linhaAnterior.hash;
  }

  const em = evento.em ?? new Date().toISOString();
  const payloadOrdenado = ordenaChavesRecursivo(evento.payload) as Record<string, unknown>;
  const payloadJson = JSON.stringify(payloadOrdenado);
  const hash = sha256Hex(
    montaMaterialCanonico({
      seq,
      em,
      tipo: evento.tipo,
      ator: evento.ator,
      matriculaId: evento.matriculaId,
      payloadJson,
      hashAnterior,
    }),
  );

  await client.query(
    `INSERT INTO ledger_evento (escola_id, seq, em, tipo, ator, matricula_id, payload, hash_anterior, hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7::json,$8,$9)`,
    [escolaId, seq, em, evento.tipo, evento.ator, evento.matriculaId, payloadJson, hashAnterior, hash],
  );
  await client.query(
    "UPDATE escola_ledger_seq SET proximo_seq = proximo_seq + 1, atualizado_em = now() WHERE escola_id = $1",
    [escolaId],
  );

  return {
    seq,
    em,
    tipo: evento.tipo,
    ator: evento.ator,
    matriculaId: evento.matriculaId,
    payload: payloadOrdenado,
    hashAnterior,
    hash,
  };
}

/**
 * Variante autocontida: abre conexão e transação próprias. Usada quando o
 * chamador não precisa combinar esta escrita com nenhuma outra na mesma
 * transação (a maioria dos usos fora de `apps/api`, e os testes de
 * integração existentes deste pacote).
 */
export async function registra(pool: Pool, escolaId: string, evento: NovoEvento): Promise<Evento> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resultado = await registraNaTransacao(client, escolaId, evento);
    await client.query("COMMIT");
    return resultado;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
