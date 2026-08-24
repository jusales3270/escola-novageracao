import type { TabelaPreco, Veredito } from "@somaverso/schemas";
import { cent } from "../calculo.js";

/**
 * PRD §9 — R-11: para cada degrau, `|valorDeclarado − cheia×(1−pct/100)/parcelas| ≤ 0,01`
 * (achado A-03, severidade ALERTA — nunca bloqueia `decisao`).
 *
 * D-01 — no protótipo, o valor "declarado" era calculado no chamador com a
 * mesma fórmula usada aqui para comparação (`tabela.matriculaCheia × (1 −
 * pct/100) / parcelas`), então a regra comparava uma expressão consigo
 * mesma e nunca falhava. Aqui `valorDeclarado` vem de
 * `TabelaPrecoDegrau.valorDeclarado` — um campo de dado, não uma derivação
 * — então a reconciliação é real.
 */
export function r11_escadaMatricula(tabela: TabelaPreco): Veredito {
  const erros = tabela.degraus.filter((d) => {
    const calculado = cent((tabela.matriculaCheia * (1 - d.pct / 100)) / d.parcelas);
    return Math.abs(calculado - d.valorDeclarado) > 0.01;
  });

  return {
    regra: "R-11",
    titulo: "Escada de matrícula consistente",
    severidade: "ALERTA",
    conforme: erros.length === 0,
    achado: "A-03",
    dono: "DIRECAO",
    detalhe:
      erros.length === 0
        ? `${tabela.degraus.length} degraus conferem contra a matrícula cheia de ${tabela.matriculaCheia.toFixed(2)}.`
        : `Degraus fora: ${erros.map((e) => `${e.chave} (declarado ${e.valorDeclarado.toFixed(2)})`).join(", ")}.`,
  };
}
