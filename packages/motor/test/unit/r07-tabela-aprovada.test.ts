import { describe, expect, test } from "vitest";
import { r07_tabelaAprovada } from "../../src/regras/r07-tabela-aprovada.js";
import { TABELA_2027 } from "../../src/tabela/tabela-2027.js";
import { aprovarTabela, AGORA_TESTE } from "../fixtures/tabela.fixture.js";

describe("R-07 — Tabela de preços aprovada", () => {
  test("sem aprovadaPor => bloqueia", () => {
    const v = r07_tabelaAprovada(TABELA_2027, AGORA_TESTE);
    expect(v.conforme).toBe(false);
  });

  test("aprovada e vigente => conforme", () => {
    const v = r07_tabelaAprovada(aprovarTabela(), AGORA_TESTE);
    expect(v.conforme).toBe(true);
  });

  test("aprovada mas ainda não vigente => bloqueia", () => {
    const futura = { ...aprovarTabela(), vigenciaInicio: "2028-01-01" };
    const v = r07_tabelaAprovada(futura, AGORA_TESTE);
    expect(v.conforme).toBe(false);
  });
});
