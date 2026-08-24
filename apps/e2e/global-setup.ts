import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import dotenv from "dotenv";
import { criaPoolMigrador, criaEscolaDeTeste, criaUsuarioDeTeste, criaTabelaPrecoLimpa } from "./fixtures.js";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: path.resolve(AQUI, "../../.env") });

const ANO_LETIVO = 2097;

export default async function globalSetup(): Promise<void> {
  const pool = criaPoolMigrador();

  const escolaId = await criaEscolaDeTeste(pool, "Escola E2E M3");
  // Um usuário com os dois papéis, de propósito: o E2E existe para validar
  // a jornada INCOMPLETO → BLOQUEADO → LIBERADO na UI real (PRD §17), não
  // para reprovar RBAC entre usuários — isso já é coberto a fundo por
  // apps/api/test/rotas/rbac-i6.test.ts. Simplifica a orquestração do
  // teste sem perder cobertura real de nenhum invariante.
  const operador = await criaUsuarioDeTeste(pool, escolaId, ["SECRETARIA", "DIRECAO"], "Operador E2E");
  const tabelaId = await criaTabelaPrecoLimpa(pool, escolaId, operador.id, ANO_LETIVO);

  await writeFile(path.resolve(AQUI, ".fixtures.json"), JSON.stringify({ escolaId, operador, tabelaId, anoLetivo: ANO_LETIVO }, null, 2));

  await pool.end();
}
