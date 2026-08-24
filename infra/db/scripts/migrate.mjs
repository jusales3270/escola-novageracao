import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Client } from "pg";
import dotenv from "dotenv";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
const MIGRATIONS_DIR = path.resolve(AQUI, "../migrations");

dotenv.config({ path: path.resolve(AQUI, "../../../.env") });

async function main() {
  const connectionString = process.env.DATABASE_URL_MIGRATOR;
  if (!connectionString) throw new Error("DATABASE_URL_MIGRATOR não definida");

  const appPassword = process.env.APP_DB_PASSWORD;
  if (!appPassword) throw new Error("APP_DB_PASSWORD não definida (necessária para provisionar soma_app)");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id serial PRIMARY KEY,
        arquivo text NOT NULL UNIQUE,
        checksum text NOT NULL,
        aplicada_em timestamptz NOT NULL DEFAULT now()
      )
    `);

    const arquivos = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
    const { rows: aplicadas } = await client.query("SELECT arquivo, checksum FROM _migrations");
    const checksumAplicado = new Map(aplicadas.map((r) => [r.arquivo, r.checksum]));

    for (const arquivo of arquivos) {
      const bruto = await readFile(path.join(MIGRATIONS_DIR, arquivo), "utf8");
      // Checksum sobre o conteúdo ORIGINAL (antes da substituição de senha)
      // — a senha nunca influencia o checksum guardado.
      const checksum = createHash("sha256").update(bruto).digest("hex");

      const jaAplicado = checksumAplicado.get(arquivo);
      if (jaAplicado) {
        if (jaAplicado !== checksum) {
          throw new Error(
            `${arquivo} já foi aplicada mas o conteúdo mudou (checksum diverge). ` +
              `Nunca edite uma migration já aplicada — crie uma nova.`,
          );
        }
        continue;
      }

      const sql = bruto.replaceAll("__APP_DB_PASSWORD__", appPassword.replaceAll("'", "''"));
      console.log(`aplicando ${arquivo}...`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (arquivo, checksum) VALUES ($1, $2)", [arquivo, checksum]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`falha aplicando ${arquivo}: ${err.message}`, { cause: err });
      }
    }
    console.log("migrations em dia.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
