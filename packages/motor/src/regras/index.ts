export * from "./r01-anuidade.js";
export * from "./r02-alimentacao.js";
export * from "./r03-alcada.js";
export * from "./r04-consentimento.js";
export * from "./r05-medicacao.js";
export * from "./r06-testemunhas.js";
export * from "./r07-tabela-aprovada.js";
export * from "./r08-ano-letivo.js";
export * from "./r09-responsavel-financeiro.js";
export * from "./r10-autorizados-retirada.js";
export * from "./r11-escada-matricula.js";
export * from "./r12-dpa.js";

/**
 * PRD §9 — "Ordem de exibição fixa [...] A ordem não é alfabética por
 * decisão: precede o que barra a emissão inteira." Mantida aqui como a
 * fonte única da ordem em que `avalia()` monta `vereditos[]`.
 */
export const ORDEM_EXIBICAO = [
  "R-07",
  "R-08",
  "R-01",
  "R-02",
  "R-03",
  "R-04",
  "R-05",
  "R-06",
  "R-09",
  "R-10",
  "R-11",
  "R-12",
] as const;
