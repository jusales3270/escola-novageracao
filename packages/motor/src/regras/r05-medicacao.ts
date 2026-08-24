import type { FichaSaude, Veredito } from "@somaverso/schemas";

/**
 * PRD §9 — R-05: se `usoContinuo` ou `antitermico === 'AUTORIZADO'` ⇒
 * anexo de prescrição válido (achado A-05).
 *
 * D-06 — o protótipo tratava `antitermicoAutorizado` como texto livre
 * avaliado por truthiness; aqui `ficha.antitermico` é o enum fechado
 * `NENHUM | AUTORIZADO` (`packages/schemas`), então a condição é uma
 * comparação exata, não uma checagem de string não vazia.
 */
export function r05_medicacaoComPrescricao(ficha: FichaSaude, prescricaoAnexoId: string | null): Veredito {
  const exige = ficha.usoContinuoMedicamento || ficha.antitermico === "AUTORIZADO";
  const conforme = !exige || prescricaoAnexoId !== null;
  const medicamento = ficha.qualMedicamento ?? ficha.antitermicoMedicamento;
  return {
    regra: "R-05",
    titulo: "Medicação com prescrição anexada",
    severidade: "BLOQUEIA",
    conforme,
    achado: "A-05",
    dono: "SECRETARIA",
    detalhe: conforme
      ? exige
        ? "Medicação autorizada com prescrição anexada."
        : "Sem medicação autorizada."
      : `Autorização de "${medicamento ?? "medicamento não especificado"}" sem prescrição médica. Cl. 13ª §1º exige dose, horário e período.`,
  };
}
