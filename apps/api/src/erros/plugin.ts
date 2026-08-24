import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { ApiError, ValidacaoErro } from "./problema.js";
import type { Problema7807 } from "@somaverso/schemas";

function problemaDe(err: unknown, instance: string): { status: number; corpo: Problema7807 } {
  if (err instanceof ApiError) {
    return {
      status: err.status,
      corpo: {
        type: err.type,
        title: err.title,
        status: err.status,
        detail: err.detail,
        instance,
        ...(err.vereditos ? { vereditos: err.vereditos } : {}),
      },
    };
  }

  if (err instanceof ZodError) {
    const detail = err.issues.map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`).join("; ");
    const validacao = new ValidacaoErro(detail || "Corpo da requisição inválido.");
    return problemaDe(validacao, instance);
  }

  return {
    status: 500,
    corpo: {
      type: "https://somaescola.dev/erros/interno",
      title: "Erro interno",
      status: 500,
      detail: "Falha inesperada no servidor.",
      instance,
    },
  };
}

/** Converte qualquer erro lançado num handler em RFC 7807 (PRD §15). */
export function registraTratadorDeErros(app: FastifyInstance): void {
  app.setErrorHandler((err, request: FastifyRequest, reply: FastifyReply) => {
    const { status, corpo } = problemaDe(err, request.url);
    if (status >= 500) request.log.error({ err }, "erro interno");
    reply.status(status).type("application/problem+json").send(corpo);
  });

  app.setNotFoundHandler((request, reply) => {
    reply
      .status(404)
      .type("application/problem+json")
      .send({
        type: "https://somaescola.dev/erros/nao-encontrado",
        title: "Não encontrado",
        status: 404,
        detail: `Rota ${request.method} ${request.url} não existe.`,
        instance: request.url,
      } satisfies Problema7807);
  });
}
