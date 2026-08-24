import { z } from "zod";

export const ContatoEmergencia = z
  .object({
    nome: z.string().min(3),
    telefone: z.string().min(10),
  })
  .strict();
export type ContatoEmergencia = z.infer<typeof ContatoEmergencia>;
