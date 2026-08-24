import type { Papel } from "@somaverso/schemas";
import { chamaApi } from "./cliente.js";

export interface UsuarioLogado {
  id: string;
  nome: string;
  escolaId: string;
  papeis: Papel[];
}

export interface LoginResposta {
  token: string;
  usuario: UsuarioLogado;
}

export function login(email: string, senha: string): Promise<LoginResposta> {
  return chamaApi<LoginResposta>("/v1/auth/login", { method: "POST", body: { email, senha } });
}
