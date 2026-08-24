import { z } from "zod";
import { Faixa, Periodo, DegrauChave } from "./enums.js";

/** PRD §7 — uma linha de preço por faixa × período. */
export const TabelaPrecoLinha = z
  .object({
    faixa: Faixa,
    periodo: Periodo,
    mensalidade: z.number().positive(),
    /** Valor de anuidade declarado na Cl. 8ª do contrato — pode divergir de `mensalidade × 12` (é o que R-01 checa). */
    anuidadeDeclaradaContrato: z.number().positive(),
    alimentacaoInclusa: z.boolean(),
    /** Texto da Cl. 3ª que descreve o serviço — usado no detalhe de R-02 quando há conflito de alimentação. */
    descricaoContrato: z.string(),
  })
  .strict();
export type TabelaPrecoLinha = z.infer<typeof TabelaPrecoLinha>;

/** PRD §7 — "Adicionais mensais". */
export const TabelaPrecoAdicionais = z
  .object({
    horaAdicional: z.number().nonnegative(),
    almoco: z.number().nonnegative(),
    almocoJantar: z.number().nonnegative(),
    almocoOuJantar: z.number().nonnegative(),
    fraldarioMeio: z.number().nonnegative(),
    fraldarioIntegral: z.number().nonnegative(),
    fraldarioAvulso: z.number().nonnegative(),
  })
  .strict();
export type TabelaPrecoAdicionais = z.infer<typeof TabelaPrecoAdicionais>;

/**
 * PRD §7 — um degrau da "escada de matrícula". `valorDeclarado` vem da
 * tabela (o que a escola de fato aprovou/cobra); R-11 reconcilia esse valor
 * contra o calculado a partir de `matriculaCheia` — D-01 no protótipo era
 * comparar essa mesma expressão calculada contra si mesma, o que passa
 * sempre. Ter `valorDeclarado` como campo próprio da tabela é o que torna a
 * reconciliação possível.
 */
export const TabelaPrecoDegrau = z
  .object({
    chave: DegrauChave,
    pct: z.number().min(0).max(100),
    parcelas: z.number().int().positive(),
    valorDeclarado: z.number().positive(),
  })
  .strict();
export type TabelaPrecoDegrau = z.infer<typeof TabelaPrecoDegrau>;

/** PRD §7/§8.1 — `tabela_preco`, entidade versionada. Sem `aprovadaPor`, o motor bloqueia em R-07. */
export const TabelaPreco = z
  .object({
    anoLetivo: z.number().int(),
    vigenciaInicio: z.string().date(),
    aprovadaPor: z.string().nullable(),
    aprovadaEm: z.string().datetime().nullable(),
    parcelas: z.number().int().positive(),
    descontoPontualidadePct: z.number().min(0).max(100),
    matriculaCheia: z.number().positive(),
    adicionais: TabelaPrecoAdicionais,
    linhas: z.array(TabelaPrecoLinha),
    degraus: z.array(TabelaPrecoDegrau),
  })
  .strict();
export type TabelaPreco = z.infer<typeof TabelaPreco>;
