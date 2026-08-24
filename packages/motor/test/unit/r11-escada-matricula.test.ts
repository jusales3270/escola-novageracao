import { describe, expect, test } from "vitest";
import { r11_escadaMatricula } from "../../src/regras/r11-escada-matricula.js";
import { TABELA_2027 } from "../../src/tabela/tabela-2027.js";
import { comDegrauAdulterado } from "../fixtures/tabela.fixture.js";

describe("R-11 — Escada de matrícula consistente (D-01)", () => {
  test("tabela 2027 original: todos os 8 degraus conferem", () => {
    const v = r11_escadaMatricula(TABELA_2027);
    expect(v.conforme).toBe(true);
    expect(v.severidade).toBe("ALERTA");
  });

  test("degrau adulterado (fora da tolerância de R$0,01) => não conforme, mas continua ALERTA", () => {
    const tabela = comDegrauAdulterado(TABELA_2027, "CARTAO_3X", 999.99);
    const v = r11_escadaMatricula(tabela);
    expect(v.conforme).toBe(false);
    expect(v.severidade).toBe("ALERTA");
    expect(v.detalhe).toContain("CARTAO_3X");
  });

  test("dentro da tolerância de R$0,01 => conforme", () => {
    // AVISTA_1X: cheia 1821.46 × 0,60 / 1 = 1092.876 → cent = 1092.88
    const tabela = comDegrauAdulterado(TABELA_2027, "AVISTA_1X", 1092.89);
    const v = r11_escadaMatricula(tabela);
    expect(v.conforme).toBe(true);
  });
});
