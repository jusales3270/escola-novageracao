import Fastify from "fastify";
// Prova de que o workspace está corretamente ligado a @somaverso/motor e
// @somaverso/schemas — nenhuma rota real ainda (M3).
import { avalia } from "@somaverso/motor";

const app = Fastify({ logger: true });

app.get("/healthz", async () => ({ status: "ok", motorDisponivel: typeof avalia === "function" }));

// TODO (M3) — rotas do PRD §15, todas sob /v1, autenticadas, escola_id do
// token, erros em RFC 7807:
//   POST   /v1/matriculas
//   PATCH  /v1/matriculas/:id
//   POST   /v1/matriculas/:id/simulacao      (reavalia no servidor, sem efeitos)
//   POST   /v1/matriculas/:id/emissao        (Idempotency-Key, 409 se BLOQUEADO)
//   GET    /v1/matriculas/:id
//   GET    /v1/matriculas/:id/trilha
//   GET    /v1/matriculas/:id/documentos/:tipo
//   POST   /v1/matriculas/:id/alteracao-contratual
//   POST   /v1/consentimentos/:id/revogacao
//   GET,POST /v1/tabelas-preco
//   POST   /v1/tabelas-preco/:id/aprovacao
//   GET    /v1/ledger/verificacao
//   POST   /v1/ds/webhook                    (público, HMAC obrigatório)

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen({ port: 3000 }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}

export { app };
