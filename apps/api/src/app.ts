import Fastify, { type FastifyInstance } from "fastify";
import type { Pool } from "pg";
import type { Config } from "./config.js";
import { registraTratadorDeErros } from "./erros/plugin.js";
import { registraAutenticacao } from "./plugins/auth.js";
import { registraRotasAuth } from "./rotas/auth.js";
import { registraRotasMatriculas } from "./rotas/matriculas.js";
import { registraRotasConsentimentos } from "./rotas/consentimentos.js";
import { registraRotasTabelasPreco } from "./rotas/tabelas-preco.js";
import { registraRotasLedger } from "./rotas/ledger.js";

/**
 * Separado de `index.ts` (que só chama `.listen()`) para que os testes de
 * API (`apps/api/test/`) usem `app.inject()` sem precisar de um servidor
 * HTTP real escutando numa porta.
 */
export function build(config: Config, pool: Pool): FastifyInstance {
  const app = Fastify({ logger: true });

  registraTratadorDeErros(app);
  registraAutenticacao(app, config.jwtSecret);

  app.get("/healthz", async () => ({ status: "ok" }));

  registraRotasAuth(app, pool);
  registraRotasMatriculas(app, pool, config);
  registraRotasConsentimentos(app, pool);
  registraRotasTabelasPreco(app, pool);
  registraRotasLedger(app, pool);

  // PRD §15 — fora de escopo do M3: depende de M5 (DocuSign). Rota
  // explícita (não 404 silencioso) para deixar claro que é falta de
  // implementação, não URL errada — mesmo princípio do §13.
  app.post("/v1/ds/webhook", async (_request, reply) => {
    reply.status(501).type("application/problem+json").send({
      type: "https://somaescola.dev/erros/nao-implementado",
      title: "Não implementado",
      status: 501,
      detail: "Webhook DocuSign depende de M5 (assinatura eletrônica) — ainda não implementado.",
      instance: "/v1/ds/webhook",
    });
  });

  app.addHook("onClose", async () => {
    await pool.end();
  });

  return app;
}
