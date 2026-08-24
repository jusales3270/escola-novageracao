import { describe, expect, test } from "vitest";
import { cent, calculaComposicaoMensal, calculaMatricula, valorAlimentacao, valorFraldario } from "../../src/calculo.js";
import { TABELA_2027 } from "../../src/tabela/tabela-2027.js";
import { buscaLinha } from "../../src/tabela/faixa.js";

describe("cent", () => {
  test("arredonda para 2 casas decimais", () => {
    expect(cent(109.281)).toBe(109.28);
    expect(cent(218.565)).toBe(218.57);
    expect(cent(1)).toBe(1);
  });
});

describe("valorAlimentacao / valorFraldario", () => {
  test("NENHUMA/NENHUM não custam nada", () => {
    expect(valorAlimentacao("NENHUMA", TABELA_2027.adicionais)).toBe(0);
    expect(valorFraldario("NENHUM", TABELA_2027.adicionais)).toBe(0);
  });

  test("mapeiam para os valores da tabela de adicionais", () => {
    expect(valorAlimentacao("ALMOCO", TABELA_2027.adicionais)).toBe(570);
    expect(valorAlimentacao("ALMOCO_JANTAR", TABELA_2027.adicionais)).toBe(800);
    expect(valorAlimentacao("ALMOCO_OU_JANTAR", TABELA_2027.adicionais)).toBe(530);
    expect(valorFraldario("MEIO", TABELA_2027.adicionais)).toBe(270);
    expect(valorFraldario("INTEGRAL", TABELA_2027.adicionais)).toBe(485);
    expect(valorFraldario("AVULSO", TABELA_2027.adicionais)).toBe(27);
  });
});

describe("calculaComposicaoMensal", () => {
  test("sem adicionais nem descontos, totalComPontualidade só desconta pontualidade sobre a mensalidade", () => {
    const linha = buscaLinha(TABELA_2027, "BERCARIO", "MEIO");
    const c = calculaComposicaoMensal(
      linha,
      { alimentacao: "NENHUMA", fraldario: "NENHUM", horaAdicionalDiasMes: 0 },
      TABELA_2027.adicionais,
      0,
      TABELA_2027.descontoPontualidadePct,
    );
    expect(c.descontoExcepcional).toBe(0);
    expect(c.totalCheio).toBe(2185.62);
    expect(c.baseP).toBe(2185.62);
    expect(c.descontoPontualidade).toBe(109.28);
    expect(c.totalComPontualidade).toBe(2076.34);
  });

  test("desconto de pontualidade não incide sobre alimentação/fraldário/hora adicional", () => {
    const linha = buscaLinha(TABELA_2027, "BERCARIO", "MEIO");
    const c = calculaComposicaoMensal(
      linha,
      { alimentacao: "ALMOCO", fraldario: "MEIO", horaAdicionalDiasMes: 5 },
      TABELA_2027.adicionais,
      10,
      TABELA_2027.descontoPontualidadePct,
    );
    expect(c.alimentacao).toBe(570);
    expect(c.fraldario).toBe(270);
    expect(c.horaAdicional).toBe(135);
    expect(c.descontoExcepcional).toBe(218.56);
    expect(c.totalCheio).toBe(2942.06);
    expect(c.baseP).toBe(1967.06);
    expect(c.descontoPontualidade).toBe(98.35);
    expect(c.totalComPontualidade).toBe(2843.71);
  });
});

describe("calculaMatricula", () => {
  test("usa o valorDeclarado do degrau, não recalcula", () => {
    const m = calculaMatricula(TABELA_2027, "CARTAO_3X");
    expect(m).toEqual({ chave: "CARTAO_3X", parcelas: 3, valorParcela: 485.72 });
  });
});
