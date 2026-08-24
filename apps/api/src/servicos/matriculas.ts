import type { PoolClient } from "pg";
import type { TabelaPreco, TabelaPrecoLinha, TabelaPrecoDegrau } from "@somaverso/schemas";
import type { Testemunha } from "@somaverso/schemas";
import type { ConsentimentoEvento } from "./consentimentos.js";
import { NaoEncontradoErro, ValidacaoErro } from "../erros/problema.js";

export type MatriculaStatus = "RASCUNHO" | "INCOMPLETO" | "BLOQUEADO" | "LIBERADO";

export interface MatriculaRow {
  id: string;
  escola_id: string;
  ano_letivo: number;
  tipo: "MATRICULA" | "REMATRICULA";
  status: MatriculaStatus;
  pedido_snapshot: Record<string, unknown>;
  prescricao_anexo_id: string | null;
  testemunhas: Testemunha[];
  consentimentos_historico: ConsentimentoEvento[];
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export async function buscaMatricula(client: PoolClient, matriculaId: string): Promise<MatriculaRow> {
  const { rows } = await client.query<MatriculaRow>(
    `SELECT id, escola_id, ano_letivo, tipo, status, pedido_snapshot, prescricao_anexo_id, testemunhas,
            consentimentos_historico, criado_por, criado_em, atualizado_em
     FROM matricula WHERE id = $1`,
    [matriculaId],
  );
  const matricula = rows[0];
  if (!matricula) throw new NaoEncontradoErro("Matrícula");
  return matricula;
}

export async function atualizaStatusMatricula(client: PoolClient, matriculaId: string, status: MatriculaStatus): Promise<void> {
  await client.query("UPDATE matricula SET status = $1, atualizado_em = now() WHERE id = $2", [status, matriculaId]);
}

export async function atualizaPedidoSnapshot(client: PoolClient, matriculaId: string, pedidoSnapshot: Record<string, unknown>): Promise<void> {
  await client.query("UPDATE matricula SET pedido_snapshot = $1::jsonb, atualizado_em = now() WHERE id = $2", [
    JSON.stringify(pedidoSnapshot),
    matriculaId,
  ]);
}

export async function atualizaTestemunhas(client: PoolClient, matriculaId: string, testemunhas: Testemunha[]): Promise<void> {
  await client.query("UPDATE matricula SET testemunhas = $1::jsonb, atualizado_em = now() WHERE id = $2", [
    JSON.stringify(testemunhas),
    matriculaId,
  ]);
}

export async function acrescentaConsentimentos(client: PoolClient, matriculaId: string, novasEntradas: ConsentimentoEvento[]): Promise<void> {
  if (novasEntradas.length === 0) return;
  await client.query(
    "UPDATE matricula SET consentimentos_historico = consentimentos_historico || $1::jsonb, atualizado_em = now() WHERE id = $2",
    [JSON.stringify(novasEntradas), matriculaId],
  );
}

interface LinhaTabelaPreco {
  id: string;
  ano_letivo: number;
  vigencia_inicio: string;
  status: "RASCUNHO" | "APROVADA";
  aprovada_por_nome: string | null;
  aprovada_em: string | null;
  parcelas: number;
  desconto_pontualidade_pct: string;
  matricula_cheia: string;
}

/**
 * Prefere a tabela APROVADA do ano letivo; sem aprovada, cai para o
 * rascunho mais recente — assim R-07 (motor) tem algo para avaliar e
 * reporta corretamente "sem aprovação registrada" em vez da API precisar
 * fabricar um bloqueio equivalente por fora do motor.
 */
export async function buscaTabelaPrecoAtual(client: PoolClient, anoLetivo: number): Promise<{ id: string }> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM tabela_preco WHERE ano_letivo = $1
     ORDER BY (status = 'APROVADA') DESC, criado_em DESC
     LIMIT 1`,
    [anoLetivo],
  );
  const tabela = rows[0];
  if (!tabela) throw new ValidacaoErro(`Nenhuma tabela de preços cadastrada para o ano letivo ${anoLetivo}.`);
  return tabela;
}

export async function buscaTabelaPrecoCompleta(client: PoolClient, tabelaPrecoId: string): Promise<TabelaPreco> {
  const { rows: linhasTabela } = await client.query<LinhaTabelaPreco>(
    `SELECT tp.id, tp.ano_letivo, tp.vigencia_inicio::text, tp.status, u.nome AS aprovada_por_nome,
            tp.aprovada_em, tp.parcelas, tp.desconto_pontualidade_pct, tp.matricula_cheia
     FROM tabela_preco tp
     LEFT JOIN usuario u ON u.id = tp.aprovada_por_usuario_id
     WHERE tp.id = $1`,
    [tabelaPrecoId],
  );
  const tabela = linhasTabela[0];
  if (!tabela) throw new NaoEncontradoErro("Tabela de preços");

  const { rows: linhas } = await client.query<{
    faixa: string;
    periodo: string;
    mensalidade: string;
    anuidade_declarada_contrato: string;
    alimentacao_inclusa: boolean;
    descricao_contrato: string;
  }>(
    "SELECT faixa, periodo, mensalidade, anuidade_declarada_contrato, alimentacao_inclusa, descricao_contrato FROM tabela_preco_linha WHERE tabela_preco_id = $1",
    [tabelaPrecoId],
  );

  const { rows: adicionaisRows } = await client.query<{
    hora_adicional: string;
    almoco: string;
    almoco_jantar: string;
    almoco_ou_jantar: string;
    fraldario_meio: string;
    fraldario_integral: string;
    fraldario_avulso: string;
  }>(
    "SELECT hora_adicional, almoco, almoco_jantar, almoco_ou_jantar, fraldario_meio, fraldario_integral, fraldario_avulso FROM tabela_preco_adicional WHERE tabela_preco_id = $1",
    [tabelaPrecoId],
  );
  const adicionais = adicionaisRows[0];
  if (!adicionais) throw new Error(`tabela_preco ${tabelaPrecoId} sem linha de adicionais`);

  const { rows: degrausRows } = await client.query<{ chave: string; pct: string; parcelas: number; valor_declarado: string }>(
    "SELECT chave, pct, parcelas, valor_declarado FROM tabela_preco_degrau WHERE tabela_preco_id = $1",
    [tabelaPrecoId],
  );

  return {
    anoLetivo: tabela.ano_letivo,
    vigenciaInicio: tabela.vigencia_inicio,
    aprovadaPor: tabela.aprovada_por_nome,
    aprovadaEm: tabela.aprovada_em,
    parcelas: tabela.parcelas,
    descontoPontualidadePct: Number(tabela.desconto_pontualidade_pct),
    matriculaCheia: Number(tabela.matricula_cheia),
    adicionais: {
      horaAdicional: Number(adicionais.hora_adicional),
      almoco: Number(adicionais.almoco),
      almocoJantar: Number(adicionais.almoco_jantar),
      almocoOuJantar: Number(adicionais.almoco_ou_jantar),
      fraldarioMeio: Number(adicionais.fraldario_meio),
      fraldarioIntegral: Number(adicionais.fraldario_integral),
      fraldarioAvulso: Number(adicionais.fraldario_avulso),
    },
    linhas: linhas.map(
      (l): TabelaPrecoLinha => ({
        faixa: l.faixa as TabelaPrecoLinha["faixa"],
        periodo: l.periodo as TabelaPrecoLinha["periodo"],
        mensalidade: Number(l.mensalidade),
        anuidadeDeclaradaContrato: Number(l.anuidade_declarada_contrato),
        alimentacaoInclusa: l.alimentacao_inclusa,
        descricaoContrato: l.descricao_contrato,
      }),
    ),
    degraus: degrausRows.map(
      (d): TabelaPrecoDegrau => ({
        chave: d.chave as TabelaPrecoDegrau["chave"],
        pct: Number(d.pct),
        parcelas: d.parcelas,
        valorDeclarado: Number(d.valor_declarado),
      }),
    ),
  };
}
