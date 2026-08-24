import { z } from "zod";
import { CPF } from "./cpf.js";
import { ContatoEmergencia } from "./contato-emergencia.js";

/** PRD §8.1 — `pessoa`: responsáveis, autorizados, testemunhas. */
export const Pessoa = z
  .object({
    nome: z.string().min(3),
    cpf: CPF,
    rg: z.string().optional(),
    email: z.string().email(),
    telefone: z.string().min(10),
  })
  .strict();
export type Pessoa = z.infer<typeof Pessoa>;

export const Testemunha = z
  .object({
    nome: z.string().min(3),
    cpf: CPF,
    email: z.string().email(),
  })
  .strict();
export type Testemunha = z.infer<typeof Testemunha>;

/**
 * D-13 — `pendencias()` do protótipo não exigia contato de emergência do
 * responsável financeiro. Aqui o campo é obrigatório no próprio schema, não
 * apenas checado depois: `responsavelFinanceiro` é sempre este tipo, nunca
 * `Pessoa` genérica (contratante, testemunhas e autorizados continuam
 * usando `Pessoa` — o contato de emergência não faz sentido para eles).
 */
export const ResponsavelFinanceiro = Pessoa.extend({
  contatoEmergencia: ContatoEmergencia,
}).strict();
export type ResponsavelFinanceiro = z.infer<typeof ResponsavelFinanceiro>;
