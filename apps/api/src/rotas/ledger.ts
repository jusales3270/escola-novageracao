import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { verifica } from "@somaverso/ledger";

export function registraRotasLedger(app: FastifyInstance, pool: Pool): void {
  app.get(
    "/v1/ledger/verificacao",
    { preHandler: [app.authenticate, app.requerPapel("AUDITOR", "DIRECAO")] },
    async (request) => {
      return verifica(pool, request.usuario.escolaId);
    },
  );
}
