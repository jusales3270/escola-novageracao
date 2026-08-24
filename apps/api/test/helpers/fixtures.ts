import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Pool } from "pg";
import type { Papel } from "@somaverso/schemas";

export async function criaEscolaDeTeste(poolMigrador: Pool, nome = "Escola API Teste"): Promise<string> {
  const cnpj = String(Math.floor(Math.random() * 1e14)).padStart(14, "0");
  const { rows } = await poolMigrador.query<{ id: string }>("INSERT INTO escola (nome, cnpj) VALUES ($1,$2) RETURNING id", [nome, cnpj]);
  const id = rows[0]?.id;
  if (!id) throw new Error("falha ao criar escola de teste");
  return id;
}

export interface UsuarioDeTeste {
  id: string;
  email: string;
  senha: string;
}

export async function criaUsuarioDeTeste(
  poolMigrador: Pool,
  escolaId: string,
  papeis: Papel[],
  opts: { nome?: string } = {},
): Promise<UsuarioDeTeste> {
  const email = `${randomUUID()}@novageracaoitu.com.br`;
  const senha = "senha-teste-123";
  const senhaHash = await bcrypt.hash(senha, 12);
  const { rows } = await poolMigrador.query<{ id: string }>(
    "INSERT INTO usuario (escola_id, nome, email, senha_hash) VALUES ($1,$2,$3,$4) RETURNING id",
    [escolaId, opts.nome ?? "Usuário Teste", email, senhaHash],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error("falha ao criar usuário de teste");

  for (const papel of papeis) {
    await poolMigrador.query("INSERT INTO usuario_papel (usuario_id, escola_id, papel) VALUES ($1,$2,$3)", [id, escolaId, papel]);
  }

  return { id, email, senha };
}

export async function marcaDpaAssinado(poolMigrador: Pool, escolaId: string): Promise<void> {
  await poolMigrador.query("UPDATE escola SET dpa_assinado_em = now(), dpa_assinado_por = 'assessoria de teste' WHERE id = $1", [escolaId]);
}

/**
 * Uma tabela de preços de teste com números "limpos" (mensalidade × 12 ==
 * anuidade declarada, sem o defeito de R-01) — para testar o caminho
 * LIBERADO sem reusar a fixture de regressão TABELA_2027 (essa nunca deve
 * ser aprovada, nem em teste — ver packages/motor/src/tabela/tabela-2027.ts).
 * Degraus copiados de TABELA_2027 (a escada não depende da faixa/turma).
 */
export async function criaTabelaPrecoLimpa(
  poolMigrador: Pool,
  escolaId: string,
  criadoPor: string,
  opts: { anoLetivo: number; aprovadaPorUsuarioId?: string },
): Promise<string> {
  const mensalidade = 2080.13;
  const anuidade = 24961.56; // exatamente mensalidade * 12 — R-01 conforme
  const hashConteudo = `teste-${randomUUID()}`;

  const { rows } = await poolMigrador.query<{ id: string }>(
    `INSERT INTO tabela_preco (escola_id, ano_letivo, vigencia_inicio, status, aprovada_por_usuario_id, aprovada_em, parcelas, desconto_pontualidade_pct, matricula_cheia, hash_conteudo, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [
      escolaId,
      opts.anoLetivo,
      "2026-08-01",
      opts.aprovadaPorUsuarioId ? "APROVADA" : "RASCUNHO",
      opts.aprovadaPorUsuarioId ?? null,
      opts.aprovadaPorUsuarioId ? new Date().toISOString() : null,
      12,
      5,
      1821.46,
      hashConteudo,
      criadoPor,
    ],
  );
  const tabelaId = rows[0]?.id;
  if (!tabelaId) throw new Error("falha ao criar tabela de preços de teste");

  await poolMigrador.query(
    `INSERT INTO tabela_preco_adicional (tabela_preco_id, escola_id, hora_adicional, almoco, almoco_jantar, almoco_ou_jantar, fraldario_meio, fraldario_integral, fraldario_avulso)
     VALUES ($1,$2,27,570,800,530,270,485,27)`,
    [tabelaId, escolaId],
  );

  await poolMigrador.query(
    `INSERT INTO tabela_preco_linha (escola_id, tabela_preco_id, faixa, periodo, mensalidade, anuidade_declarada_contrato, alimentacao_inclusa, descricao_contrato)
     VALUES ($1,$2,'MATERNAL_JARDIM_ALFA','MEIO',$3,$4,false,'04 horas diárias')`,
    [escolaId, tabelaId, mensalidade, anuidade],
  );

  const degraus: [string, number, number, number][] = [
    ["AVISTA_ATE_31_08", 50, 1, 910.73],
    ["AVISTA_ATE_15_09", 45, 1, 1001.8],
    ["AVISTA_1X", 40, 1, 1092.88],
    ["CARTAO_2X", 35, 2, 591.97],
    ["CARTAO_3X", 20, 3, 485.72],
    ["CARTAO_4X", 10, 4, 409.83],
    ["CARTAO_5X", 5, 5, 346.08],
    ["CARTAO_6X", 0, 6, 303.58],
  ];
  for (const [chave, pct, parcelas, valorDeclarado] of degraus) {
    await poolMigrador.query(
      "INSERT INTO tabela_preco_degrau (escola_id, tabela_preco_id, chave, pct, parcelas, valor_declarado) VALUES ($1,$2,$3,$4,$5,$6)",
      [escolaId, tabelaId, chave, pct, parcelas, valorDeclarado],
    );
  }

  return tabelaId;
}

export async function apagaEscolaDeTeste(poolMigrador: Pool, escolaId: string): Promise<void> {
  const client = await poolMigrador.connect();
  try {
    await client.query("ALTER TABLE ledger_evento DISABLE TRIGGER ledger_evento_append_only");
    await client.query("DELETE FROM ledger_evento WHERE escola_id = $1", [escolaId]);
    await client.query("ALTER TABLE ledger_evento ENABLE TRIGGER ledger_evento_append_only");
    await client.query("DELETE FROM veredito WHERE escola_id = $1", [escolaId]);
    await client.query("DELETE FROM idempotencia WHERE escola_id = $1", [escolaId]);
    await client.query("DELETE FROM matricula WHERE escola_id = $1", [escolaId]);
    await client.query("DELETE FROM tabela_preco_degrau WHERE escola_id = $1", [escolaId]);
    await client.query("DELETE FROM tabela_preco_linha WHERE escola_id = $1", [escolaId]);
    await client.query("DELETE FROM tabela_preco_adicional WHERE escola_id = $1", [escolaId]);
    await client.query("DELETE FROM tabela_preco WHERE escola_id = $1", [escolaId]);
    await client.query("DELETE FROM usuario_papel WHERE escola_id = $1", [escolaId]);
    await client.query("DELETE FROM usuario WHERE escola_id = $1", [escolaId]);
    await client.query("DELETE FROM escola_ledger_seq WHERE escola_id = $1", [escolaId]);
    await client.query("DELETE FROM escola WHERE id = $1", [escolaId]);
  } finally {
    client.release();
  }
}
