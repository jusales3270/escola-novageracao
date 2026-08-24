import type { Contexto } from "@somaverso/schemas";

export function contextoValido(overrides: Partial<Contexto> = {}): Contexto {
  return {
    tabelaAprovadaPor: "Marlene Modesto da Silva",
    tabelaPrecoId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    testemunhas: [
      { nome: "Renato Alves", cpf: "52998224725", email: "renato@novageracaoitu.com.br" },
      { nome: "Débora Lima", cpf: "11144477735", email: "debora@novageracaoitu.com.br" },
    ],
    prescricaoAnexoId: null,
    dpaAssinado: true,
    ambiente: "homologacao",
    ...overrides,
  };
}
