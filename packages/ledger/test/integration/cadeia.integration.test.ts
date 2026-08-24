import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Pool } from "pg";
import { registra } from "../../src/registra.js";
import { verifica } from "../../src/verifica.js";
import { GENESE } from "../../src/tipos.js";
import { criaPoolApp, criaPoolMigrador, criaEscolaDeTeste, apagaEscolasDeTeste } from "./helpers/db.js";

describe("cadeia de evidência — inserção e verificação", () => {
  let poolApp: Pool;
  let poolMigrador: Pool;
  let escolaId: string;

  beforeAll(async () => {
    poolApp = criaPoolApp();
    poolMigrador = criaPoolMigrador();
    escolaId = await criaEscolaDeTeste(poolMigrador, "Escola Cadeia");
  });

  afterAll(async () => {
    await apagaEscolasDeTeste(poolMigrador, [escolaId]);
    await poolApp.end();
    await poolMigrador.end();
  });

  test("insere N eventos em sequência e a cadeia verifica íntegra", async () => {
    const N = 5;
    const eventos = [];
    for (let i = 0; i < N; i++) {
      eventos.push(
        await registra(poolApp, escolaId, {
          tipo: "PEDIDO_RECEBIDO",
          ator: "secretaria@novageracaoitu.com.br",
          matriculaId: null,
          payload: { indice: i },
        }),
      );
    }

    expect(eventos.map((e) => e.seq)).toEqual([1, 2, 3, 4, 5]);
    expect(eventos[0]?.hashAnterior).toBe(GENESE);
    for (let i = 1; i < N; i++) {
      expect(eventos[i]?.hashAnterior).toBe(eventos[i - 1]?.hash);
    }

    const resultado = await verifica(poolApp, escolaId);
    expect(resultado).toEqual({ integra: true });
  });
});
