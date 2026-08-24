import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Pool } from "pg";
import { registra } from "../../src/registra.js";
import { fixaEscolaAtual } from "../../src/db.js";
import { criaPoolApp, criaPoolMigrador, criaEscolaDeTeste, apagaEscolasDeTeste } from "./helpers/db.js";

/** PRD §14 — RLS por escola_id derivado de current_setting('app.escola_id'). */
describe("RLS — isolamento por escola_id", () => {
  let poolApp: Pool;
  let poolMigrador: Pool;
  let escolaA: string;
  let escolaB: string;

  beforeAll(async () => {
    poolApp = criaPoolApp();
    poolMigrador = criaPoolMigrador();
    escolaA = await criaEscolaDeTeste(poolMigrador, "Escola RLS A");
    escolaB = await criaEscolaDeTeste(poolMigrador, "Escola RLS B");

    await registra(poolApp, escolaA, { tipo: "PEDIDO_RECEBIDO", ator: "a", matriculaId: null, payload: {} });
    await registra(poolApp, escolaA, { tipo: "VEREDITO_MOTOR", ator: "a", matriculaId: null, payload: {} });
    await registra(poolApp, escolaB, { tipo: "PEDIDO_RECEBIDO", ator: "b", matriculaId: null, payload: {} });
  });

  afterAll(async () => {
    await apagaEscolasDeTeste(poolMigrador, [escolaA, escolaB]);
    await poolApp.end();
    await poolMigrador.end();
  });

  test("com app.escola_id = A, uma consulta sem WHERE só enxerga eventos de A", async () => {
    const client = await poolApp.connect();
    try {
      // set_config(..., true) é escopado à transação (SET LOCAL) — fixar e
      // consultar precisam estar no mesmo BEGIN/COMMIT, senão a variável
      // reverte antes do SELECT rodar.
      await client.query("BEGIN");
      await fixaEscolaAtual(client, escolaA);
      const { rows } = await client.query<{ escola_id: string }>("SELECT escola_id FROM ledger_evento");
      await client.query("COMMIT");
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.escola_id === escolaA)).toBe(true);
    } finally {
      client.release();
    }
  });

  test("sem app.escola_id definido, a consulta não retorna nenhuma linha (falha fechado)", async () => {
    const client = await poolApp.connect();
    try {
      // Conexão nova do pool: não chama fixaEscolaAtual — simula sessão
      // sem tenant resolvido.
      const { rows } = await client.query("SELECT escola_id FROM ledger_evento");
      expect(rows).toHaveLength(0);
    } finally {
      client.release();
    }
  });

  test("app.escola_id definido como string vazia também não retorna nenhuma linha", async () => {
    const client = await poolApp.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.escola_id', $1, true)", [""]);
      const { rows } = await client.query("SELECT escola_id FROM ledger_evento");
      await client.query("COMMIT");
      expect(rows).toHaveLength(0);
    } finally {
      client.release();
    }
  });
});
