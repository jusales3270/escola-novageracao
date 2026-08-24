import { describe, expect, test } from "vitest";
import { pendencias } from "../../src/pendencias.js";
import { pedidoValido } from "../fixtures/pedido.fixture.js";

describe("pendencias() — estado INCOMPLETO (D-13)", () => {
  test("pedido válido não tem pendências", () => {
    expect(pendencias(pedidoValido())).toEqual([]);
  });

  test("operador sem nome/papel entra na lista (D-13)", () => {
    const pedido = pedidoValido() as any;
    delete pedido.operador.nome;
    delete pedido.operador.papel;
    const p = pendencias(pedido);
    const campos = p.map((x) => x.campo);
    expect(campos).toContain("operador.nome");
    expect(campos).toContain("operador.papel");
  });

  test("responsavelFinanceiro sem contato de emergência entra na lista (D-13)", () => {
    const pedido = pedidoValido() as any;
    delete pedido.responsavelFinanceiro.contatoEmergencia;
    const p = pendencias(pedido);
    const campos = p.map((x) => x.campo);
    expect(campos).toContain("responsavelFinanceiro.contatoEmergencia");
    expect(p.find((x) => x.campo === "responsavelFinanceiro.contatoEmergencia")?.rotulo).toBe(
      "Responsável financeiro — contato de emergência",
    );
  });

  test("responsavelFinanceiro com contato de emergência incompleto entra na lista (D-13)", () => {
    const pedido = pedidoValido() as any;
    delete pedido.responsavelFinanceiro.contatoEmergencia.nome;
    delete pedido.responsavelFinanceiro.contatoEmergencia.telefone;
    const p = pendencias(pedido);
    const campos = p.map((x) => x.campo);
    expect(campos).toContain("responsavelFinanceiro.contatoEmergencia.nome");
    expect(campos).toContain("responsavelFinanceiro.contatoEmergencia.telefone");
  });

  test("rótulo cai de volta para o caminho bruto quando não mapeado", () => {
    const pedido = pedidoValido() as any;
    delete pedido.anoLetivo;
    const p = pendencias(pedido);
    const item = p.find((x) => x.campo === "anoLetivo");
    expect(item?.rotulo).toBe("anoLetivo");
  });
});
