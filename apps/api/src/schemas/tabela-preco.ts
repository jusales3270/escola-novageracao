import { z } from "zod";
import { TabelaPrecoAdicionais, TabelaPrecoLinha, TabelaPrecoDegrau } from "@somaverso/schemas";

/**
 * Mesmos schemas de valor de `@somaverso/schemas` (linha/adicionais/degrau
 * não têm `id` — combinam bem tanto para request quanto para o cálculo do
 * motor). Só `anoLetivo`/`vigenciaInicio`/`parcelas`/etc. de topo mais os
 * arrays; `aprovadaPor`/`aprovadaEm` nunca vêm do cliente (nascem null).
 */
export const CriaTabelaPrecoRequest = z
  .object({
    anoLetivo: z.number().int(),
    vigenciaInicio: z.string().date(),
    parcelas: z.number().int().positive(),
    descontoPontualidadePct: z.number().min(0).max(100),
    matriculaCheia: z.number().positive(),
    adicionais: TabelaPrecoAdicionais,
    linhas: z.array(TabelaPrecoLinha),
    degraus: z.array(TabelaPrecoDegrau),
  })
  .strict();
export type CriaTabelaPrecoRequest = z.infer<typeof CriaTabelaPrecoRequest>;
