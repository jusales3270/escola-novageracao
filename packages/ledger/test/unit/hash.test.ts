import { describe, expect, test } from "vitest";
import { sha256Hex } from "../../src/hash.js";

describe("sha256Hex", () => {
  // Vetor de teste padrão do NIST/FIPS 180-4 para SHA-256("abc").
  test("bate com o vetor de teste conhecido de SHA-256", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  test("é determinístico", () => {
    expect(sha256Hex("mesma entrada")).toBe(sha256Hex("mesma entrada"));
  });

  test("qualquer variação de 1 caractere muda o hash inteiro", () => {
    expect(sha256Hex("a")).not.toBe(sha256Hex("b"));
  });
});
