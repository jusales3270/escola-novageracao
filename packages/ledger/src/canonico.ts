/**
 * PRD §10 — serialização canônica do evento para hash:
 * `SHA-256(JSON.stringify({seq, em, tipo, ator, matriculaId, payload, hashAnterior}))`.
 * "Chaves na ordem declarada acima, sem espaços [...] Qualquer variação
 * quebra a verificação — é ponto de teste, não detalhe."
 *
 * Este é o único lugar do pacote que monta essa string. `registra.ts`
 * (escrita) e `verifica.ts` (leitura) chamam a mesma função — não existem
 * dois caminhos de serialização que possam divergir silenciosamente.
 */
export interface MaterialCanonico {
  seq: number;
  em: string;
  tipo: string;
  ator: string;
  matriculaId: string | null;
  /** JSON já serializado (chaves ordenadas) — não um objeto a reserializar. */
  payloadJson: string;
  hashAnterior: string;
}

export function montaMaterialCanonico(m: MaterialCanonico): string {
  return (
    `{"seq":${m.seq}` +
    `,"em":${JSON.stringify(m.em)}` +
    `,"tipo":${JSON.stringify(m.tipo)}` +
    `,"ator":${JSON.stringify(m.ator)}` +
    `,"matriculaId":${JSON.stringify(m.matriculaId)}` +
    `,"payload":${m.payloadJson}` +
    `,"hashAnterior":${JSON.stringify(m.hashAnterior)}}`
  );
}

/**
 * Ordena chaves recursivamente (só objetos — arrays preservam ordem, que
 * é semântica). Aplicado ao payload antes de gravar, para que o material
 * hasheado não dependa da ordem em que o chamador construiu o objeto.
 */
export function ordenaChavesRecursivo(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenaChavesRecursivo);
  if (valor !== null && typeof valor === "object") {
    const entradas = Object.entries(valor as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return Object.fromEntries(entradas.map(([k, v]) => [k, ordenaChavesRecursivo(v)]));
  }
  return valor;
}

/** Conveniência para quem tem o payload como objeto (uso em testes unitários). */
export function serializaCanonico(evento: {
  seq: number;
  em: string;
  tipo: string;
  ator: string;
  matriculaId: string | null;
  payload: Record<string, unknown>;
  hashAnterior: string;
}): string {
  const payloadOrdenado = ordenaChavesRecursivo(evento.payload);
  return montaMaterialCanonico({ ...evento, payloadJson: JSON.stringify(payloadOrdenado) });
}
