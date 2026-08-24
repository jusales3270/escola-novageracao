import { MOTOR_SOURCE_HASH } from "./versao.generated.js";
import pkg from "../package.json" with { type: "json" };

/**
 * PRD §9 — "motorVersao é semver do pacote + hash do fonte compilado,
 * gravado em cada veredito. Reavaliação histórica usa a versão registrada,
 * nunca a corrente." Interpretação prática: hash sha256 (16 chars) do
 * código-fonte TS concatenado, gerado em build/test por
 * scripts/gerar-versao.mjs (evita o problema de o artefato ter que se
 * autohashear enquanto ainda está sendo produzido).
 */
export function motorVersao(): string {
  return `${pkg.version}+${MOTOR_SOURCE_HASH}`;
}
