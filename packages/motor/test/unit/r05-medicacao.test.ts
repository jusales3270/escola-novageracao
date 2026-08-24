import { describe, expect, test } from "vitest";
import { r05_medicacaoComPrescricao } from "../../src/regras/r05-medicacao.js";
import type { FichaSaude } from "@somaverso/schemas";

function ficha(overrides: Partial<FichaSaude> = {}): FichaSaude {
  return {
    usoContinuoMedicamento: false,
    alergico: false,
    antitermico: "NENHUM",
    contatoEmergencia: { nome: "Maria Souza", telefone: "11999990000" },
    ...overrides,
  };
}

describe("R-05 — Medicação com prescrição anexada", () => {
  test("antitérmico AUTORIZADO sem anexo => bloqueia", () => {
    const v = r05_medicacaoComPrescricao(ficha({ antitermico: "AUTORIZADO" }), null);
    expect(v.conforme).toBe(false);
  });

  test("antitérmico AUTORIZADO com anexo => conforme", () => {
    const v = r05_medicacaoComPrescricao(ficha({ antitermico: "AUTORIZADO" }), "3fa85f64-5717-4562-b3fc-2c963f66afa6");
    expect(v.conforme).toBe(true);
  });

  test("uso contínuo de medicamento sem anexo => bloqueia", () => {
    const v = r05_medicacaoComPrescricao(ficha({ usoContinuoMedicamento: true, qualMedicamento: "Insulina" }), null);
    expect(v.conforme).toBe(false);
  });

  test("sem uso contínuo e sem antitérmico autorizado => conforme, sem exigir anexo", () => {
    const v = r05_medicacaoComPrescricao(ficha(), null);
    expect(v.conforme).toBe(true);
  });
});
