import { Canal, type Veredito } from "@somaverso/schemas";

/**
 * PRD §9 — R-04: os 5 canais com decisão vigente registrada (achado A-04).
 * "Decidido" é a chave existir em `pedido.consentimentos`, concedida ou
 * não — o que falta aqui não é consentimento negativo, é ausência de
 * decisão. `z.record(Canal, z.boolean())` não exige as 5 chaves no schema
 * de propósito (I-3: ambiguidade não resolvida vira bloqueio de regra
 * explícito, com o canal nomeado, não um erro genérico de validação).
 */
export function r04_consentimentoGranular(consentimentos: Partial<Record<Canal, boolean>>): Veredito {
  const canaisDecididos = Object.keys(consentimentos);
  const faltando = Canal.options.filter((c) => !canaisDecididos.includes(c));
  return {
    regra: "R-04",
    titulo: "Consentimento decidido canal a canal",
    severidade: "BLOQUEIA",
    conforme: faltando.length === 0,
    achado: "A-04",
    dono: "JURIDICO",
    detalhe:
      faltando.length === 0
        ? `Todos os ${Canal.options.length} canais têm decisão registrada.`
        : `Sem decisão para: ${faltando.join(", ")}. A Cl. 16ª exige autorização específica e destacada por finalidade.`,
  };
}
