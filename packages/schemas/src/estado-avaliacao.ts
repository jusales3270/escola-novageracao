import { z } from "zod";
import { Pendencia, Resultado } from "./resultado.js";

/**
 * `Resultado.decisao` só tem `LIBERADO|BLOQUEADO` — o motor (§9) é claro
 * que INCOMPLETO é "estado de interface, não veredito": acontece ANTES de
 * `avalia()` rodar, quando `pendencias()` encontra campos obrigatórios
 * ausentes. `EstadoAvaliacao` é o tipo que une os dois — usado por
 * `POST /matriculas/:id/simulacao`, `GET /matriculas/:id` e pelo painel de
 * veredito de `apps/web`, para não obrigar cada consumidor a reimplementar
 * essa combinação.
 */
export const EstadoAvaliacao = z.discriminatedUnion("status", [
  z.object({ status: z.literal("INCOMPLETO"), pendencias: z.array(Pendencia) }).strict(),
  z.object({ status: z.literal("LIBERADO"), resultado: Resultado }).strict(),
  z.object({ status: z.literal("BLOQUEADO"), resultado: Resultado }).strict(),
]);
export type EstadoAvaliacao = z.infer<typeof EstadoAvaliacao>;
