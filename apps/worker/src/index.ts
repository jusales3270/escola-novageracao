// PRD §13 — "Filas e carga". Assinaturas tipadas, sem conexão Redis real
// ainda (M6). Nenhuma fila é de fato iniciada por este stub.

/** Fila `documentos` — render Playwright de requerimento + contrato. Concorrência 4, retry 3×, backoff exponencial 2s. */
export async function processarDocumento(_matriculaId: string, _vereditoHash: string): Promise<void> {
  throw new Error("Não implementado — M4/M6");
}

/** Fila `assinatura` — cria e envia envelope DocuSign. Concorrência 2, retry 5×, backoff 5s. */
export async function processarAssinatura(_matriculaId: string, _vereditoHash: string): Promise<void> {
  throw new Error("Não implementado — M5/M6");
}

/** Fila `webhook` — processa callback DocuSign, arquiva documento assinado. Concorrência 4, retry 5×. */
export async function processarWebhook(_payload: unknown): Promise<void> {
  throw new Error("Não implementado — M5/M6");
}

/** Fila `verificacao` — cadeia de evidência diária (cron), concorrência 1, retry 1×. */
export async function processarVerificacaoDiaria(_escolaId: string): Promise<void> {
  throw new Error("Não implementado — M2/M6");
}
