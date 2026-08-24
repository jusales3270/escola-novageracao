import { describe, expect, test } from "vitest";
import { buscaLinha, buscaDegrau } from "../../src/tabela/faixa.js";
import { LinhaPrecoNaoEncontrada, DegrauNaoEncontrado } from "../../src/erros.js";
import { TABELA_2027 } from "../../src/tabela/tabela-2027.js";

describe("buscaLinha / buscaDegrau", () => {
  test("encontra linha existente", () => {
    const linha = buscaLinha(TABELA_2027, "BERCARIO", "INTEGRAL");
    expect(linha.mensalidade).toBe(3693.94);
  });

  test("lança LinhaPrecoNaoEncontrada para faixa/período sem linha", () => {
    const tabelaVazia = { ...TABELA_2027, linhas: [] };
    expect(() => buscaLinha(tabelaVazia, "BERCARIO", "INTEGRAL")).toThrow(LinhaPrecoNaoEncontrada);
  });

  test("encontra degrau existente", () => {
    const degrau = buscaDegrau(TABELA_2027, "CARTAO_6X");
    expect(degrau.valorDeclarado).toBe(303.58);
  });

  test("lança DegrauNaoEncontrado para chave sem degrau", () => {
    const tabelaVazia = { ...TABELA_2027, degraus: [] };
    expect(() => buscaDegrau(tabelaVazia, "CARTAO_6X")).toThrow(DegrauNaoEncontrado);
  });
});
