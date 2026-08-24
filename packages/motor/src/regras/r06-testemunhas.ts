import type { Testemunha, Veredito } from "@somaverso/schemas";

/**
 * PRD §9 — R-06: exatamente 2 testemunhas, CPF válido e e-mail real
 * cadastrado (achado A-06). CPF e e-mail já são exigidos pelo schema
 * `Testemunha` (`packages/schemas`) — o que resta checar aqui é a
 * quantidade. D-02 (e-mail de testemunha fabricado a partir do nome) é
 * corrigido na fronteira: não existe caminho para uma `Testemunha` sem
 * e-mail real chegar até este ponto.
 */
export function r06_testemunhas(testemunhas: Testemunha[]): Veredito {
  const qtd = testemunhas.length;
  return {
    regra: "R-06",
    titulo: "Duas testemunhas com CPF",
    severidade: "BLOQUEIA",
    conforme: qtd === 2,
    achado: "A-06",
    dono: "DIRECAO",
    detalhe:
      qtd === 2
        ? "Duas testemunhas definidas — contrato mantém força de título executivo extrajudicial (CPC art. 784, III)."
        : `${qtd} testemunha(s) definida(s). O contrato exige 2; sem elas o instrumento perde eficácia executiva.`,
  };
}
