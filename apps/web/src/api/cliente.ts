import type { Problema7807 } from "@somaverso/schemas";

export class ErroApi extends Error {
  constructor(
    public readonly status: number,
    public readonly problema: Problema7807 | null,
  ) {
    super(problema?.detail ?? `Erro HTTP ${status}`);
    this.name = "ErroApi";
  }
}

interface Opcoes {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string | null;
  idempotencyKey?: string;
}

/** Wrapper fino de fetch: Bearer, RFC 7807 em erro, JSON nas duas pontas. */
export async function chamaApi<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opcoes.token) headers["Authorization"] = `Bearer ${opcoes.token}`;
  if (opcoes.idempotencyKey) headers["Idempotency-Key"] = opcoes.idempotencyKey;

  const init: RequestInit = { method: opcoes.method ?? "GET", headers };
  // Content-Type só quando há corpo de fato — o parser padrão do Fastify
  // rejeita "application/json" com corpo vazio (FST_ERR_CTP_EMPTY_JSON_BODY).
  if (opcoes.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opcoes.body);
  }

  const resposta = await fetch(caminho, init);

  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    throw new ErroApi(resposta.status, corpo as Problema7807 | null);
  }
  return corpo as T;
}
