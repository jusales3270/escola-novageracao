import { chamaApi } from "./cliente.js";

export interface TabelaPrecoResumo {
  id: string;
  ano_letivo: number;
  status: "RASCUNHO" | "APROVADA";
  aprovada_por_nome: string | null;
}

export function listaTabelasPreco(token: string): Promise<{ tabelas: TabelaPrecoResumo[] }> {
  return chamaApi("/v1/tabelas-preco", { token });
}

export function aprovaTabelaPreco(token: string, tabelaId: string): Promise<{ tabelaPrecoId: string; status: string }> {
  return chamaApi(`/v1/tabelas-preco/${tabelaId}/aprovacao`, { method: "POST", token });
}
