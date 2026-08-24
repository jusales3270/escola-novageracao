import type { Ambiente, Veredito } from "@somaverso/schemas";

/** PRD §9 — R-12: `ambiente !== 'producao'` ou `dpaAssinado`. */
export function r12_dpaAssinado(dpaAssinado: boolean, ambiente: Ambiente): Veredito {
  const conforme = dpaAssinado || ambiente !== "producao";
  return {
    regra: "R-12",
    titulo: "Contrato de tratamento de dados",
    severidade: "BLOQUEIA",
    conforme,
    achado: null,
    dono: "JURIDICO",
    detalhe: conforme
      ? ambiente === "producao"
        ? "DPA controlador/operador assinado."
        : `Ambiente "${ambiente}" — dados fictícios, DPA não exigido.`
      : "Dado sensível de criança em produção sem contrato de operador assinado (LGPD art. 39).",
  };
}
