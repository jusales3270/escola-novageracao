import type { Papel, Veredito } from "@somaverso/schemas";

/** PRD §5 — "Atores e alçadas". AUDITOR só lê/verifica (§5: "—" na coluna de teto), teto tratado como 0. */
export const TETO_ALCADA: Record<Papel, number> = {
  SECRETARIA: 10,
  COORDENACAO: 10,
  DIRECAO: 100,
  AUDITOR: 0,
};

/**
 * Total, não parcial, sobre `Papel`: um `papel` que não bate com nenhuma
 * chave conhecida devolve `null` (não `0`) — é o que distingue "operador
 * com teto zero" de "operador não identificado" (D-04). `Pedido.operador.papel`
 * já é validado pelo Zod contra o enum `Papel` antes de chegar aqui, então
 * este `null` normalmente só é alcançável se o motor for chamado fora do
 * caminho tipado (ex.: dado legado, chamada direta em teste) — mesmo assim,
 * o motor nunca assume "identificado" por padrão.
 */
export function tetoAlcada(papel: string): number | null {
  return papel in TETO_ALCADA ? TETO_ALCADA[papel as Papel] : null;
}

/**
 * PRD §9 — R-03: operador identificado **e** `pct ≤ teto(papel)` **e**
 * (`pct === 0` ou justificativa presente) (achado A-08).
 *
 * D-04 — no protótipo, `TETO_ALCADA[papel] ?? 0` fazia um operador sem
 * papel reconhecido "passar" com desconto 0%, porque `pct <= 0` e
 * `pct > 0 && !justificativa` eram ambos falsos. Aqui, papel não
 * identificado bloqueia incondicionalmente (PRD §5: "Ausência de papel
 * nunca resolve para permissivo").
 */
export function r03_alcadaDesconto(papel: string, pct: number, justificativa?: string): Veredito {
  const teto = tetoAlcada(papel);

  if (teto === null) {
    return {
      regra: "R-03",
      titulo: "Desconto dentro da alçada",
      severidade: "BLOQUEIA",
      conforme: false,
      achado: "A-08",
      dono: "DIRECAO",
      detalhe: "Operador não identificado. Nenhum desconto pode ser concedido sem papel reconhecido.",
    };
  }

  const dentro = pct <= teto;
  const precisaJustificar = pct > 0 && !justificativa;
  const conforme = dentro && !precisaJustificar;

  return {
    regra: "R-03",
    titulo: "Desconto dentro da alçada",
    severidade: "BLOQUEIA",
    conforme,
    achado: "A-08",
    dono: "DIRECAO",
    detalhe: !dentro
      ? `${papel} pode conceder até ${teto}%. Solicitado ${pct}%. Requer aprovação da direção.`
      : precisaJustificar
        ? `Desconto de ${pct}% exige justificativa registrada.`
        : `Desconto de ${pct}% dentro da alçada de ${papel} (teto ${teto}%).`,
  };
}
