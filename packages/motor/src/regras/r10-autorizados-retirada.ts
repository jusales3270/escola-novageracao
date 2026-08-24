import type { Veredito } from "@somaverso/schemas";

/**
 * PRD §9 — R-10: BLOQUEIA se houver restrição judicial, senão ALERTA.
 * Condição: ≥ 1 autorizado; com restrição judicial, exige documento
 * comprobatório anexo (Cl. 12ª §1º).
 */
export function r10_restricaoGuarda(
  restricaoJudicial: boolean,
  restricaoJudicialAnexoId: string | null,
  autorizados: number,
): Veredito {
  const temAutorizado = autorizados > 0;
  const conforme = restricaoJudicial
    ? temAutorizado && restricaoJudicialAnexoId !== null
    : temAutorizado;

  return {
    regra: "R-10",
    titulo: "Autorizados à retirada registrados",
    severidade: restricaoJudicial ? "BLOQUEIA" : "ALERTA",
    conforme,
    achado: null,
    dono: "SECRETARIA",
    detalhe: restricaoJudicial
      ? restricaoJudicialAnexoId === null
        ? `Restrição judicial informada. Cl. 12ª §1º exige documento comprobatório em anexo — nenhum anexado.`
        : `Restrição judicial informada, com documento comprobatório anexo. ${autorizados} pessoa(s) autorizada(s) cadastrada(s).`
      : temAutorizado
        ? `${autorizados} pessoa(s) autorizada(s) além dos responsáveis.`
        : "Nenhuma pessoa autorizada além dos responsáveis. Confirmar se é intencional.",
  };
}
