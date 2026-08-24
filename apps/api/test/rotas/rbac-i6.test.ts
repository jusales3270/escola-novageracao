import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { criaPoolMigrador } from "../helpers/db.js";
import { criaEscolaDeTeste, criaUsuarioDeTeste, criaTabelaPrecoLimpa, apagaEscolaDeTeste, type UsuarioDeTeste } from "../helpers/fixtures.js";
import { constroiAppDeTeste, login } from "../helpers/app.js";
import { pedidoCompletoValido } from "../helpers/pedido.js";

describe("RBAC e I-6 (estado do servidor, cliente não decide)", () => {
  let app: FastifyInstance;
  let poolMigrador: Pool;
  let escolaId: string;
  let secretaria: UsuarioDeTeste;
  let direcao: UsuarioDeTeste;
  let auditor: UsuarioDeTeste;
  let tokenSecretaria: string;
  let tokenDirecao: string;
  let tokenAuditor: string;

  const ANO_LETIVO = 2098;

  beforeAll(async () => {
    app = constroiAppDeTeste();
    await app.ready();
    poolMigrador = criaPoolMigrador();

    escolaId = await criaEscolaDeTeste(poolMigrador, "Escola RBAC I6");
    secretaria = await criaUsuarioDeTeste(poolMigrador, escolaId, ["SECRETARIA"], { nome: "Secretaria RBAC" });
    direcao = await criaUsuarioDeTeste(poolMigrador, escolaId, ["DIRECAO"], { nome: "Direção RBAC" });
    auditor = await criaUsuarioDeTeste(poolMigrador, escolaId, ["AUDITOR"], { nome: "Auditor RBAC" });
    await criaTabelaPrecoLimpa(poolMigrador, escolaId, direcao.id, { anoLetivo: ANO_LETIVO, aprovadaPorUsuarioId: direcao.id });

    tokenSecretaria = await login(app, secretaria.email, secretaria.senha);
    tokenDirecao = await login(app, direcao.email, direcao.senha);
    tokenAuditor = await login(app, auditor.email, auditor.senha);
  });

  afterAll(async () => {
    await apagaEscolaDeTeste(poolMigrador, escolaId);
    await poolMigrador.end();
    await app.close();
  });

  test("AUDITOR não pode criar matrícula (403)", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: "/v1/matriculas",
      headers: { authorization: `Bearer ${tokenAuditor}` },
      payload: { anoLetivo: ANO_LETIVO, tipo: "MATRICULA" },
    });
    expect(resposta.statusCode).toBe(403);
    expect(resposta.json().type).toContain("sem-permissao");
  });

  test("SECRETARIA não pode aprovar tabela de preços (403)", async () => {
    const resposta = await app.inject({
      method: "POST",
      url: `/v1/tabelas-preco/00000000-0000-0000-0000-000000000000/aprovacao`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
    });
    expect(resposta.statusCode).toBe(403);
  });

  test("requisição sem token => 401", async () => {
    const resposta = await app.inject({ method: "GET", url: "/v1/tabelas-preco" });
    expect(resposta.statusCode).toBe(401);
  });

  test("I-6: cliente mandando operador.papel=DIRECAO no corpo não eleva a alçada de desconto", async () => {
    const criar = await app.inject({
      method: "POST",
      url: "/v1/matriculas",
      headers: { authorization: `Bearer ${tokenSecretaria}` },
      payload: { anoLetivo: ANO_LETIVO, tipo: "MATRICULA" },
    });
    const matriculaId = criar.json().matriculaId as string;

    // SECRETARIA autenticada tenta se passar por DIRECAO no corpo do
    // pedido (papel: 'DIRECAO', teto 100%) e pede 15% de desconto sem
    // justificativa — se o servidor confiasse no corpo, R-03 passaria.
    await app.inject({
      method: "PATCH",
      url: `/v1/matriculas/${matriculaId}`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
      payload: pedidoCompletoValido({
        descontoExcepcionalPct: 15,
        operador: { id: "3fa85f64-5717-4562-b3fc-2c963f66afa6", nome: "Secretaria Disfarçada", papel: "DIRECAO" },
      }),
    });

    const simulacao = await app.inject({
      method: "POST",
      url: `/v1/matriculas/${matriculaId}/simulacao`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
    });
    const corpo = simulacao.json();
    // O servidor ignora o operador do corpo e usa o papel real do token
    // (SECRETARIA, teto 10%) — 15% sem justificativa bloqueia em R-03.
    expect(corpo.status).toBe("BLOQUEADO");
    const r03 = corpo.resultado.vereditos.find((v: { regra: string }) => v.regra === "R-03");
    expect(r03.conforme).toBe(false);
  });

  test("I-6: papelAtuante fora dos papéis do usuário autenticado => 403", async () => {
    const criar = await app.inject({
      method: "POST",
      url: "/v1/matriculas",
      headers: { authorization: `Bearer ${tokenSecretaria}` },
      payload: { anoLetivo: ANO_LETIVO, tipo: "MATRICULA" },
    });
    const matriculaId = criar.json().matriculaId as string;

    const resposta = await app.inject({
      method: "POST",
      url: `/v1/matriculas/${matriculaId}/simulacao`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
      payload: { papelAtuante: "DIRECAO" },
    });
    expect(resposta.statusCode).toBe(403);
  });

  test("I-6: PATCH de testemunhas por SECRETARIA é rejeitado — só DIRECAO define testemunhas", async () => {
    const criar = await app.inject({
      method: "POST",
      url: "/v1/matriculas",
      headers: { authorization: `Bearer ${tokenSecretaria}` },
      payload: { anoLetivo: ANO_LETIVO, tipo: "MATRICULA" },
    });
    const matriculaId = criar.json().matriculaId as string;

    const resposta = await app.inject({
      method: "PATCH",
      url: `/v1/matriculas/${matriculaId}`,
      headers: { authorization: `Bearer ${tokenSecretaria}` },
      payload: {
        contexto: {
          testemunhas: [
            { nome: "Renato Alves", cpf: "52998224725", email: "renato@novageracaoitu.com.br" },
            { nome: "Débora Lima", cpf: "11144477735", email: "debora@novageracaoitu.com.br" },
          ],
        },
      },
    });
    expect(resposta.statusCode).toBe(403);
  });

  test("DIRECAO consegue definir testemunhas", async () => {
    const criar = await app.inject({
      method: "POST",
      url: "/v1/matriculas",
      headers: { authorization: `Bearer ${tokenSecretaria}` },
      payload: { anoLetivo: ANO_LETIVO, tipo: "MATRICULA" },
    });
    const matriculaId = criar.json().matriculaId as string;

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
});
