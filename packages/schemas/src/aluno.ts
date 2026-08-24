import { z } from "zod";
import { Pessoa } from "./pessoa.js";
import { FichaSaude } from "./ficha-saude.js";

/** PRD §8.1 — `aluno`: nome, nascimento, endereço, bairro, cidade, CEP, irmãos, restrição judicial. */
export const Aluno = z
  .object({
    nome: z.string().min(3),
    nascimento: z.string().date(),
    endereco: z.string().min(3),
    bairro: z.string().min(1),
    cidade: z.string().min(1),
    cep: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos"),
    irmaosNaEscola: z.array(z.string()),
    restricaoJudicial: z.boolean(),
    /** Documento comprobatório exigido por R-10 quando `restricaoJudicial === true`. */
    restricaoJudicialAnexoId: z.string().uuid().nullable(),
    ficha: FichaSaude,
    /** R-10 — autorizados à retirada registrados. */
    autorizadosRetirada: z.array(Pessoa),
  })
  .strict();
export type Aluno = z.infer<typeof Aluno>;
