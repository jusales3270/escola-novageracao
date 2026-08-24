import { describe, expect, test } from "vitest";
import { GENESE } from "../../src/tipos.js";

describe("GENESE", () => {
  test('é "0" repetido 64 vezes (hashAnterior do primeiro evento — PRD §10)', () => {
    expect(GENESE).toHaveLength(64);
    expect(GENESE).toBe("0".repeat(64));
    expect(/^0{64}$/.test(GENESE)).toBe(true);
  });
});
