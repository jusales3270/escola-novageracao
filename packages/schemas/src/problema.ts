import { z } from "zod";
import { Veredito } from "./resultado.js";

/**
 * RFC 7807 (Problem Details for HTTP APIs), com a extensão que o PRD §15
 * exige para bloqueio: "409 com a lista completa de vereditos não
 * conformes — regra, título, detalhe, achado, dono." `vereditos` só
 * aparece quando o problema é um bloqueio do motor; erros de validação,
 * RBAC etc. não o incluem.
 */
export const Problema7807 = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string(),
    instance: z.string(),
    vereditos: z.array(Veredito).optional(),
  })
  .strict();
export type Problema7807 = z.infer<typeof Problema7807>;
