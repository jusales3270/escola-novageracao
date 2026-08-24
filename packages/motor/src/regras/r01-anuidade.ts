import type { TabelaPrecoLinha, Veredito } from "@somaverso/schemas";
import { cent } from "../calculo.js";

/** Sempre `mensalidade × 12` — I-1: "Anuidade nunca é digitada". */
export const PARCELAS_ANUIDADE = 12;

/** PRD §7: "Tolerância R-01: 12 × R$ 0,01 = R$ 0,12". */
export const TOLERANCIA_R01 = cent(PARCELAS_ANUIDADE * 0.01);

export function anuidadeDerivada(linha: TabelaPrecoLinha): number {
  return cent(linha.mensalidade * PARCELAS_ANUIDADE);
}

/** PRD §9 — R-01: `|declarada − mensalidade×12| ≤ 0,12` (achado A-01, o defeito que originou este projeto). */
export function r01_reconciliaAnuidade(linha: TabelaPrecoLinha): Veredito {
  const derivada = anuidadeDerivada(linha);
  const delta = cent(linha.anuidadeDeclaradaContrato - derivada);
  const conforme = Math.abs(delta) <= TOLERANCIA_R01;
  return {
    regra: "R-01",
    titulo: "Anuidade reconcilia com mensalidade × 12",
    severidade: "BLOQUEIA",
    conforme,
    achado: "A-01",
    dono: "DIRECAO",
    detalhe: conforme
      ? `${linha.faixa}/${linha.periodo}: derivada ${derivada.toFixed(2)} ≈ declarada ${linha.anuidadeDeclaradaContrato.toFixed(2)} (Δ ${delta.toFixed(2)})`
      : `${linha.faixa}/${linha.periodo}: derivada ${derivada.toFixed(2)} × declarada ${linha.anuidadeDeclaradaContrato.toFixed(2)} — divergência de ${Math.abs(delta).toFixed(2)}. Mensalidade implícita no contrato: ${cent(linha.anuidadeDeclaradaContrato / PARCELAS_ANUIDADE).toFixed(2)}.`,
  };
}
