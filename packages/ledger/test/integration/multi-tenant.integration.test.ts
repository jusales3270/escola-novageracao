import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Pool } from "pg";
import { registra } from "../../src/registra.js";
import { verifica } from "../../src/verifica.js";
import { criaPoolApp, criaPoolMigrador, criaEscolaDeTeste, apagaEscolasDeTeste } from "./helpers/db.js";

describe("cadeia de evidência — isolamento multi-tenant", () => {
  let poolApp: Pool;
  let poolMigrador: Pool;
  let escolaA: string;
  let escolaB: string;

  beforeAll(async () => {
    poolApp = criaPoolApp();
    poolMigrador = criaPoolMigrador();
    escolaA = await criaEscolaDeTeste(poolMigrador, "Escola A");
    escolaB = await criaEscolaDeTeste(poolMigrador, "Escola B");
  });

  afterAll(async () => {
    await apagaEscolasDeTeste(poolMigrador, [escolaA, escolaB]);
    await poolApp.end();
    await poolMigrador.end();
  });

  test("cada escola tem sua própria sequência, independente da outra", async () => {
    const a1 = await registra(poolApp, escolaA, { tipo: "PEDIDO_RECEBIDO", ator: "a", matriculaId: null, payload: {} });
    const b1 = await registra(poolApp, escolaB, { tipo: "PEDIDO_RECEBIDO", ator: "b", matriculaId: null, payload: {} });
    const a2 = await registra(poolApp, escolaA, { tipo: "VEREDITO_MOTOR", ator: "a", matriculaId: null, payload: {} });
    const b2 = await registra(poolApp, escolaB, { tipo: "VEREDITO_MOTOR", ator: "b", matriculaId: null, payload: {} });
    const a3 = await registra(poolApp, escolaA, { tipo: "DOCUMENTO_GERADO", ator: "a", matriculaId: null, payload: {} });

    expect([a1.seq, a2.seq, a3.seq]).toEqual([1, 2, 3]);
    expect([b1.seq, b2.seq]).toEqual([1, 2]);

    expect(await verifica(poolApp, escolaA)).toEqual({ integra: true });
    expect(await verifica(poolApp, escolaB)).toEqual({ integra: true });
  });
});
