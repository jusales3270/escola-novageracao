import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import type { Resultado } from "@somaverso/schemas";
import { registraNaTransacao } from "@somaverso/ledger";
import { atualizaStatusMatricula } from "./matriculas.js";
import type { ClaimsJwt } from "../plugins/auth.js";

/**
 * D-11 — "Hash de veredito não inclui versão do motor nem da tabela.
 * Correção: incluir motorVersao e tabelaPrecoId no material hasheado."
 * `resultado.motorVersao` já vem do motor; `tabelaPrecoId` e `matriculaId`
 * são acrescentados aqui, na fronteira de persistência — o motor
 * (`packages/motor`) continua sem saber de IDs de banco, mantendo I-7
 * (nenhuma regra de negócio no motor depende de infraestrutura).
 */
export function computaHashVeredito(matriculaId: string, tabelaPrecoId: string, resultado: Resultado): string {
  const material = JSON.stringify({
    matriculaId,
    tabelaPrecoId,
    motorVersao: resultado.motorVersao,
    decisao: resultado.decisao,
    vereditos: resultado.vereditos.map((v) => ({ regra: v.regra, conforme: v.conforme, severidade: v.severidade })),
  });
  return createHash("sha256").update(material, "utf8").digest("hex");
}

/**
 * Persiste o veredito (tabela `veredito`) + evento `VEREDITO_MOTOR` no
 * ledger + status da matrícula, tudo na transação já aberta pelo
 * chamador (atomicidade real — ver `apps/api/src/plugins/db.ts`).
 * Reaproveitado por `/emissao` e `/alteracao-contratual`.
 */
export async function persisteVeredito(
  client: PoolClient,
  matriculaId: string,
  tabelaPrecoId: string,
  resultado: Resultado,
  usuario: ClaimsJwt,
): Promise<string> {
  const hash = computaHashVeredito(matriculaId, tabelaPrecoId, resultado);

  await client.query(
    `INSERT INTO veredito (escola_id, matricula_id, tabela_preco_id, motor_versao, decisao, vereditos, hash, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)`,
    [usuario.escolaId, matriculaId, tabelaPrecoId, resultado.motorVersao, resultado.decisao, JSON.stringify(resultado.vereditos), hash, usuario.sub],
  );

  await registraNaTransacao(client, usuario.escolaId, {
    tipo: "VEREDITO_MOTOR",
    ator: usuario.nome,
    matriculaId,
    payload: { decisao: resultado.decisao, hash, tabelaPrecoId, motorVersao: resultado.motorVersao },
  });

  await atualizaStatusMatricula(client, matriculaId, resultado.decisao);

  return hash;
}
