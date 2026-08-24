import { describe, expect, test } from "vitest";
import { r02_alimentacaoDupla } from "../../src/regras/r02-alimentacao.js";
import { TABELA_2027 } from "../../src/tabela/tabela-2027.js";
import { buscaLinha } from "../../src/tabela/faixa.js";

describe("R-02 — Alimentação não cobrada em duplicidade", () => {
  test("berçário integral (alimentação inclusa) + alimentação !== NENHUMA => bloqueia", () => {
    const linha = buscaLinha(TABELA_2027, "BERCARIO", "INTEGRAL");
    const v = r02_alimentacaoDupla(linha, "ALMOCO");
    expect(v.conforme).toBe(false);
    expect(v.achado).toBe("A-02");
  });

  test("berçário integral + alimentação NENHUMA => conforme (é o cenário isolado do golden R-01)", () => {
    const linha = buscaLinha(TABELA_2027, "BERCARIO", "INTEGRAL");
    const v = r02_alimentacaoDupla(linha, "NENHUMA");
    expect(v.conforme).toBe(true);
  });

  test("berçário meio (alimentação não inclusa) + qualquer alimentação => conforme", () => {
    const linha = buscaLinha(TABELA_2027, "BERCARIO", "MEIO");
    const v = r02_alimentacaoDupla(linha, "ALMOCO_JANTAR");
    expect(v.conforme).toBe(true);
  });
});
