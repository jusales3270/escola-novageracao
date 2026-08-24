import { describe, expect, test } from "vitest";
import { r10_restricaoGuarda } from "../../src/regras/r10-autorizados-retirada.js";

describe("R-10 — Autorizados à retirada registrados", () => {
  test("restrição judicial + 0 autorizados => bloqueia", () => {
    const v = r10_restricaoGuarda(true, null, 0);
    expect(v.conforme).toBe(false);
    expect(v.severidade).toBe("BLOQUEIA");
  });

  test("restrição judicial + autorizados mas sem documento comprobatório => bloqueia", () => {
    const v = r10_restricaoGuarda(true, null, 1);
    expect(v.conforme).toBe(false);
    expect(v.severidade).toBe("BLOQUEIA");
  });

  test("restrição judicial + autorizado + documento anexo => conforme", () => {
    const v = r10_restricaoGuarda(true, "3fa85f64-5717-4562-b3fc-2c963f66afa6", 1);
    expect(v.conforme).toBe(true);
    expect(v.severidade).toBe("BLOQUEIA");
  });

  test("sem restrição + 0 autorizados => ALERTA, não bloqueia a decisão final", () => {
    const v = r10_restricaoGuarda(false, null, 0);
    expect(v.conforme).toBe(false);
    expect(v.severidade).toBe("ALERTA");
  });

  test("sem restrição + 1 autorizado => conforme", () => {
    const v = r10_restricaoGuarda(false, null, 1);
    expect(v.conforme).toBe(true);
    expect(v.severidade).toBe("ALERTA");
  });
});
