import { describe, expect, test } from "vitest";
import { TabelaPreco } from "../src/tabela-preco.js";

describe("TabelaPreco", () => {
  test("parseia a fixture 2027 do §7 sem coerção/perda", () => {
    const tabela = {
      anoLetivo: 2027,
      vigenciaInicio: "2026-08-01",
      aprovadaPor: null,
      aprovadaEm: null,
      parcelas: 12,
      descontoPontualidadePct: 5,
      matriculaCheia: 1821.46,
      adicionais: {
        horaAdicional: 27,
        almoco: 570,
        almocoJantar: 800,
        almocoOuJantar: 530,
        fraldarioMeio: 270,
        fraldarioIntegral: 485,
        fraldarioAvulso: 27,
      },
      linhas: [
        { faixa: "BERCARIO", periodo: "MEIO", mensalidade: 2185.62, anuidadeDeclaradaContrato: 26227.49, alimentacaoInclusa: false, descricaoContrato: "04 horas diárias: 7h30–11h30 ou 13h00–17h00" },
        { faixa: "BERCARIO", periodo: "INTEGRAL", mensalidade: 3693.94, anuidadeDeclaradaContrato: 46056.33, alimentacaoInclusa: true, descricaoContrato: "Até 10h diárias (almoço, jantar e banho)" },
      ],
      degraus: [{ chave: "AVISTA_1X", pct: 40, parcelas: 1, valorDeclarado: 1092.88 }],
    };

    const r = TabelaPreco.safeParse(tabela);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.matriculaCheia).toBe(1821.46);
      expect(r.data.linhas[1]?.anuidadeDeclaradaContrato).toBe(46056.33);
    }
  });

  test("sem aprovadaPor continua válido no schema (R-07 bloqueia no motor, não aqui)", () => {
    const r = TabelaPreco.safeParse({
      anoLetivo: 2027,
      vigenciaInicio: "2026-08-01",
      aprovadaPor: null,
      aprovadaEm: null,
      parcelas: 12,
      descontoPontualidadePct: 5,
      matriculaCheia: 1821.46,
      adicionais: {
        horaAdicional: 27, almoco: 570, almocoJantar: 800, almocoOuJantar: 530,
        fraldarioMeio: 270, fraldarioIntegral: 485, fraldarioAvulso: 27,
      },
      linhas: [],
      degraus: [],
    });
    expect(r.success).toBe(true);
  });
});
