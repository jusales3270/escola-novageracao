/**
 * PRD §10 — Cadeia de evidência. Shape do evento canônico, declarado aqui
 * para que `apps/api` já possa tipar contra ele antes da implementação
 * real (M2: Postgres append-only + trigger + verificação).
 *
 * D-09 — no protótipo o ledger era uma classe em memória, perdida a cada
 * reinício. A implementação real (M2) é Postgres, `seq` atribuído sob
 * `SELECT ... FOR UPDATE`, trigger `BEFORE UPDATE OR DELETE` levantando
 * exceção, e `REVOKE UPDATE, DELETE` do papel da aplicação — não uma
 * estrutura de dados na aplicação.
 */
export type TipoEvento =
  | "PEDIDO_RECEBIDO"
  | "VEREDITO_MOTOR"
  | "CONSENTIMENTO_REGISTRADO"
  | "CONSENTIMENTO_REVOGADO"
  | "DOCUMENTO_GERADO"
  | "ENVELOPE_ENVIADO"
  | "ENVELOPE_ENTREGUE"
  | "ASSINATURA_CONCLUIDA"
  | "ENVELOPE_RECUSADO"
  | "ENVELOPE_ANULADO"
  | "DOCUMENTO_ARQUIVADO"
  | "TABELA_APROVADA"
  | "ALTERACAO_CONTRATUAL";

export interface Evento {
  seq: number;
  em: string;
  tipo: TipoEvento;
  ator: string;
  matriculaId: string;
  payload: Record<string, unknown>;
  hashAnterior: string;
  hash: string;
}

/** `hashAnterior` do primeiro evento de cada escola (PRD §10). */
export const GENESE = "0".repeat(64);

export interface ResultadoVerificacao {
  integra: boolean;
  rompeuEm?: number;
}

export function registra(): never {
  throw new Error("Não implementado — M2 (Postgres append-only)");
}

export function verifica(): never {
  throw new Error("Não implementado — M2 (Postgres append-only)");
}
