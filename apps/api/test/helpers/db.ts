import { Pool } from "pg";

export function criaPoolMigrador(): Pool {
  const connectionString = process.env["DATABASE_URL_MIGRATOR"];
  if (!connectionString) {
    throw new Error("DATABASE_URL_MIGRATOR não definida. Rode `pnpm db:up && pnpm db:migrate` antes de testar a API.");
  }
  return new Pool({ connectionString });
}

export function stringDatabaseUrlApp(): string {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida. Rode `pnpm db:up && pnpm db:migrate` antes de testar a API.");
  }
  return connectionString;
}
