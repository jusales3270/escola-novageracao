import type { FastifyInstance } from "fastify";
import { build } from "../../src/app.js";
import { criaPool } from "../../src/plugins/db.js";
import type { Config } from "../../src/config.js";
import { stringDatabaseUrlApp } from "./db.js";

export function constroiAppDeTeste(ambiente: Config["ambiente"] = "homologacao"): FastifyInstance {
  const config: Config = {
    port: 0,
    jwtSecret: process.env["JWT_SECRET"] ?? "segredo-de-teste-com-pelo-menos-32-caracteres",
    databaseUrl: stringDatabaseUrlApp(),
    ambiente,
  };
  const pool = criaPool(config.databaseUrl);
  return build(config, pool);
}

export async function login(app: FastifyInstance, email: string, senha: string): Promise<string> {
  const resposta = await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email, senha } });
  if (resposta.statusCode !== 200) {
    throw new Error(`login falhou (${resposta.statusCode}): ${resposta.body}`);
  }
  return (resposta.json() as { token: string }).token;
}
