import { describe, expect, test } from "vitest";
import { r06_testemunhas } from "../../src/regras/r06-testemunhas.js";
import type { Testemunha } from "@somaverso/schemas";

const t = (n: number): Testemunha[] =>
  Array.from({ length: n }, (_, i) => ({
    nome: `Testemunha ${i + 1}`,
    cpf: i % 2 === 0 ? "52998224725" : "11144477735",
    email: `testemunha${i + 1}@example.com`,
  }));

describe("R-06 — Duas testemunhas com CPF", () => {
  test("1 testemunha => bloqueia", () => {
    expect(r06_testemunhas(t(1)).conforme).toBe(false);
  });

  test("2 testemunhas => conforme", () => {
    expect(r06_testemunhas(t(2)).conforme).toBe(true);
  });

  test("3 testemunhas => bloqueia", () => {
    expect(r06_testemunhas(t(3)).conforme).toBe(false);
  });
});
