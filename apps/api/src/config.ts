import { Ambiente } from "@somaverso/schemas";

export interface Config {
  port: number;
  jwtSecret: string;
  databaseUrl: string;
  ambiente: "sandbox" | "homologacao" | "producao";
}

/** Lê e valida a configuração de ambiente uma única vez, na borda. */
export function carregaConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const jwtSecret = env["JWT_SECRET"];
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET não definida ou curta demais (mínimo 32 caracteres)");
  }

  const databaseUrl = env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("DATABASE_URL não definida");

  const ambienteBruto = env["AMBIENTE"] ?? "sandbox";
  const ambiente = Ambiente.safeParse(ambienteBruto);
  if (!ambiente.success) {
    throw new Error(`AMBIENTE inválido: "${ambienteBruto}" (esperado sandbox|homologacao|producao)`);
  }

  const port = Number(env["PORT"] ?? 3000);

  return { port, jwtSecret, databaseUrl, ambiente: ambiente.data };
}
