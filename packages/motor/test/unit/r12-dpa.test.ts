import { describe, expect, test } from "vitest";
import { r12_dpaAssinado } from "../../src/regras/r12-dpa.js";

describe("R-12 — Contrato de tratamento de dados", () => {
  test("produção sem DPA => bloqueia", () => {
    expect(r12_dpaAssinado(false, "producao").conforme).toBe(false);
  });

  test("produção com DPA => conforme", () => {
    expect(r12_dpaAssinado(true, "producao").conforme).toBe(true);
  });

  test("homologação sem DPA => conforme", () => {
    expect(r12_dpaAssinado(false, "homologacao").conforme).toBe(true);
  });

  test("sandbox sem DPA => conforme", () => {
    expect(r12_dpaAssinado(false, "sandbox").conforme).toBe(true);
  });
});
