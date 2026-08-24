import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { Pool } from "pg";
import { registraNaTransacao } from "../../src/registra.js";
import { verifica } from "../../src/verifica.js";
import { fixaEscolaAtual } from "../../src/db.js";
import { criaPoolApp, criaPoolMigrador, criaEscolaDeTeste, apagaEscolasDeTeste } from "./helpers/db.js";

/**
 * apps/api combina uma escrita de domínio (ex.: INSERT em `matricula`) com
 * `registraNaTransacao` na MESMA transação — é o que garante I-4 (o evento
 * entra na cadeia atomicamente com o efeito, nunca um sem o outro). Este
 * teste simula isso: se a transação falhar DEPOIS de registraNaTransacao
 * já ter rodado, o rollback tem que desfazer o evento também.
 */
describe("registraNaTransacao — atomicidade com escrita de domínio na mesma transação", () => {
  let poolApp: Pool;
  let poolMigrador: Pool;
  let escolaId: string;

  beforeAll(async () => {
    poolApp = criaPoolApp();
    poolMigrador = criaPoolMigrador();
    escolaId = await criaEscolaDeTeste(poolMigrador, "Escola Transacao Combinada");
  });

  afterAll(async () => {
    await apagaEscolasDeTeste(poolMigrador, [escolaId]);
    await poolApp.end();
    await poolMigrador.end();
  });

  test("commit: evento persiste quando toda a transação (ledger + resto) é bem-sucedida", async () => {
    const client = await poolApp.connect();
    try {
      await client.query("BEGIN");
      const evento = await registraNaTransacao(client, escolaId, {
        tipo: "PEDIDO_RECEBIDO",
        ator: "secretaria@novageracaoitu.com.br",
        matriculaId: null,
        payload: { combinado: true },
      });
      expect(evento.seq).toBe(1);
      await client.query("COMMIT");
    } finally {
      client.release();
    }

    expect(await verifica(poolApp, escolaId)).toEqual({ integra: true });
  });

  test("rollback: se a transação falhar depois, o evento não fica órfão — some junto", async () => {
    const client = await poolApp.connect();
    try {
      await client.query("BEGIN");
      await registraNaTransacao(client, escolaId, {
        tipo: "VEREDITO_MOTOR",
        ator: "secretaria@novageracaoitu.com.br",
        matriculaId: null,
        payload: { seraDesfeito: true },
      });
      // Simula uma falha na escrita de domínio que viria DEPOIS do evento
      // do ledger na rota real (ex.: violação de constraint ao gravar a
      // matrícula) — a mesma transação precisa desfazer as duas coisas.
      await expect(client.query("SELECT 1/0")).rejects.toThrow();
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }

    // seq continua em 2 (só o evento do teste anterior existe) — o evento
    // "VEREDITO_MOTOR" que seria seq=2 nunca ficou durável.
    const client2 = await poolApp.connect();
    try {
      await client2.query("BEGIN");
      await fixaEscolaAtual(client2, escolaId);
      const { rows } = await client2.query("SELECT seq, tipo FROM ledger_evento ORDER BY seq");
      await client2.query("COMMIT");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ seq: 1, tipo: "PEDIDO_RECEBIDO" });
    } finally {
      client2.release();
    }

    expect(await verifica(poolApp, escolaId)).toEqual({ integra: true });
  });
});
