import { describe, expect, test } from "vitest";
import { r03_alcadaDesconto, tetoAlcada } from "../../src/regras/r03-alcada.js";

describe("R-03 — Desconto dentro da alçada", () => {
  test("secretaria com 15% => bloqueia (teto 10%)", () => {
    const v = r03_alcadaDesconto("SECRETARIA", 15);
    expect(v.conforme).toBe(false);
  });

  test("direção com 15% sem justificativa => bloqueia", () => {
    const v = r03_alcadaDesconto("DIRECAO", 15);
    expect(v.conforme).toBe(false);
  });

  test("direção com 15% e justificativa => conforme", () => {
    const v = r03_alcadaDesconto("DIRECAO", 15, "Bolsa filantropia — aprovado em reunião de 2027-01-10");
    expect(v.conforme).toBe(true);
  });

  test("secretaria com 0% => conforme, sem exigir justificativa", () => {
    const v = r03_alcadaDesconto("SECRETARIA", 0);
    expect(v.conforme).toBe(true);
  });

  test("D-04 — operador não identificado => bloqueia mesmo com desconto 0%", () => {
    expect(tetoAlcada("INSPETOR")).toBeNull();
    const v = r03_alcadaDesconto("INSPETOR", 0);
    expect(v.conforme).toBe(false);
    expect(v.detalhe).toMatch(/não identificado/i);
  });

  test("auditor não tem alçada de desconto (teto 0)", () => {
    const v = r03_alcadaDesconto("AUDITOR", 5);
    expect(v.conforme).toBe(false);
  });
});
