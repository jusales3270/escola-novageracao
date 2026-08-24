import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: path.resolve(AQUI, "../../../.env") });

// Segredo determinístico só para os testes — nunca usado fora deste processo.
process.env["JWT_SECRET"] ??= "segredo-de-teste-com-pelo-menos-32-caracteres";
