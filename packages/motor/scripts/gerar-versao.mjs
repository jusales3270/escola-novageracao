// Gera packages/motor/src/versao.generated.ts a partir do hash sha256 do
// código-fonte TS de src/**/*.ts (exceto os próprios arquivos de versão).
// Roda como pretest/prebuild — nunca é importado por src/ além de versao.ts.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");

function listarArquivosTs(dir) {
  const arquivos = [];
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) {
      arquivos.push(...listarArquivosTs(caminho));
    } else if (entrada.endsWith(".ts") && !entrada.startsWith("versao")) {
      arquivos.push(caminho);
    }
  }
  return arquivos;
}

const arquivos = listarArquivosTs(srcDir)
  .map((f) => relative(srcDir, f))
  .sort();

const hash = createHash("sha256");
for (const rel of arquivos) {
  hash.update(rel);
  hash.update(readFileSync(join(srcDir, rel)));
}

const hashHex = hash.digest("hex").slice(0, 16);

writeFileSync(
  join(srcDir, "versao.generated.ts"),
  `// Gerado por scripts/gerar-versao.mjs — não editar manualmente.\n` +
    `export const MOTOR_SOURCE_HASH = ${JSON.stringify(hashHex)};\n`,
);
