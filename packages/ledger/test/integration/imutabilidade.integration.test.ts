import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Pool } from "pg";
import { registra } from "../../src/registra.js";
import { fixaEscolaAtual } from "../../src/db.js";
import { criaPoolApp, criaPoolMigrador, criaEscolaDeTeste, apagaEscolasDeTeste } from "./helpers/db.js";

/**
 * PRD §17 — "tentativa de UPDATE via papel da aplicação deve falhar."
 * Camada distinta do trigger (adulteracao.integration.test.ts): aqui o
 * trigger continua ligado, mas nem chega a rodar — soma_app não tem
 * privilégio UPDATE/DELETE em ledger_evento (REVOKE explícito na
 * migration 0004), então o Postgres rejeita antes.
 */
describe("cadeia de evidência — soma_app não pode alterar ledger_evento", () => {
  let poolApp: Pool;
  let poolMigrador: Pool;
  let escolaId: string;

  beforeAll(async () => {
    poolApp = criaPoolApp();
    poolMigrador = criaPoolMigrador();
    escolaId = await criaEscolaDeTeste(poolMigrador, "Escola Imutabilidade");
    await registra(poolApp, escolaId, {
      tipo: "PEDIDO_RECEBIDO",
      ator: "secretaria@novageracaoitu.com.br",
      matriculaId: null,
      payload: { x: 1 },
    });
  });

  afterAll(async () => {
    await apagaEscolasDeTeste(poolMigrador, [escolaId]);
    await poolApp.end();
    await poolMigrador.end();
  });

  test("UPDATE direto via soma_app falha por falta de privilégio", async () => {
    const client = await poolApp.connect();
    try {
      await fixaEscolaAtual(client, escolaId);
      await expect(
        client.query(`UPDATE ledger_evento SET payload = '{"x":2}'::json WHERE escola_id = $1 AND seq = 1`, [escolaId]),
      ).rejects.toMatchObject({ code: "42501" });
    } finally {
      client.release();
    }
  });

  test("DELETE direto via soma_app falha por falta de privilégio", async () => {
    const client = await poolApp.connect();
    try {
      await fixaEscolaAtual(client, escolaId);
      await expect(client.query("DELETE FROM ledger_evento WHERE escola_id = $1 AND seq = 1", [escolaId])).rejects.toMatchObject({
        code: "42501",
      });
    } finally {
      client.release();
    }
  });
});
