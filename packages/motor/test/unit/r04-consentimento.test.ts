import { describe, expect, test } from "vitest";
import { r04_consentimentoGranular } from "../../src/regras/r04-consentimento.js";

describe("R-04 — Consentimento decidido canal a canal", () => {
  test("4 de 5 canais decididos => bloqueia, nomeando o canal faltante", () => {
    const v = r04_consentimentoGranular({
      SITE: true,
      REDES_SOCIAIS: false,
      ALBUM_TURMA: true,
      USO_PEDAGOGICO_INTERNO: true,
      // MATERIAL_IMPRESSO ausente
    });
    expect(v.conforme).toBe(false);
    expect(v.detalhe).toContain("MATERIAL_IMPRESSO");
  });

  test("5 de 5 canais decididos (mesmo que negados) => conforme", () => {
    const v = r04_consentimentoGranular({
      SITE: true,
      REDES_SOCIAIS: false,
      ALBUM_TURMA: false,
      USO_PEDAGOGICO_INTERNO: true,
      MATERIAL_IMPRESSO: false,
    });
    expect(v.conforme).toBe(true);
  });
});
