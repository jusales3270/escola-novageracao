import type { Veredito } from "@somaverso/schemas";

/** Erro de aplicação que carrega o suficiente para virar um Problema7807 (RFC 7807). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly type: string,
    public readonly title: string,
    public readonly detail: string,
    public readonly vereditos?: Veredito[],
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export class NaoAutenticadoErro extends ApiError {
  constructor(detail = "Credenciais ausentes ou inválidas.") {
    super(401, "https://somaescola.dev/erros/nao-autenticado", "Não autenticado", detail);
  }
}

export class SemPermissaoErro extends ApiError {
  constructor(detail = "O papel do usuário não tem permissão para esta operação.") {
    super(403, "https://somaescola.dev/erros/sem-permissao", "Sem permissão", detail);
  }
}

export class NaoEncontradoErro extends ApiError {
  constructor(recurso: string) {
    super(404, "https://somaescola.dev/erros/nao-encontrado", "Não encontrado", `${recurso} não encontrado(a).`);
  }
}

export class ValidacaoErro extends ApiError {
  constructor(detail: string) {
    super(400, "https://somaescola.dev/erros/validacao", "Requisição inválida", detail);
  }
}

/** PRD §15 — "409 com a lista completa de vereditos não conformes". */
export class VeredictoBloqueadoErro extends ApiError {
  constructor(vereditos: Veredito[]) {
    super(
      409,
      "https://somaescola.dev/erros/veredito-bloqueado",
      "Matrícula bloqueada",
      `${vereditos.length} regra(s) bloqueante(s) não conforme(s).`,
      vereditos,
    );
  }
}
