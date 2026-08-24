import { describe, expect, test } from "vitest";
import { r08_anoCoerente } from "../../src/regras/r08-ano-letivo.js";

describe("R-08 — Ano letivo coerente (achado A-09)", () => {
  test("ano do pedido diferente do ano da tabela => bloqueia", () => {
    expect(r08_anoCoerente(2026, 2027).conforme).toBe(false);
  });

  test("ano do pedido igual ao da tabela => conforme", () => {
    expect(r08_anoCoerente(2027, 2027).conforme).toBe(true);
  });
});
