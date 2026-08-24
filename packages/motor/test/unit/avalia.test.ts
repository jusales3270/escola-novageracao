import { describe, expect, test } from "vitest";
import { avalia } from "../../src/avalia.js";
import { ORDEM_EXIBICAO } from "../../src/regras/index.js";
import { pedidoValido } from "../fixtures/pedido.fixture.js";
import { aprovarTabela, AGORA_TESTE } from "../fixtures/tabela.fixture.js";
import { contextoValido } from "../fixtures/contexto.fixture.js";

describe("avalia()", () => {
  test("pedido válido + tabela aprovada + contexto válido => LIBERADO, com cálculo", () => {
    const r = avalia(pedidoValido(), contextoValido(), aprovarTabela(), AGORA_TESTE);
    expect(r.decisao).toBe("LIBERADO");
    expect(r.bloqueios).toHaveLength(0);
    expect(r.calculo).not.toBeNull();
    expect(r.motorVersao).toMatch(/^\d+\.\d+\.\d+\+[0-9a-f]{16}$/);
  });

  test("monta os vereditos na ordem de exibição fixa do §9", () => {
    const r = avalia(pedidoValido(), contextoValido(), aprovarTabela(), AGORA_TESTE);
    expect(r.vereditos.map((v) => v.regra)).toEqual([...ORDEM_EXIBICAO]);
  });

  test("qualquer bloqueio => BLOQUEADO e calculo nulo", () => {
    const r = avalia(pedidoValido(), contextoValido({ testemunhas: [] }), aprovarTabela(), AGORA_TESTE);
    expect(r.decisao).toBe("BLOQUEADO");
    expect(r.calculo).toBeNull();
    expect(r.bloqueios.some((b) => b.regra === "R-06")).toBe(true);
  });

  test("ALERTA não conforme não bloqueia a decisão (R-11)", () => {
    const tabelaComAlerta = { ...aprovarTabela(), degraus: aprovarTabela().degraus.map((d, i) => (i === 0 ? { ...d, valorDeclarado: 1 } : d)) };
    const r = avalia(pedidoValido(), contextoValido(), tabelaComAlerta, AGORA_TESTE);
    expect(r.decisao).toBe("LIBERADO");
    const r11 = r.vereditos.find((v) => v.regra === "R-11");
    expect(r11?.conforme).toBe(false);
    expect(r11?.severidade).toBe("ALERTA");
  });

  test("motorVersao usa a versão registrada mesmo se recalculado depois (determinístico por fonte)", () => {
    const r1 = avalia(pedidoValido(), contextoValido(), aprovarTabela(), AGORA_TESTE);
    const r2 = avalia(pedidoValido(), contextoValido(), aprovarTabela(), AGORA_TESTE);
    expect(r1.motorVersao).toBe(r2.motorVersao);
  });
});
