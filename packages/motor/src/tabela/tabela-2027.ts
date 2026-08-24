import type { TabelaPreco } from "@somaverso/schemas";

/**
 * FIXTURE DE REGRESSÃO — PRD §4 e §7.
 *
 * "A safra 2027 é processada manualmente com o método atual [...]
 * Consequência técnica: a tabela 2027 permanece no repositório como fixture
 * de regressão — ela deve produzir BLOQUEADO em R-01 para berçário
 * integral. Testes que a fizerem passar estão errados."
 *
 * NÃO editar estes números sem uma decisão registrada da direção (PRD
 * §18.1, §18.2, §18.3 — preço do berçário integral, alimentação inclusa ou
 * não, e aprovação formal da tabela 2028). `aprovadaPor` fica `null` de
 * propósito: sem aprovação registrada, o motor bloqueia em R-07 mesmo antes
 * de chegar a R-01.
 */
export const TABELA_2027: TabelaPreco = {
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
    // Delta de R$ 1.729,05 contra mensalidade × 12 — é o caso golden do R-01 (PRD §1, §7, §17).
    { faixa: "BERCARIO", periodo: "INTEGRAL", mensalidade: 3693.94, anuidadeDeclaradaContrato: 46056.33, alimentacaoInclusa: true, descricaoContrato: "Até 10h diárias (almoço, jantar e banho)" },
    { faixa: "MINI_MATERNAL", periodo: "MEIO", mensalidade: 2012.25, anuidadeDeclaradaContrato: 24146.94, alimentacaoInclusa: false, descricaoContrato: "04 horas diárias: 7h30–11h30 ou 13h00–17h00" },
    { faixa: "MINI_MATERNAL", periodo: "INTEGRAL", mensalidade: 3004.79, anuidadeDeclaradaContrato: 36057.50, alimentacaoInclusa: false, descricaoContrato: "Até 10h diárias (04h educacional + 06h recreação)" },
    { faixa: "MATERNAL_JARDIM_ALFA", periodo: "MEIO", mensalidade: 2080.13, anuidadeDeclaradaContrato: 24961.61, alimentacaoInclusa: false, descricaoContrato: "04 horas diárias: 7h30–11h30 ou 13h00–17h00" },
    { faixa: "MATERNAL_JARDIM_ALFA", periodo: "INTEGRAL", mensalidade: 3072.68, anuidadeDeclaradaContrato: 36872.17, alimentacaoInclusa: false, descricaoContrato: "Até 10h diárias (04h educacional + 06h recreação)" },
  ],
  // Valores declarados literais do §7 — não recalculados aqui (isso é o que corrige D-01/R-11).
  degraus: [
    { chave: "AVISTA_ATE_31_08", pct: 50, parcelas: 1, valorDeclarado: 910.73 },
    { chave: "AVISTA_ATE_15_09", pct: 45, parcelas: 1, valorDeclarado: 1001.80 },
    { chave: "AVISTA_1X", pct: 40, parcelas: 1, valorDeclarado: 1092.88 },
    { chave: "CARTAO_2X", pct: 35, parcelas: 2, valorDeclarado: 591.97 },
    { chave: "CARTAO_3X", pct: 20, parcelas: 3, valorDeclarado: 485.72 },
    { chave: "CARTAO_4X", pct: 10, parcelas: 4, valorDeclarado: 409.83 },
    { chave: "CARTAO_5X", pct: 5, parcelas: 5, valorDeclarado: 346.08 },
    { chave: "CARTAO_6X", pct: 0, parcelas: 6, valorDeclarado: 303.58 },
  ],
};
