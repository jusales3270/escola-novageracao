import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { registraNaTransacao } from "@somaverso/ledger";
import { withTransacao } from "../plugins/db.js";
import { RevogacaoConsentimentoRequest } from "../schemas/matricula.js";
import { buscaMatricula, acrescentaConsentimentos } from "../servicos/matriculas.js";
import type { ConsentimentoEvento } from "../servicos/consentimentos.js";

/**
 * PRD §15 nomeia a rota como se `:id` fosse o id de um consentimento
 * isolado — decisão de M3: não criamos essa entidade (ver §3 do plano de
 * implementação), então `:id` aqui é `matriculaId`. Desvio deliberado do
 * texto literal, documentado.
 */
export function registraRotasConsentimentos(app: FastifyInstance, pool: Pool): void {
  app.post(
    "/v1/consentimentos/:id/revogacao",
    { preHandler: [app.authenticate, app.requerPapel("SECRETARIA", "COORDENACAO", "DIRECAO")] },
    async (request) => {
      const { id: matriculaId } = request.params as { id: string };
      const corpo = RevogacaoConsentimentoRequest.parse(request.body);

      return withTransacao(pool, request.usuario.escolaId, async (client) => {
        await buscaMatricula(client, matriculaId); // 404 se não existir/não for da escola do token

        const agora = new Date().toISOString();
        const entrada: ConsentimentoEvento = {
          canal: corpo.canal,
          concedido: false,
          vigenciaInicio: agora,
          vigenciaFim: null,
          eventoId: randomUUID(),
          registradoEm: agora,
        };
        await acrescentaConsentimentos(client, matriculaId, [entrada]);

        await registraNaTransacao(client, request.usuario.escolaId, {
          tipo: "CONSENTIMENTO_REVOGADO",
          ator: request.usuario.nome,
          matriculaId,
          payload: { canal: corpo.canal },
        });

        return { matriculaId, canal: corpo.canal, revogadoEm: agora };
      });
    },
  );
}
