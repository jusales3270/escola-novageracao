import { describe, expect, test } from "vitest";
import { avalia } from "../../src/avalia.js";
import { pedidoValido } from "../fixtures/pedido.fixture.js";
import { aprovarTabela, AGORA_TESTE } from "../fixtures/tabela.fixture.js";
import { contextoValido } from "../fixtures/contexto.fixture.js";
import type { Turma, Periodo } from "@somaverso/schemas";

/** PRD §17: "Tabela 2027 + demais cinco linhas ⇒ R-01 conforme (deltas em centavos, dentro da tolerância de 0,12)." */
describe("GOLDEN — tabela 2027, demais cinco linhas", () => {
  test.each<[Turma, Periodo]>([
    ["BERCARIO", "MEIO"],
    ["MINI_MATERNAL", "MEIO"],
    ["MINI_MATERNAL", "INTEGRAL"],
    ["MATERNAL", "MEIO"],
    ["JARDIM", "INTEGRAL"],
  ])("%s/%s => LIBERADO (R-01 conforme)", (turma, periodo) => {
    const pedido = pedidoValido({ servicos: { turma, periodo, alimentacao: "NENHUMA", fraldario: "NENHUM", horaAdicionalDiasMes: 0 } });
    const r = avalia(pedido, contextoValido(), aprovarTabela(), AGORA_TESTE);
    expect(r.decisao).toBe("LIBERADO");
    expect(r.vereditos.find((v) => v.regra === "R-01")?.conforme).toBe(true);
  });
});
