import type { TabelaPreco } from "@somaverso/schemas";
import type { Veredito } from "@somaverso/schemas";

/** PRD §9 — R-07: `tabela.aprovadaPor != null` e vigente na data do pedido. */
export function r07_tabelaAprovada(tabela: TabelaPreco, agora: Date): Veredito {
  const aprovada = tabela.aprovadaPor != null;
  const vigente = new Date(tabela.vigenciaInicio) <= agora;
  const conforme = aprovada && vigente;
  return {
    regra: "R-07",
    titulo: "Tabela de preços aprovada",
    severidade: "BLOQUEIA",
    conforme,
    achado: null,
    dono: "DIRECAO",
    detalhe: !aprovada
      ? `Tabela ${tabela.anoLetivo} sem aprovação registrada. Nenhum documento é gerado a partir de tabela não aprovada.`
      : !vigente
        ? `Tabela ${tabela.anoLetivo} aprovada por ${tabela.aprovadaPor}, mas ainda não vigente (vigência a partir de ${tabela.vigenciaInicio}).`
        : `Tabela ${tabela.anoLetivo} aprovada por ${tabela.aprovadaPor}, vigência ${tabela.vigenciaInicio}.`,
  };
}
