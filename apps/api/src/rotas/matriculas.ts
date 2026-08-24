import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { listaEventosDaMatricula, registraNaTransacao } from "@somaverso/ledger";
import type { Canal } from "@somaverso/schemas";
import type { Config } from "../config.js";
import { withLeitura, withTransacao } from "../plugins/db.js";
import { CriaMatriculaRequest, PatchMatriculaRequest, AcaoComPapelAtuanteRequest } from "../schemas/matricula.js";
import { buscaMatricula, atualizaPedidoSnapshot, atualizaTestemunhas, acrescentaConsentimentos } from "../servicos/matriculas.js";
import { materializaConsentimentos, type ConsentimentoEvento } from "../servicos/consentimentos.js";
import { avaliaMatricula } from "../servicos/avaliacao.js";
import { persisteVeredito } from "../servicos/veredito.js";
import { NaoEncontradoErro, SemPermissaoErro, ValidacaoErro } from "../erros/problema.js";

const PAPEIS_EDITAM = ["SECRETARIA", "COORDENACAO", "DIRECAO"] as const;
const PAPEIS_EMITEM = ["SECRETARIA", "COORDENACAO"] as const;
const PAPEIS_LEEM = ["SECRETARIA", "COORDENACAO", "DIRECAO", "AUDITOR"] as const;

