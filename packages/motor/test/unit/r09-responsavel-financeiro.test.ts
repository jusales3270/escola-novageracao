import { describe, expect, test } from "vitest";
import { r09_responsavelFinanceiro } from "../../src/regras/r09-responsavel-financeiro.js";
import type { Pessoa, ResponsavelFinanceiro } from "@somaverso/schemas";

const contratante: Pessoa = { nome: "Carlos Souza", cpf: "52998224725", email: "carlos@example.com", telefone: "11999990001" };

describe("R-09 — Responsável financeiro identificado", () => {
  test("mesma pessoa que o contratante => conforme, detalhe indica coincidência", () => {
    const financeiro: ResponsavelFinanceiro = {
      ...contratante,
      contatoEmergencia: { nome: "Maria Souza", telefone: "11999990000" },
    };
    const v = r09_responsavelFinanceiro(contratante, financeiro);
    expect(v.conforme).toBe(true);
    expect(v.detalhe).toMatch(/mesma pessoa/i);
  });

  test("pessoa distinta do contratante => conforme, detalhe indica CPF correto", () => {
    const financeiro: ResponsavelFinanceiro = {
      nome: "Fernanda Lima",
      cpf: "11144477735",
      email: "fernanda@example.com",
      telefone: "11999990002",
      contatoEmergencia: { nome: "Maria Souza", telefone: "11999990000" },
    };
    const v = r09_responsavelFinanceiro(contratante, financeiro);
    expect(v.conforme).toBe(true);
    expect(v.detalhe).toMatch(/distinto/i);
  });

  test("dado incompleto (fora do caminho tipado) => não conforme", () => {
    const financeiroIncompleto = {
      nome: "Fe",
      cpf: "111",
      email: "fernanda@example.com",
      telefone: "11999990002",
      contatoEmergencia: { nome: "Maria Souza", telefone: "11999990000" },
    } as unknown as ResponsavelFinanceiro;
    const v = r09_responsavelFinanceiro(contratante, financeiroIncompleto);
    expect(v.conforme).toBe(false);
  });
});
