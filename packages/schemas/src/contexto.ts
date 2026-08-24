import { z } from "zod";
import { Testemunha } from "./pessoa.js";
import { Ambiente } from "./enums.js";

/**
 * PRD §8.2 / §6.1 (I-6) — contexto de avaliação, exclusivamente do servidor.
 * O cliente nunca altera `tabelaAprovadaPor`, testemunhas, DPA ou ambiente —
 * são estado do servidor, o cliente só exibe (D-08).
 */
export const Contexto = z
  .object({
    tabelaAprovadaPor: z.string().nullable(),
    tabelaPrecoId: z.string().uuid(),
    testemunhas: z.array(Testemunha),
    prescricaoAnexoId: z.string().uuid().nullable(),
    dpaAssinado: z.boolean(),
    ambiente: Ambiente,
  })
  .strict();
export type Contexto = z.infer<typeof Contexto>;
