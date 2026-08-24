import { describe, expect, test } from "vitest";
import { CPF, validaCPF } from "../src/cpf.js";

describe("validaCPF", () => {
  test("aceita CPF válido", () => {
    expect(validaCPF("52998224725")).toBe(true);
  });

  test("rejeita dígito verificador incorreto", () => {
    expect(validaCPF("52998224726")).toBe(false);
  });

  test("rejeita sequência de dígito repetido", () => {
    expect(validaCPF("11111111111")).toBe(false);
    expect(validaCPF("00000000000")).toBe(false);
  });

  test("rejeita CPF com tamanho errado", () => {
    expect(validaCPF("123")).toBe(false);
  });
});

describe("CPF (schema Zod)", () => {
  test("normaliza para 11 dígitos antes de validar (D-05)", () => {
    const r = CPF.safeParse("529.982.247-25");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("52998224725");
  });

  test("aceita já normalizado", () => {
    expect(CPF.safeParse("52998224725").success).toBe(true);
  });

  test("rejeita CPF inválido mesmo formatado", () => {
    expect(CPF.safeParse("529.982.247-26").success).toBe(false);
  });
});
