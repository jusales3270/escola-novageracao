import fjwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Papel } from "@somaverso/schemas";
import { NaoAutenticadoErro, SemPermissaoErro } from "../erros/problema.js";

export interface ClaimsJwt {
  sub: string; // usuario.id
  escolaId: string;
  papeis: Papel[];
  nome: string;
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requerPapel: (...papeis: Papel[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    usuario: ClaimsJwt;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: ClaimsJwt;
    user: ClaimsJwt;
  }
}

/** JWT próprio (PRD M3, decisão registrada) — sem provedor de auth terceiro. */
export function registraAutenticacao(app: FastifyInstance, jwtSecret: string): void {
  app.register(fjwt, { secret: jwtSecret, sign: { expiresIn: "8h" } });

  app.decorate("authenticate", async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const payload = await request.jwtVerify<ClaimsJwt>();
      request.usuario = payload;
    } catch {
      throw new NaoAutenticadoErro();
    }
  });

  app.decorate("requerPapel", (...papeis: Papel[]) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      const temPapel = request.usuario.papeis.some((p) => papeis.includes(p));
      if (!temPapel) {
        throw new SemPermissaoErro(`Requer um dos papéis: ${papeis.join(", ")}.`);
      }
    };
  });
}
