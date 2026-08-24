import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

export function criaPoolMigrador(): Pool {
  const connectionString = process.env["DATABASE_URL_MIGRATOR"];
  if (!connectionString) throw new Error("DATABASE_URL_MIGRATOR não definida.");
  return new Pool({ connectionString });
}

export async function criaEscolaDeTeste(pool: Pool, nome = "Escola E2E"): Promise<string> {
  const cnpj = String(Math.floor(Math.random() * 1e14)).padStart(14, "0");
  const { rows } = await pool.query<{ id: string }>("INSERT INTO escola (nome, cnpj) VALUES ($1,$2) RETURNING id", [nome, cnpj]);
  const id = rows[0]?.id;
  if (!id) throw new Error("falha ao criar escola E2E");
  return id;
}

export interface UsuarioSeed {
  id: string;
  email: string;
  senha: string;
}

export async function criaUsuarioDeTeste(pool: Pool, escolaId: string, papeis: string[], nome: string): Promise<UsuarioSeed> {
  const email = `${randomUUID()}@novageracaoitu.com.br`;
  const senha = "senha-e2e-123";
  const senhaHash = await bcrypt.hash(senha, 12);
  const { rows } = await pool.query<{ id: string }>(
    "INSERT INTO usuario (escola_id, nome, email, senha_hash) VALUES ($1,$2,$3,$4) RETURNING id",
    [escolaId, nome, email, senhaHash],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error("falha ao criar usuário E2E");
  for (const papel of papeis) {
    await pool.query("INSERT INTO usuario_papel (usuario_id, escola_id, papel) VALUES ($1,$2,$3)", [id, escolaId, papel]);
  }
  return { id, email, senha };
}

/** Tabela "limpa" (sem o defeito de R-01) — nunca reusar TABELA_2027 real em teste, ver packages/motor. */
export async function criaTabelaPrecoLimpa(pool: Pool, escolaId: string, criadoPor: string, anoLetivo: number): Promise<string> {
  const mensalidade = 2080.13;
  const anuidade = 24961.56;

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO tabela_preco (escola_id, ano_letivo, vigencia_inicio, status, parcelas, desconto_pontualidade_pct, matricula_cheia, hash_conteudo, criado_por)
     VALUES ($1,$2,'2026-08-01','RASCUNHO',12,5,1821.46,$3,$4) RETURNING id`,
    [escolaId, anoLetivo, `e2e-${randomUUID()}`, criadoPor],
  );
  const tabelaId = rows[0]?.id;
  if (!tabelaId) throw new Error("falha ao criar tabela de preços E2E");

  await pool.query(
    `INSERT INTO tabela_preco_adicional (tabela_preco_id, escola_id, hora_adicional, almoco, almoco_jantar, almoco_ou_jantar, fraldario_meio, fraldario_integral, fraldario_avulso)
     VALUES ($1,$2,27,570,800,530,270,485,27)`,
    [tabelaId, escolaId],
  );
  await pool.query(
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
    await pool.query(
      "INSERT INTO tabela_preco_degrau (escola_id, tabela_preco_id, chave, pct, parcelas, valor_declarado) VALUES ($1,$2,$3,$4,$5,$6)",
      [escolaId, tabelaId, chave, pct, parcelas, valorDeclarado],
    );
  }
  return tabelaId;
}
