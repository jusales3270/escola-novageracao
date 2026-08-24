import type { Pedido } from "@somaverso/schemas";

type Overrides = {
  [K in keyof Pedido]?: Pedido[K] extends object ? Partial<Pedido[K]> : Pedido[K];
};

function base(): Pedido {
  return {
    anoLetivo: 2027,
    tipo: "MATRICULA",
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
        antitermico: "NENHUM",
        contatoEmergencia: { nome: "Maria Souza", telefone: "11999990000" },
      },
      autorizadosRetirada: [{ nome: "Joana Pereira", cpf: "52998224725", email: "joana@example.com", telefone: "11988880000" }],
    },
    contratante: {
      nome: "Carlos Souza",
      cpf: "52998224725",
      email: "carlos@example.com",
      telefone: "11999990001",
    },
    responsavelFinanceiro: {
      nome: "Carlos Souza",
      cpf: "52998224725",
      email: "carlos@example.com",
      telefone: "11999990001",
      contatoEmergencia: { nome: "Maria Souza", telefone: "11999990000" },
    },
    servicos: {
      turma: "MATERNAL",
      periodo: "MEIO",
      alimentacao: "NENHUMA",
      fraldario: "NENHUM",
      horaAdicionalDiasMes: 0,
    },
    formaPagamentoMatricula: "AVISTA_1X",
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
      papel: "SECRETARIA",
    },
  };
}

/** Pedido completo e válido, com overrides rasos por campo de topo (mescla um nível de profundidade). */
export function pedidoValido(overrides: Overrides = {}): Pedido {
  const b = base();
  const resultado: Record<string, unknown> = { ...b };
  for (const [chave, valor] of Object.entries(overrides)) {
    const atual = (b as Record<string, unknown>)[chave];
    resultado[chave] =
      typeof atual === "object" && atual !== null && !Array.isArray(atual) && typeof valor === "object" && valor !== null
        ? { ...atual, ...valor }
        : valor;
  }
  return resultado as Pedido;
}
