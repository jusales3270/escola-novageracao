import { describe, expect, test } from "vitest";
import { avalia } from "../../src/avalia.js";
import { pedidoValido } from "../fixtures/pedido.fixture.js";
import { aprovarTabela, AGORA_TESTE } from "../fixtures/tabela.fixture.js";
import { contextoValido } from "../fixtures/contexto.fixture.js";

/**
 * PRD §4: "a tabela 2027 permanece no repositório como fixture de
 * regressão — ela deve produzir BLOQUEADO em R-01 para berçário integral.
 * Testes que a fizerem passar estão errados."
 * PRD §17 (critério de aceite do M1, §19): "tabela 2027 + berçário integral
 * ⇒ BLOQUEADO, bloqueio único em R-01, delta 1.729,05."
 *
 * `alimentacao: 'NENHUMA'` isola R-01: berçário integral tem
 * `alimentacaoInclusa: true`, então qualquer alimentação contratada à parte
 * também dispararia R-02 — esse cenário combinado é testado à parte em
 * r02-alimentacao.test.ts, não aqui.
 */
describe("GOLDEN — tabela 2027 + berçário integral", () => {
  test("BLOQUEADO, bloqueio único em R-01, delta 1.729,05", () => {
    const pedido = pedidoValido({
      servicos: { turma: "BERCARIO", periodo: "INTEGRAL", alimentacao: "NENHUMA", fraldario: "NENHUM", horaAdicionalDiasMes: 0 },
    });
    const tabela = aprovarTabela();

    const r = avalia(pedido, contextoValido(), tabela, AGORA_TESTE);

    expect(r.decisao).toBe("BLOQUEADO");
    expect(r.bloqueios).toHaveLength(1);
    expect(r.bloqueios[0]?.regra).toBe("R-01");
    expect(r.calculo).toBeNull();

    const linha = tabela.linhas.find((l) => l.faixa === "BERCARIO" && l.periodo === "INTEGRAL");
    const delta = Math.round((linha!.anuidadeDeclaradaContrato - linha!.mensalidade * 12) * 100) / 100;
    expect(delta).toBe(1729.05);
  });
});
