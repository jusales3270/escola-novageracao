import type { Alim, TabelaPrecoLinha, Veredito } from "@somaverso/schemas";

/** PRD §9 — R-02: `!(linha.alimentacaoInclusa && servicos.alimentacao !== 'NENHUMA')` (achado A-02). */
export function r02_alimentacaoDupla(linha: TabelaPrecoLinha, alimentacaoContratada: Alim): Veredito {
  const cobrandoAparte = alimentacaoContratada !== "NENHUMA";
  const conflito = linha.alimentacaoInclusa && cobrandoAparte;
  return {
    regra: "R-02",
    titulo: "Alimentação não cobrada em duplicidade",
    severidade: "BLOQUEIA",
    conforme: !conflito,
    achado: "A-02",
    dono: "DIRECAO",
    detalhe: conflito
      ? `${linha.faixa}/${linha.periodo}: o contrato descreve "${linha.descricaoContrato}" (alimentação inclusa), mas o pedido adiciona ${alimentacaoContratada} como serviço avulso. Cobrança em duplicidade.`
      : "Sem conflito entre alimentação inclusa e serviço adicional.",
  };
}
