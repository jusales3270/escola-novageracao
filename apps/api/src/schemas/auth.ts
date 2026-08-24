import { z } from "zod";
import { Papel } from "@somaverso/schemas";

/**
 * Detalhe de transporte de uma única rota — não vira `packages/schemas`
 * (não é vocabulário de domínio compartilhado entre motor/API/web, só
 * forma de request/response de `/v1/auth/login`).
 */
export const LoginRequest = z
  .object({
    email: z.string().email(),
    senha: z.string().min(1),
  })
  .strict();
export type LoginRequest = z.infer<typeof LoginRequest>;

export interface LoginResponse {
  token: string;
  usuario: {
    id: string;
    nome: string;
    escolaId: string;
    papeis: Papel[];
  };
}
