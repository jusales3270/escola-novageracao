import type { Canal } from "@somaverso/schemas";

/**
 * PRD §14 — "decisão por canal com vigencia_inicio/vigencia_fim. Revogação
 * é evento novo, nunca edição do anterior." `matricula.consentimentos_historico`
 * é um array append-only dessas entradas; nunca mutamos um item existente.
 */
export interface ConsentimentoEvento {
  canal: Canal;
  concedido: boolean;
  vigenciaInicio: string;
  vigenciaFim: string | null;
  eventoId: string;
  registradoEm: string;
}

/**
 * R-04 (`@somaverso/motor`) espera `Pedido.consentimentos:
 * Partial<Record<Canal, boolean>>` — "decidido" é a chave existir,
 * concedida ou não. Como o histórico é append-only, a decisão vigente por
 * canal é a entrada mais recente (o array já está em ordem de inserção;
 * a última ocorrência de cada canal vence).
 */
export function materializaConsentimentos(historico: ConsentimentoEvento[]): Partial<Record<Canal, boolean>> {
  const resultado: Partial<Record<Canal, boolean>> = {};
  for (const evento of historico) {
    resultado[evento.canal] = evento.concedido;
  }
  return resultado;
}
