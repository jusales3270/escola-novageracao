import { z } from "zod";

/** PRD §9 — severidade de um veredito de regra. Só `BLOQUEIA` afeta `decisao`. */
export const Severidade = z.enum(["BLOQUEIA", "ALERTA"]);
export type Severidade = z.infer<typeof Severidade>;

/** PRD §9 — veredito de uma única regra (R-01..R-12). */
export const Veredito = z
  .object({
    regra: z.string(),
    titulo: z.string(),
    severidade: Severidade,
    conforme: z.boolean(),
    detalhe: z.string(),
    achado: z.string().nullable(),
    dono: z.string(),
  })
  .strict();
export type Veredito = z.infer<typeof Veredito>;

/** PRD §7 — composição da mensalidade, cada etapa arredondada a centavo. */
export const ComposicaoMensal = z
  .object({
    servicoEducacional: z.number(),
    alimentacao: z.number(),
    fraldario: z.number(),
    horaAdicional: z.number(),
    descontoExcepcional: z.number(),
    totalCheio: z.number(),
    baseP: z.number(),
    descontoPontualidade: z.number(),
    totalComPontualidade: z.number(),
  })
  .strict();
export type ComposicaoMensal = z.infer<typeof ComposicaoMensal>;

/** Composição da matrícula (degrau escolhido) — parcelas e valor por parcela. */
export const ComposicaoMatricula = z
  .object({
    chave: z.string(),
    parcelas: z.number().int().positive(),
    valorParcela: z.number(),
  })
  .strict();
export type ComposicaoMatricula = z.infer<typeof ComposicaoMatricula>;

export const Calculo = z
  .object({
    mensal: ComposicaoMensal,
    matricula: ComposicaoMatricula,
  })
  .strict();
export type Calculo = z.infer<typeof Calculo>;

/** PRD §9 — resultado da avaliação do motor. `decisao = BLOQUEADO` se houver ao menos um bloqueio não conforme. */
export const Resultado = z
  .object({
    decisao: z.enum(["LIBERADO", "BLOQUEADO"]),
    vereditos: z.array(Veredito),
    bloqueios: z.array(Veredito),
    calculo: Calculo.nullable(),
    motorVersao: z.string(),
  })
  .strict();
export type Resultado = z.infer<typeof Resultado>;

/** Estado INCOMPLETO (§9) — pendências que suspendem o motor antes de qualquer veredito. */
export const Pendencia = z
  .object({
    campo: z.string(),
    rotulo: z.string(),
    motivo: z.string(),
  })
  .strict();
export type Pendencia = z.infer<typeof Pendencia>;