export function registraRotasMatriculas(app: FastifyInstance, pool: Pool, config: Config): void {
  app.post(
    "/v1/matriculas",
    { preHandler: [app.authenticate, app.requerPapel("SECRETARIA", "COORDENACAO")] },
    async (request, reply) => {
      const corpo = CriaMatriculaRequest.parse(request.body);

      const matriculaId = await withTransacao(pool, request.usuario.escolaId, async (client) => {
        const { rows } = await client.query<{ id: string }>(
          `INSERT INTO matricula (escola_id, ano_letivo, tipo, pedido_snapshot, criado_por)
           VALUES ($1,$2,$3,$4::jsonb,$5) RETURNING id`,
          [
            request.usuario.escolaId,
            corpo.anoLetivo,
            corpo.tipo,
            JSON.stringify({ anoLetivo: corpo.anoLetivo, tipo: corpo.tipo }),
            request.usuario.sub,
          ],
        );
        const id = rows[0]?.id;
        if (!id) throw new Error("falha ao criar matrícula");

        await registraNaTransacao(client, request.usuario.escolaId, {
          tipo: "PEDIDO_RECEBIDO",
          ator: request.usuario.nome,
          matriculaId: id,
          payload: { anoLetivo: corpo.anoLetivo, tipo: corpo.tipo },
        });

        return id;
      });

      reply.status(201);
      return { matriculaId, status: "RASCUNHO" };
    },
  );

  app.patch(
    "/v1/matriculas/:id",
    { preHandler: [app.authenticate, app.requerPapel(...PAPEIS_EDITAM)] },
    async (request) => {
      const { id } = request.params as { id: string };
      const corpo = PatchMatriculaRequest.parse(request.body);
      // papelAtuante não se aplica a PATCH (não avalia nada aqui) —
      // excluído explicitamente para não vazar para pedidoParcial/snapshot.
      const { contexto, papelAtuante: _papelAtuante, ...pedidoParcial } = corpo;

      return withTransacao(pool, request.usuario.escolaId, async (client) => {
        const matricula = await buscaMatricula(client, id);

        if (Object.keys(pedidoParcial).length > 0) {
          const novoSnapshot = { ...matricula.pedido_snapshot, ...pedidoParcial };
          await atualizaPedidoSnapshot(client, id, novoSnapshot);

          if (pedidoParcial.consentimentos) {
            const jaMaterializado = materializaConsentimentos(matricula.consentimentos_historico);
            const agora = new Date().toISOString();
            const novasEntradas: ConsentimentoEvento[] = [];
            for (const [canal, concedido] of Object.entries(pedidoParcial.consentimentos)) {
              if (jaMaterializado[canal as Canal] !== concedido) {
                novasEntradas.push({
                  canal: canal as Canal,
                  concedido,
                  vigenciaInicio: agora,
                  vigenciaFim: null,
                  eventoId: randomUUID(),
                  registradoEm: agora,
                });
              }
            }
            if (novasEntradas.length > 0) {
              await acrescentaConsentimentos(client, id, novasEntradas);
              await registraNaTransacao(client, request.usuario.escolaId, {
                tipo: "CONSENTIMENTO_REGISTRADO",
                ator: request.usuario.nome,
                matriculaId: id,
                payload: { canais: novasEntradas.map((e) => e.canal) },
              });
            }
          }
        }

        if (contexto?.testemunhas) {
          // PRD §5 — "DIRECAO [...] definir testemunhas." I-6: estado do
          // servidor, só este papel pode escrever. Checagem direta de
          // posse do papel (não "papelAtuante resolvido") — um usuário
          // com múltiplos papéis (usuario_papel permite isso) não deveria
          // ser bloqueado só porque a ordem de retorno da query colocou
          // outro papel primeiro; o que importa é ele TER DIRECAO.
          if (!request.usuario.papeis.includes("DIRECAO")) {
            throw new SemPermissaoErro("Só o papel DIRECAO pode definir testemunhas.");
          }
          await atualizaTestemunhas(client, id, contexto.testemunhas);
        }

        return { matriculaId: id, atualizado: true };
      });
    },
  );

  app.post(
    "/v1/matriculas/:id/simulacao",
    { preHandler: [app.authenticate, app.requerPapel(...PAPEIS_EDITAM)] },
    async (request) => {
      const { id } = request.params as { id: string };
      const corpo = AcaoComPapelAtuanteRequest.parse(request.body ?? {});

      return withLeitura(pool, request.usuario.escolaId, async (client) => {
        const matricula = await buscaMatricula(client, id);
        const avaliacao = await avaliaMatricula(
          client,
          matricula,
          request.usuario,
          [...PAPEIS_EDITAM],
          config.ambiente,
          corpo.papelAtuante,
        );
        return avaliacao.estado;
      });
    },
  );

  app.post(
    "/v1/matriculas/:id/emissao",
    { preHandler: [app.authenticate, app.requerPapel(...PAPEIS_EMITEM)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const idemKeyHeader = request.headers["idempotency-key"];
      const idemKey = Array.isArray(idemKeyHeader) ? idemKeyHeader[0] : idemKeyHeader;
      if (!idemKey) throw new ValidacaoErro("Header Idempotency-Key é obrigatório.");
      const corpo = AcaoComPapelAtuanteRequest.parse(request.body ?? {});

      const resposta = await withTransacao(pool, request.usuario.escolaId, async (client) => {
        const existente = await client.query<{ status_code: number; resposta: unknown }>(
          "SELECT status_code, resposta FROM idempotencia WHERE escola_id = $1 AND rota = $2 AND chave = $3 FOR UPDATE",
          [request.usuario.escolaId, "emissao", idemKey],
        );
        const linhaExistente = existente.rows[0];
        if (linhaExistente) {
          return { statusCode: linhaExistente.status_code, corpo: linhaExistente.resposta };
        }

        const matricula = await buscaMatricula(client, id);
        const avaliacao = await avaliaMatricula(
          client,
          matricula,
          request.usuario,
          [...PAPEIS_EMITEM],
          config.ambiente,
          corpo.papelAtuante,
        );

        let statusCode: number;
        let corpoResposta: unknown;

        if (avaliacao.estado.status === "INCOMPLETO") {
          statusCode = 422;
          corpoResposta = {
            type: "https://somaescola.dev/erros/matricula-incompleta",
            title: "Matrícula incompleta",
            status: 422,
            detail: `${avaliacao.estado.pendencias.length} campo(s) pendente(s).`,
            instance: `/v1/matriculas/${id}/emissao`,
            pendencias: avaliacao.estado.pendencias,
          };
        } else {
          const resultado = avaliacao.estado.resultado;
          const hash = await persisteVeredito(client, id, avaliacao.tabelaPrecoId!, resultado, request.usuario);

          if (resultado.decisao === "BLOQUEADO") {
            statusCode = 409;
            corpoResposta = {
              type: "https://somaescola.dev/erros/veredito-bloqueado",
              title: "Matrícula bloqueada",
              status: 409,
              detail: `${resultado.bloqueios.length} regra(s) bloqueante(s) não conforme(s).`,
              instance: `/v1/matriculas/${id}/emissao`,
              vereditos: resultado.bloqueios,
            };
          } else {
            statusCode = 200;
            // PRD §13 — "a interface deve dizer isso, não fingir
            // capacidade": geração de documento/envelope é M4/M5. A
            // emissão real (gate + trilha) já é ponta a ponta; o PDF não.
            corpoResposta = {
              matriculaId: id,
              decisao: "LIBERADO",
              vereditoHash: hash,
              proximaEtapa: "geracao_documento (M4)",
              mensagem:
                "Motor liberou a emissão. Renderização de documento e envelope de assinatura ainda não implementados (M4/M5) — nenhum documento foi gerado.",
            };
          }
        }

        await client.query(
          `INSERT INTO idempotencia (escola_id, rota, chave, matricula_id, status_code, resposta)
           VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
          [request.usuario.escolaId, "emissao", idemKey, id, statusCode, JSON.stringify(corpoResposta)],
        );

        return { statusCode, corpo: corpoResposta };
      });

      reply.status(resposta.statusCode);
      return resposta.corpo;
    },
  );

  app.get(
    "/v1/matriculas/:id",
    { preHandler: [app.authenticate, app.requerPapel(...PAPEIS_LEEM)] },
    async (request) => {
      const { id } = request.params as { id: string };
      return withLeitura(pool, request.usuario.escolaId, async (client) => {
        const matricula = await buscaMatricula(client, id);
        const { rows } = await client.query(
          "SELECT decisao, hash, motor_versao, criado_em FROM veredito WHERE matricula_id = $1 ORDER BY criado_em DESC LIMIT 1",
          [id],
        );
        return {
          matriculaId: matricula.id,
          anoLetivo: matricula.ano_letivo,
          tipo: matricula.tipo,
          status: matricula.status,
          pedido: matricula.pedido_snapshot,
          ultimoVeredito: rows[0] ?? null,
        };
      });
    },
  );

  app.get(
    "/v1/matriculas/:id/trilha",
    { preHandler: [app.authenticate, app.requerPapel(...PAPEIS_LEEM)] },
    async (request) => {
      const { id } = request.params as { id: string };
      const eventos = await listaEventosDaMatricula(pool, request.usuario.escolaId, id);
      return { matriculaId: id, eventos };
    },
  );

  app.post(
    "/v1/matriculas/:id/alteracao-contratual",
    { preHandler: [app.authenticate, app.requerPapel(...PAPEIS_EDITAM)] },
    async (request) => {
      const { id } = request.params as { id: string };
      const corpo = PatchMatriculaRequest.parse(request.body);
      const { contexto: _contexto, papelAtuante, ...pedidoParcial } = corpo;

      return withTransacao(pool, request.usuario.escolaId, async (client) => {
        const matriculaAntes = await buscaMatricula(client, id);
        const novoSnapshot = { ...matriculaAntes.pedido_snapshot, ...pedidoParcial };
        await atualizaPedidoSnapshot(client, id, novoSnapshot);

        await registraNaTransacao(client, request.usuario.escolaId, {
          tipo: "ALTERACAO_CONTRATUAL",
          ator: request.usuario.nome,
          matriculaId: id,
          payload: { camposAlterados: Object.keys(pedidoParcial) },
        });

        const matriculaDepois = { ...matriculaAntes, pedido_snapshot: novoSnapshot };
        const avaliacao = await avaliaMatricula(
          client,
          matriculaDepois,
          request.usuario,
          [...PAPEIS_EDITAM],
          config.ambiente,
          papelAtuante,
        );

        if (avaliacao.estado.status !== "INCOMPLETO") {
          await persisteVeredito(client, id, avaliacao.tabelaPrecoId!, avaliacao.estado.resultado, request.usuario);
        }

        return avaliacao.estado;
      });
    },
  );

  // PRD §15 — fora de escopo do M3: depende de M4 (geração de documento).
  app.get("/v1/matriculas/:id/documentos/:tipo", { preHandler: [app.authenticate] }, async () => {
    throw new NaoEncontradoErro("Documento (geração de documento é M4 — ainda não implementada)");
  });
}
