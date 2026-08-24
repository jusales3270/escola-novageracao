import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { Pool, PoolClient } from "pg";
import { registraNaTransacao } from "@somaverso/ledger";
import { withLeitura, withTransacao } from "../plugins/db.js";
import { CriaTabelaPrecoRequest } from "../schemas/tabela-preco.js";
import { ValidacaoErro } from "../erros/problema.js";

const PAPEIS_LEEM = ["SECRETARIA", "COORDENACAO", "DIRECAO", "AUDITOR"] as const;

async function insereTabelaPreco(client: PoolClient, escolaId: string, criadoPor: string, corpo: CriaTabelaPrecoRequest): Promise<string> {
  const hashConteudo = createHash("sha256").update(JSON.stringify(corpo), "utf8").digest("hex");

  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO tabela_preco (escola_id, ano_letivo, vigencia_inicio, parcelas, desconto_pontualidade_pct, matricula_cheia, hash_conteudo, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [escolaId, corpo.anoLetivo, corpo.vigenciaInicio, corpo.parcelas, corpo.descontoPontualidadePct, corpo.matriculaCheia, hashConteudo, criadoPor],
  );
  const tabelaId = rows[0]?.id;
  if (!tabelaId) throw new Error("falha ao criar tabela de preços");

  await client.query(
    `INSERT INTO tabela_preco_adicional (tabela_preco_id, escola_id, hora_adicional, almoco, almoco_jantar, almoco_ou_jantar, fraldario_meio, fraldario_integral, fraldario_avulso)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      tabelaId,
      escolaId,
      corpo.adicionais.horaAdicional,
      corpo.adicionais.almoco,
      corpo.adicionais.almocoJantar,
      corpo.adicionais.almocoOuJantar,
      corpo.adicionais.fraldarioMeio,
      corpo.adicionais.fraldarioIntegral,
      corpo.adicionais.fraldarioAvulso,
    ],
  );

  for (const linha of corpo.linhas) {
    await client.query(
      `INSERT INTO tabela_preco_linha (escola_id, tabela_preco_id, faixa, periodo, mensalidade, anuidade_declarada_contrato, alimentacao_inclusa, descricao_contrato)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [escolaId, tabelaId, linha.faixa, linha.periodo, linha.mensalidade, linha.anuidadeDeclaradaContrato, linha.alimentacaoInclusa, linha.descricaoContrato],
    );
  }

  for (const degrau of corpo.degraus) {
    await client.query(
      `INSERT INTO tabela_preco_degrau (escola_id, tabela_preco_id, chave, pct, parcelas, valor_declarado)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [escolaId, tabelaId, degrau.chave, degrau.pct, degrau.parcelas, degrau.valorDeclarado],
    );
  }

  return tabelaId;
}

export function registraRotasTabelasPreco(app: FastifyInstance, pool: Pool): void {
  app.get("/v1/tabelas-preco", { preHandler: [app.authenticate, app.requerPapel(...PAPEIS_LEEM)] }, async (request) => {
    return withLeitura(pool, request.usuario.escolaId, async (client) => {
      const { rows } = await client.query(
        `SELECT tp.id, tp.ano_letivo, tp.status, tp.vigencia_inicio, u.nome AS aprovada_por_nome, tp.aprovada_em, tp.criado_em
         FROM tabela_preco tp LEFT JOIN usuario u ON u.id = tp.aprovada_por_usuario_id
         ORDER BY tp.ano_letivo DESC, tp.criado_em DESC`,
      );
      return { tabelas: rows };
    });
  });

  app.post("/v1/tabelas-preco", { preHandler: [app.authenticate, app.requerPapel("DIRECAO")] }, async (request, reply) => {
    const corpo = CriaTabelaPrecoRequest.parse(request.body);
    const tabelaId = await withTransacao(pool, request.usuario.escolaId, (client) =>
      insereTabelaPreco(client, request.usuario.escolaId, request.usuario.sub, corpo),
    );
    reply.status(201);
    return { tabelaPrecoId: tabelaId, status: "RASCUNHO" };
  });

  app.post(
    "/v1/tabelas-preco/:id/aprovacao",
    { preHandler: [app.authenticate, app.requerPapel("DIRECAO")] },
    async (request) => {
      const { id } = request.params as { id: string };

      return withTransacao(pool, request.usuario.escolaId, async (client) => {
        const { rows: tabelaRows } = await client.query<{ ano_letivo: number; status: string }>(
          "SELECT ano_letivo, status FROM tabela_preco WHERE id = $1",
          [id],
        );
        const tabela = tabelaRows[0];
        if (!tabela) throw new ValidacaoErro("Tabela de preços não encontrada.");

        const { rows: conflito } = await client.query(
          "SELECT id FROM tabela_preco WHERE ano_letivo = $1 AND status = 'APROVADA' AND id <> $2",
          [tabela.ano_letivo, id],
        );
        if (conflito.length > 0) {
          throw new ValidacaoErro(`Já existe uma tabela aprovada para o ano letivo ${tabela.ano_letivo}.`);
        }

        await client.query(
          "UPDATE tabela_preco SET status = 'APROVADA', aprovada_por_usuario_id = $1, aprovada_em = now() WHERE id = $2",
          [request.usuario.sub, id],
        );

        await registraNaTransacao(client, request.usuario.escolaId, {
          tipo: "TABELA_APROVADA",
          ator: request.usuario.nome,
          matriculaId: null,
          payload: { tabelaPrecoId: id, anoLetivo: tabela.ano_letivo },
        });

        return { tabelaPrecoId: id, status: "APROVADA" };
      });
    },
  );
}
