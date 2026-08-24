import { z } from "zod";
import { Antitermico } from "./enums.js";
import { ContatoEmergencia } from "./contato-emergencia.js";

/**
 * PRD §8.1 — `ficha_saude`: uso contínuo, medicamento, alergia,
 * intolerância, convênio, antitérmico, contato de emergência.
 *
 * D-06 — o protótipo tinha `antitermicoAutorizado` como texto livre avaliado
 * por truthiness (qualquer string não vazia "autorizava"). Aqui é um enum
 * fechado (`Antitermico`) mais um campo de texto separado só para o nome do
 * medicamento — a autorização nunca mais é inferida de uma string arbitrária.
 */
export const FichaSaude = z
  .object({
    usoContinuoMedicamento: z.boolean(),
    qualMedicamento: z.string().optional(),
    alergico: z.boolean(),
    qualAlergia: z.string().optional(),
    intoleranciaAlimentar: z.string().optional(),
    convenio: z.string().optional(),
    antitermico: Antitermico,
    antitermicoMedicamento: z.string().optional(),
    contatoEmergencia: ContatoEmergencia,
  })
  .strict();
export type FichaSaude = z.infer<typeof FichaSaude>;
