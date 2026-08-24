import type { Pessoa, ResponsavelFinanceiro, Veredito } from "@somaverso/schemas";

/**
 * PRD §9 — R-09: nome ≥ 3, CPF válido, e-mail válido. Esses campos já são
 * obrigatórios no schema `ResponsavelFinanceiro`; a regra existe sobretudo
 * para registrar, no veredito, se o financeiro é ou não a mesma pessoa que
 * o contratante — informação que a secretaria usa para saber em qual CPF a
 * cobrança sai.
 */
export function r09_responsavelFinanceiro(contratante: Pessoa, responsavelFinanceiro: ResponsavelFinanceiro): Veredito {
  const preenchido = responsavelFinanceiro.cpf.length === 11 && responsavelFinanceiro.nome.length >= 3;
  return {
    regra: "R-09",
    titulo: "Responsável financeiro identificado",
    severidade: "BLOQUEIA",
    conforme: preenchido,
    achado: null,
    dono: "SECRETARIA",
    detalhe: preenchido
      ? contratante.cpf === responsavelFinanceiro.cpf
        ? "Contratante e responsável financeiro são a mesma pessoa."
        : "Responsável financeiro distinto do contratante — cobrança emitida no CPF correto."
      : "Responsável financeiro não identificado. Cobrança emitida em nome errado é cobrança frágil.",
  };
}
