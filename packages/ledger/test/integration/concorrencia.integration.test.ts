import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Pool } from "pg";
import { registra } from "../../src/registra.js";
import { verifica } from "../../src/verifica.js";
import { criaPoolApp, criaPoolMigrador, criaEscolaDeTeste, apagaEscolasDeTeste } from "./helpers/db.js";

/**
 * PRD §10 — "encadeamento não tolera concorrência otimista." Chamadas
 * concorrentes de registra() para a MESMA escola serializam no
 * SELECT ... FOR UPDATE da linha de controle — nunca produzem seq
 * duplicado ou com buraco.
 */
describe("cadeia de evidência — concorrência", () => {
  let poolApp: Pool;
  let poolMigrador: Pool;
  let escolaId: string;

  beforeAll(async () => {
    poolApp = criaPoolApp();
    poolMigrador = criaPoolMigrador();
    escolaId = await criaEscolaDeTeste(poolMigrador, "Escola Concorrencia");
  });

  afterAll(async () => {
    await apagaEscolasDeTeste(poolMigrador, [escolaId]);
    await poolApp.end();
    await poolMigrador.end();
  });

  test("N chamadas concorrentes produzem seq {1..N} sem duplicata nem buraco", async () => {
    const N = 10;
    const eventos = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        registra(poolApp, escolaId, {
          tipo: "PEDIDO_RECEBIDO",
          ator: "secretaria@novageracaoitu.com.br",
          matriculaId: null,
          payload: { indiceConcorrente: i },
        }),
      ),
    );

    const seqs = eventos.map((e) => e.seq).sort((a, b) => a - b);
    expect(seqs).toEqual(Array.from({ length: N }, (_, i) => i + 1));

    expect(await verifica(poolApp, escolaId)).toEqual({ integra: true });
  });
});
