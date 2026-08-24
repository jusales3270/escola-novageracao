import type { Alim, Fraldario, TabelaPrecoAdicionais, TabelaPrecoLinha, TabelaPreco, DegrauChave } from "@somaverso/schemas";
import type { ComposicaoMensal, ComposicaoMatricula } from "@somaverso/schemas";
import { buscaDegrau } from "./tabela/faixa.js";

/** Arredonda para 2 casas decimais — PRD §7: "arredondamento a 2 casas em cada etapa". */
export function cent(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function valorAlimentacao(alim: Alim, adicionais: TabelaPrecoAdicionais): number {
  switch (alim) {
    case "NENHUMA":
      return 0;
    case "ALMOCO":
      return adicionais.almoco;
    case "ALMOCO_JANTAR":
      return adicionais.almocoJantar;
    case "ALMOCO_OU_JANTAR":
      return adicionais.almocoOuJantar;
  }
}

export function valorFraldario(fraldario: Fraldario, adicionais: TabelaPrecoAdicionais): number {
  switch (fraldario) {
    case "NENHUM":
      return 0;
    case "MEIO":
      return adicionais.fraldarioMeio;
    case "INTEGRAL":
      return adicionais.fraldarioIntegral;
    case "AVULSO":
      return adicionais.fraldarioAvulso;
  }
}

export interface ServicosContratados {
  alimentacao: Alim;
  fraldario: Fraldario;
  horaAdicionalDiasMes: number;
}

/**
 * PRD §7 — "Cálculo da mensalidade (ordem fixa, arredondamento a 2 casas em
 * cada etapa)". O desconto de pontualidade incide apenas sobre o serviço
 * educacional (`baseP`), nunca sobre alimentação/fraldário/hora adicional —
 * isso é decorrência do contrato e não é configurável.
 */
export function calculaComposicaoMensal(
  linha: TabelaPrecoLinha,
  servicos: ServicosContratados,
  adicionais: TabelaPrecoAdicionais,
  descontoExcepcionalPct: number,
  descontoPontualidadePct: number,
): ComposicaoMensal {
  const alimentacao = cent(valorAlimentacao(servicos.alimentacao, adicionais));
  const fraldario = cent(valorFraldario(servicos.fraldario, adicionais));
  const horaAdicional = cent(servicos.horaAdicionalDiasMes * adicionais.horaAdicional);

  const descontoExcepcional = cent(linha.mensalidade * (descontoExcepcionalPct / 100));
  const totalCheio = cent(linha.mensalidade + alimentacao + fraldario + horaAdicional - descontoExcepcional);
  const baseP = cent(linha.mensalidade - descontoExcepcional);
  const descontoPontualidade = cent(baseP * (descontoPontualidadePct / 100));
  const totalComPontualidade = cent(totalCheio - descontoPontualidade);

  return {
    servicoEducacional: linha.mensalidade,
    alimentacao,
    fraldario,
    horaAdicional,
    descontoExcepcional,
    totalCheio,
    baseP,
    descontoPontualidade,
    totalComPontualidade,
  };
}

/** Valor de fato cobrado no degrau escolhido — vem de `valorDeclarado` (a tabela aprovada), não recalculado aqui. */
export function calculaMatricula(tabela: TabelaPreco, chave: DegrauChave): ComposicaoMatricula {
  const degrau = buscaDegrau(tabela, chave);
  return {
    chave: degrau.chave,
    parcelas: degrau.parcelas,
    valorParcela: degrau.valorDeclarado,
  };
}
