import { z } from "zod";
import { Turma, Periodo, Alim, Fraldario, Canal, Papel, DegrauChave } from "./enums.js";
import { Pessoa, ResponsavelFinanceiro } from "./pessoa.js";
import { Aluno } from "./aluno.js";

/**
 * PRD §8.2 — fonte única de contrato entre API, worker, motor e interface.
 * `.strict()` em todos os objetos: campo desconhecido é erro, não é ignorado.
 */
export const Pedido = z
  .object({
    anoLetivo: z.number().int(),
    tipo: z.enum(["MATRICULA", "REMATRICULA"]),
    aluno: Aluno,
    contratante: Pessoa,
    responsavelFinanceiro: ResponsavelFinanceiro,
    servicos: z
      .object({
        turma: Turma,
        periodo: Periodo,
        alimentacao: Alim,
        fraldario: Fraldario,
        horaAdicionalDiasMes: z.number().int().min(0).max(22),
      })
      .strict(),
    formaPagamentoMatricula: DegrauChave,
    descontoExcepcionalPct: z.number().min(0).max(100),
    justificativaDesconto: z.string().optional(),
    consentimentos: z.record(Canal, z.boolean()),
    /**
     * D-13 — nome e papel do operador entram na validação obrigatória do
     * pedido, não apenas em uma checagem separada de `pendencias()`.
     */
    operador: z
      .object({
        id: z.string().uuid(),
        nome: z.string().min(3),
        papel: Papel,
      })
      .strict(),
  })
  .strict();
export type Pedido = z.infer<typeof Pedido>;
