import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Pool } from "pg";
import { registra } from "../../src/registra.js";
import { verifica } from "../../src/verifica.js";
import { criaPoolApp, criaPoolMigrador, criaEscolaDeTeste, apagaEscolasDeTeste } from "./helpers/db.js";

/**
 * PRD §17 — "alterar 1 byte de payload por SQL direto (com trigger
 * desabilitado em ambiente de teste), verificar rompeuEm correto."
 */
describe("cadeia de evidência — detecção de adulteração", () => {
  let poolApp: Pool;
  let poolMigrador: Pool;
  let escolaId: string;

  beforeAll(async () => {
    poolApp = criaPoolApp();
    poolMigrador = criaPoolMigrador();
    escolaId = await criaEscolaDeTeste(poolMigrador, "Escola Adulteracao");
  });

  afterAll(async () => {
    await apagaEscolasDeTeste(poolMigrador, [escolaId]);
    await poolApp.end();
    await poolMigrador.end();
  });

  test("payload alterado por SQL direto no meio da cadeia é detectado em rompeuEm", async () => {
    for (let i = 0; i < 4; i++) {
      await registra(poolApp, escolaId, {
        tipo: "PEDIDO_RECEBIDO",
        ator: "secretaria@novageracaoitu.com.br",
        matriculaId: null,
        payload: { indice: i },
      });
    }

    expect(await verifica(poolApp, escolaId)).toEqual({ integra: true });

    // Adulteração "por SQL direto": só possível com o trigger desabilitado
    // (privilégio de dono/superuser) — é exatamente essa a garantia que
    // o trigger dá em produção, onde soma_app nunca tem esse privilégio.
    const client = await poolMigrador.connect();
    try {
      await client.query("ALTER TABLE ledger_evento DISABLE TRIGGER ledger_evento_append_only");
      await client.query(
        `UPDATE ledger_evento SET payload = '{"indice":999}'::json WHERE escola_id = $1 AND seq = 2`,
        [escolaId],
      );
      await client.query("ALTER TABLE ledger_evento ENABLE TRIGGER ledger_evento_append_only");
    } finally {
      client.release();
    }

    const resultado = await verifica(poolApp, escolaId);
    expect(resultado).toEqual({ integra: false, rompeuEm: 2 });
  });
});
