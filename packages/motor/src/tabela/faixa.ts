import type { TabelaPreco, TabelaPrecoLinha, TabelaPrecoDegrau, Faixa, Periodo, DegrauChave } from "@somaverso/schemas";
import { LinhaPrecoNaoEncontrada, DegrauNaoEncontrado } from "../erros.js";

export function buscaLinha(tabela: TabelaPreco, faixa: Faixa, periodo: Periodo): TabelaPrecoLinha {
  const linha = tabela.linhas.find((l) => l.faixa === faixa && l.periodo === periodo);
  if (!linha) throw new LinhaPrecoNaoEncontrada(faixa, periodo);
  return linha;
}

export function buscaDegrau(tabela: TabelaPreco, chave: DegrauChave): TabelaPrecoDegrau {
  const degrau = tabela.degraus.find((d) => d.chave === chave);
  if (!degrau) throw new DegrauNaoEncontrado(chave);
  return degrau;
}
