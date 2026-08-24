import { Pool } from "pg";

/** Pool com a role `soma_migrator` — DDL, fixtures e simulação de adulteração "por SQL direto". */
export function criaPoolMigrador(): Pool {
  const connectionString = process.env["DATABASE_URL_MIGRATOR"];
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL_MIGRATOR não definida. Rode `pnpm db:up && pnpm db:migrate` e confira o .env antes de `pnpm test:integration`.",
    );
  }
  return new Pool({ connectionString });
}

/**
 * Pool com a role `soma_app` — o caminho real de registra()/verifica().
 * `max` acima do default (10) porque o teste de concorrência abre várias
 * conexões simultâneas de propósito.
 */
export function criaPoolApp(): Pool {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não definida. Rode `pnpm db:up && pnpm db:migrate` e confira o .env antes de `pnpm test:integration`.",
    );
  }
  return new Pool({ connectionString, max: 20 });
}

export async function criaEscolaDeTeste(poolMigrador: Pool, nome = "Escola de Teste"): Promise<string> {
  const cnpj = String(Math.floor(Math.random() * 1e14)).padStart(14, "0");
  const { rows } = await poolMigrador.query<{ id: string }>(
    "INSERT INTO escola (nome, cnpj) VALUES ($1, $2) RETURNING id",
    [nome, cnpj],
  );
  const linha = rows[0];
  if (!linha) throw new Error("falha ao criar escola de teste");
  return linha.id;
}

/**
 * Limpa escolas de teste ao final da suíte. `ledger_evento` é append-only
 * mesmo para o dono da tabela — desabilitar o trigger é a única forma de
 * apagar (a mesma mecânica usada em adulteracao.integration.test.ts, aqui
 * só para teardown, nunca em código de aplicação).
 */
export async function apagaEscolasDeTeste(poolMigrador: Pool, escolaIds: string[]): Promise<void> {
  if (escolaIds.length === 0) return;
  const client = await poolMigrador.connect();
  try {
    await client.query("ALTER TABLE ledger_evento DISABLE TRIGGER ledger_evento_append_only");
    await client.query("DELETE FROM ledger_evento WHERE escola_id = ANY($1::uuid[])", [escolaIds]);
    await client.query("ALTER TABLE ledger_evento ENABLE TRIGGER ledger_evento_append_only");
    await client.query("DELETE FROM escola_ledger_seq WHERE escola_id = ANY($1::uuid[])", [escolaIds]);
    await client.query("DELETE FROM escola WHERE id = ANY($1::uuid[])", [escolaIds]);
  } finally {
    client.release();
  }
}
