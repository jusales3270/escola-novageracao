import type { TabelaPreco, TabelaPrecoDegrau } from "@somaverso/schemas";
import { TABELA_2027 } from "../../src/tabela/tabela-2027.js";

/** Data usada como `agora` nos testes — depois de `vigenciaInicio` (2026-08-01) e dentro do ano letivo 2027. */
export const AGORA_TESTE = new Date("2027-02-01T12:00:00.000Z");

export function aprovarTabela(tabela: TabelaPreco = TABELA_2027, aprovadaPor = "Marlene Modesto da Silva"): TabelaPreco {
  return { ...tabela, aprovadaPor, aprovadaEm: "2026-08-01T00:00:00.000Z" };
}

export function comDegrauAdulterado(tabela: TabelaPreco, chave: TabelaPrecoDegrau["chave"], valorDeclarado: number): TabelaPreco {
  return {
    ...tabela,
    degraus: tabela.degraus.map((d) => (d.chave === chave ? { ...d, valorDeclarado } : d)),
  };
}
