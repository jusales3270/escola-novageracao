import { describe, expect, test } from "vitest";
import { r01_reconciliaAnuidade } from "../../src/regras/r01-anuidade.js";
import { TABELA_2027 } from "../../src/tabela/tabela-2027.js";
import { buscaLinha } from "../../src/tabela/faixa.js";

describe("R-01 — Anuidade reconcilia com mensalidade × 12", () => {
  test("berçário integral: NÃO conforme, delta 1.729,05 (achado A-01, o caso golden)", () => {
    const linha = buscaLinha(TABELA_2027, "BERCARIO", "INTEGRAL");
    const v = r01_reconciliaAnuidade(linha);
    expect(v.conforme).toBe(false);
    expect(v.severidade).toBe("BLOQUEIA");
    expect(v.achado).toBe("A-01");
  });

  test.each([
    ["BERCARIO", "MEIO"],
    ["MINI_MATERNAL", "MEIO"],
    ["MINI_MATERNAL", "INTEGRAL"],
    ["MATERNAL_JARDIM_ALFA", "MEIO"],
    ["MATERNAL_JARDIM_ALFA", "INTEGRAL"],
  ] as const)("%s/%s: conforme (dentro da tolerância de 0,12)", (faixa, periodo) => {
    const linha = buscaLinha(TABELA_2027, faixa, periodo);
    const v = r01_reconciliaAnuidade(linha);
    expect(v.conforme).toBe(true);
  });
});
