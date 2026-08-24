import type { PoolClient } from "pg";
import { avalia, pendencias } from "@somaverso/motor";
import { Pedido, type Ambiente, type EstadoAvaliacao, type Papel } from "@somaverso/schemas";
import type { ClaimsJwt } from "../plugins/auth.js";
import { comOperadorServidor, validaPapelAtuante } from "./operador.js";
import { montaContexto } from "./contexto.js";
import { materializaConsentimentos } from "./consentimentos.js";
import { buscaTabelaPrecoAtual, buscaTabelaPrecoCompleta, type MatriculaRow } from "./matriculas.js";

export interface ResultadoAvaliacaoMatricula {
  estado: EstadoAvaliacao;
  /** Presentes quando `estado.status !== 'INCOMPLETO'` — usados por quem persiste o veredito (rota de emissão). */
  tabelaPrecoId?: string;
}

/**
 * Orquestra o mesmo caminho que `POST /simulacao` e `POST /emissao`
 * seguem: materializa consentimentos a partir do histórico (§14), monta o
 * `Pedido` com `operador` resolvido pelo servidor (nunca pelo corpo —
 * `comOperadorServidor`), busca a tabela de preços vigente do ano letivo
 * e o `Contexto` 100% servidor (I-6), e chama `avalia()`. Pura leitura —
 * quem persiste é o chamador.
 */
export async function avaliaMatricula(
  client: PoolClient,
  matricula: MatriculaRow,
  usuario: ClaimsJwt,
  papeisPermitidosNaRota: Papel[],
  ambiente: Ambiente,
  papelAtuante?: Papel,
): Promise<ResultadoAvaliacaoMatricula> {
  // Checagem de autorização primeiro — independe do pedido estar completo
  // ou não (é sobre QUEM está agindo, não sobre O QUE está sendo avaliado).
  const papel = validaPapelAtuante(usuario, papeisPermitidosNaRota, papelAtuante);

  const consentimentosMaterializados = materializaConsentimentos(matricula.consentimentos_historico);
  const pedidoBruto = { ...matricula.pedido_snapshot, consentimentos: consentimentosMaterializados };

  const listaPendencias = pendencias(pedidoBruto);
  if (listaPendencias.length > 0) {
    return { estado: { status: "INCOMPLETO", pendencias: listaPendencias } };
  }

  const pedidoParseado = Pedido.parse(pedidoBruto);
  const pedidoResolvido = comOperadorServidor(pedidoParseado, usuario, papel);

  const tabelaRef = await buscaTabelaPrecoAtual(client, pedidoResolvido.anoLetivo);
  const tabela = await buscaTabelaPrecoCompleta(client, tabelaRef.id);
  const contexto = await montaContexto(client, matricula.id, tabelaRef.id, ambiente);

  const resultado = avalia(pedidoResolvido, contexto, tabela);

  return {
    estado: { status: resultado.decisao, resultado },
    tabelaPrecoId: tabelaRef.id,
  };
}
