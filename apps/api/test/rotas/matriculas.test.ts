import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { criaPoolMigrador } from "../helpers/db.js";
import { criaEscolaDeTeste, criaUsuarioDeTeste, criaTabelaPrecoLimpa, apagaEscolaDeTeste, type UsuarioDeTeste } from "../helpers/fixtures.js";
import { constroiAppDeTeste, login } from "../helpers/app.js";
import { pedidoCompletoValido } from "../helpers/pedido.js";

/**
 * Cobre, no nível de API (não E2E de UI), a mesma jornada do §17/§19:
 * INCOMPLETO → BLOQUEADO (tabela não aprovada, R-07) → LIBERADO (após
 * aprovação) → emissão (stub honesto, M4 pendente) → trilha íntegra.
 */
describe("jornada de matrícula (API)", () => {
  let app: FastifyInstance;
  let poolMigrador: Pool;
  let escolaId: string;
  let secretaria: UsuarioDeTeste;
  let direcao: UsuarioDeTeste;
  let tabelaId: string;
  let matriculaId: string;
  let tokenSecretaria: string;
  let tokenDirecao: string;

  const ANO_LETIVO = 2099;

  beforeAll(async () => {
    app = constroiAppDeTeste();
    await app.ready();
    poolMigrador = criaPoolMigrador();

    escolaId = await criaEscolaDeTeste(poolMigrador, "Escola Jornada Matricula");
    secretaria = await criaUsuarioDeTeste(poolMigrador, escolaId, ["SECRETARIA"], { nome: "Secretaria Teste" });
    direcao = await criaUsuarioDeTeste(poolMigrador, escolaId, ["DIRECAO"], { nome: "Direção Teste" });
    tabelaId = await criaTabelaPrecoLimpa(poolMigrador, escolaId, direcao.id, { anoLetivo: ANO_LETIVO });

    tokenSecretaria = await login(app, secretaria.email, secretaria.senha);
    tokenDirecao = await login(app, direcao.email, direcao.senha);
  });

  afterAll(async () => {
    await apagaEscolaDeTeste(poolMigrador, escolaId);
    await poolMigrador.end();
    await app.close();
  });

  test("POST /v1/matriculas cria rascunho", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: "/v1/matriculas",
      headers: { authorization: `Bearer ${tokenSecretaria}` },
      payload: { anoLetivo: ANO_LETIVO, tipo: "MATRICULA" },
    });
    expect(resposta.statusCode).toBe(201);
    const corpo = resposta.json();
    expect(corpo.status).toBe("RASCUNHO");
    matriculaId = corpo.matriculaId;
  });

  test("simulação de pedido vazio => INCOMPLETO com pendências", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: `/v1/matriculas/${matriculaId}/simulacao`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
    });
    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    expect(corpo.status).toBe("INCOMPLETO");
    expect(corpo.pendencias.length).toBeGreaterThan(0);
  });

  test("PATCH completa o pedido", async () => {
    const resposta = await app.inject({
      method: "PATCH",
      url: `/v1/matriculas/${matriculaId}`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
      payload: pedidoCompletoValido(),
    });
    expect(resposta.statusCode).toBe(200);
  });

  test("pedido completo + tabela não aprovada => BLOQUEADO em R-07", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: `/v1/matriculas/${matriculaId}/simulacao`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
    });
    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    expect(corpo.status).toBe("BLOQUEADO");
    expect(corpo.resultado.bloqueios.some((v: { regra: string }) => v.regra === "R-07")).toBe(true);
  });

  test("DIRECAO aprova a tabela", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: `/v1/tabelas-preco/${tabelaId}/aprovacao`,
      headers: { authorization: `Bearer ${tokenDirecao}` },
    });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json().status).toBe("APROVADA");
  });

  test("DIRECAO define as 2 testemunhas exigidas por R-06", async () => {
    const resposta = await app.inject({
      method: "PATCH",
      url: `/v1/matriculas/${matriculaId}`,
      headers: { authorization: `Bearer ${tokenDirecao}` },
      payload: {
        contexto: {
          testemunhas: [
            { nome: "Renato Alves", cpf: "52998224725", email: "renato@novageracaoitu.com.br" },
            { nome: "Débora Lima", cpf: "11144477735", email: "debora@novageracaoitu.com.br" },
          ],
        },
      },
    });
    expect(resposta.statusCode).toBe(200);
  });

  test("após aprovação, simulação => LIBERADO", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: `/v1/matriculas/${matriculaId}/simulacao`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
    });
    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    expect(corpo.status).toBe("LIBERADO");
    expect(corpo.resultado.calculo).not.toBeNull();
  });

  test("emissão de matrícula LIBERADA retorna stub honesto (M4 pendente)", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: `/v1/matriculas/${matriculaId}/emissao`,
      headers: { authorization: `Bearer ${tokenSecretaria}`, "idempotency-key": "chave-teste-1" },
    });
    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    expect(corpo.decisao).toBe("LIBERADO");
    expect(corpo.proximaEtapa).toBe("geracao_documento (M4)");
    expect(typeof corpo.vereditoHash).toBe("string");
  });

  test("segunda emissão com a MESMA Idempotency-Key devolve a mesma resposta, sem reprocessar", async () => {
    const primeira = await app.inject({
      method: "POST",
      url: `/v1/matriculas/${matriculaId}/emissao`,
      headers: { authorization: `Bearer ${tokenSecretaria}`, "idempotency-key": "chave-teste-2" },
    });
    const segunda = await app.inject({
      method: "POST",
      url: `/v1/matriculas/${matriculaId}/emissao`,
      headers: { authorization: `Bearer ${tokenSecretaria}`, "idempotency-key": "chave-teste-2" },
    });
    expect(segunda.statusCode).toBe(primeira.statusCode);
    expect(segunda.json()).toEqual(primeira.json());
  });

  test("emissão sem Idempotency-Key => 400", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: `/v1/matriculas/${matriculaId}/emissao`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
    });
    expect(resposta.statusCode).toBe(400);
  });

  test("trilha da matrícula está em ordem e contém PEDIDO_RECEBIDO e VEREDITO_MOTOR", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: `/v1/matriculas/${matriculaId}/trilha`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
    });
    expect(resposta.statusCode).toBe(200);
    const corpo = resposta.json();
    const tipos = corpo.eventos.map((e: { tipo: string }) => e.tipo);
    expect(tipos[0]).toBe("PEDIDO_RECEBIDO");
    expect(tipos).toContain("VEREDITO_MOTOR");
    const seqs = corpo.eventos.map((e: { seq: number }) => e.seq);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
  });

  test("GET /v1/ledger/verificacao => cadeia íntegra (papel DIRECAO)", async () => {
    const resposta = await app.inject({
      method: "GET",
      url: "/v1/ledger/verificacao",
      headers: { authorization: `Bearer ${tokenDirecao}` },
    });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ integra: true });
  });
});
