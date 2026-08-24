import { describe, expect, test } from "vitest";
import { motorVersao } from "../../src/versao.js";

describe("motorVersao", () => {
  test("é semver + hash de 16 hex chars", () => {
    expect(motorVersao()).toMatch(/^\d+\.\d+\.\d+\+[0-9a-f]{16}$/);
  });

  test("é estável entre chamadas (mesmo fonte, mesmo hash)", () => {
    expect(motorVersao()).toBe(motorVersao());
  });
});
