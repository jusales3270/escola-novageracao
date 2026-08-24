/**
 * PRD §10 — Cadeia de evidência. Shape do evento canônico.
 *
 * D-09 — no protótipo o ledger era uma classe em memória, perdida a cada
 * reinício. Esta implementação é Postgres append-only: `seq` atribuído
 * sob `SELECT ... FOR UPDATE` (ver registra.ts), trigger `BEFORE UPDATE
 * OR DELETE` levantando exceção (infra/db/migrations/0003_ledger_evento.sql)
 * e `REVOKE UPDATE, DELETE` do papel de aplicação
 * (infra/db/migrations/0004_papel_app_e_grants.sql).
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
  /** `null` para eventos de escola sem matrícula associada (ex.: TABELA_APROVADA). */
  matriculaId: string | null;
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
