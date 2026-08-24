import { describe, expect, test } from "vitest";
import { Pedido } from "../src/pedido.js";

function pedidoValido() {
  return {
    anoLetivo: 2027,
    tipo: "MATRICULA" as const,
    aluno: {
      nome: "Ana Beatriz Souza",
      nascimento: "2020-01-15",
      endereco: "Rua das Flores, 123",
      bairro: "Centro",
      cidade: "Itu",
      cep: "13300000",
      irmaosNaEscola: [],
      restricaoJudicial: false,
      restricaoJudicialAnexoId: null,
      ficha: {
        usoContinuoMedicamento: false,
        alergico: false,
        antitermico: "NENHUM" as const,
        contatoEmergencia: { nome: "Maria Souza", telefone: "11999990000" },
      },
      autorizadosRetirada: [],
    },
    contratante: {
      nome: "Carlos Souza",
      cpf: "52998224725",
      email: "carlos@example.com",
      telefone: "11999990001",
    },
    responsavelFinanceiro: {
      nome: "Carlos Souza",
      cpf: "11144477735",
      email: "carlos@example.com",
      telefone: "11999990001",
      contatoEmergencia: { nome: "Maria Souza", telefone: "11999990000" },
    },
    servicos: {
      turma: "MATERNAL" as const,
      periodo: "MEIO" as const,
      alimentacao: "NENHUMA" as const,
      fraldario: "NENHUM" as const,
      horaAdicionalDiasMes: 0,
    },
    formaPagamentoMatricula: "AVISTA_1X" as const,
    descontoExcepcionalPct: 0,
    consentimentos: {
      SITE: true,
      REDES_SOCIAIS: true,
      ALBUM_TURMA: true,
      USO_PEDAGOGICO_INTERNO: true,
      MATERIAL_IMPRESSO: true,
    },
    operador: {
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      nome: "Secretaria Escolar",
      papel: "SECRETARIA" as const,
    },
  };
}

describe("Pedido (.strict())", () => {
  test("aceita um pedido completo e válido", () => {
    const r = Pedido.safeParse(pedidoValido());
    expect(r.success).toBe(true);
  });

  test("rejeita campo desconhecido no nível raiz", () => {
    const r = Pedido.safeParse({ ...pedidoValido(), campoInventado: true });
    expect(r.success).toBe(false);
  });

  test("rejeita campo desconhecido em objeto aninhado (servicos)", () => {
    const pedido = pedidoValido();
    const r = Pedido.safeParse({
      ...pedido,
      servicos: { ...pedido.servicos, extra: 1 },
    });
    expect(r.success).toBe(false);
  });

  test("rejeita responsavelFinanceiro sem contatoEmergencia (D-13)", () => {
    const pedido = pedidoValido() as any;
    delete pedido.responsavelFinanceiro.contatoEmergencia;
    const r = Pedido.safeParse(pedido);
    expect(r.success).toBe(false);
  });

  test("rejeita operador sem papel reconhecido", () => {
    const pedido = pedidoValido();
    const r = Pedido.safeParse({
      ...pedido,
      operador: { ...pedido.operador, papel: "INSPETOR" },
    });
    expect(r.success).toBe(false);
  });
});
