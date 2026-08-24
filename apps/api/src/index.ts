import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { carregaConfig } from "./config.js";
import { criaPool } from "./plugins/db.js";
import { build } from "./app.js";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: path.resolve(AQUI, "../../../.env") });

const config = carregaConfig();
const pool = criaPool(config.databaseUrl);
const app = build(config, pool);

app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
