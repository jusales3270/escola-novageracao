import { describe, test, expect } from "vitest";
import fc from "fast-check";
import { Turma, Periodo, Alim, Fraldario, DegrauChave, FAIXA_PRECO } from "@somaverso/schemas";
import { calculaComposicaoMensal } from "../../src/calculo.js";
import { TABELA_2027 } from "../../src/tabela/tabela-2027.js";
import { buscaLinha } from "../../src/tabela/faixa.js";

/**
 * PRD §17: "para qualquer combinação válida de turma × período ×
 * alimentação × fraldário × dias de hora adicional × degrau,
 * totalComPontualidade ≤ totalCheio e todos os valores são múltiplos de
 * centavo."
 */
describe("PROPRIEDADE — composição mensal", () => {
  test("totalComPontualidade <= totalCheio, tudo múltiplo de centavo", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Turma.options),
        fc.constantFrom(...Periodo.options),
        fc.constantFrom(...Alim.options),
        fc.constantFrom(...Fraldario.options),
        fc.integer({ min: 0, max: 22 }),
        fc.constantFrom(...DegrauChave.options),
        fc.integer({ min: 0, max: 100 }),
        (turma, periodo, alimentacao, fraldario, horaAdicionalDiasMes, _degrau, descontoExcepcionalPct) => {
          const faixa = FAIXA_PRECO[turma];
          const linha = buscaLinha(TABELA_2027, faixa, periodo);
          const c = calculaComposicaoMensal(
            linha,
            { alimentacao, fraldario, horaAdicionalDiasMes },
            TABELA_2027.adicionais,
            descontoExcepcionalPct,
            TABELA_2027.descontoPontualidadePct,
          );

          expect(c.totalComPontualidade).toBeLessThanOrEqual(c.totalCheio);

          for (const valor of Object.values(c)) {
            expect(Number.isInteger(Math.round(valor * 100))).toBe(true);
          }
        },
      ),
      { numRuns: 500 },
    );
  });
});
