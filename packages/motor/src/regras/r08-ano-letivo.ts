import type { Veredito } from "@somaverso/schemas";

/** PRD §9 — R-08: `pedido.anoLetivo === tabela.anoLetivo` (achado A-09: "Exercício 2026" no requerimento de 2027). */
export function r08_anoCoerente(anoPedido: number, anoTabela: number): Veredito {
  const conforme = anoPedido === anoTabela;
  return {
    regra: "R-08",
    titulo: "Ano letivo coerente",
    severidade: "BLOQUEIA",
    conforme,
    achado: "A-09",
    dono: "SECRETARIA",
    detalhe: conforme
      ? `Ano letivo ${anoPedido} consistente.`
      : `Pedido para ${anoPedido} usando tabela de ${anoTabela}.`,
  };
}
