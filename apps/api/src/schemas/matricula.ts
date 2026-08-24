import { z } from "zod";
import { Pedido, Papel, Testemunha, Canal } from "@somaverso/schemas";

export const CriaMatriculaRequest = z
  .object({
    anoLetivo: z.number().int(),
    tipo: z.enum(["MATRICULA", "REMATRICULA"]),
  })
  .strict();
export type CriaMatriculaRequest = z.infer<typeof CriaMatriculaRequest>;

/**
 * PATCH substitui, por chave de topo enviada, o valor correspondente no
 * `pedido_snapshot` — não faz merge profundo dentro de objetos aninhados
 * (`aluno`, `servicos`, etc.): quem edita uma seção manda o objeto
 * completo daquela seção. `contexto.testemunhas` é aceito aqui mas só tem
 * efeito quando `papelAtuante === 'DIRECAO'` (I-6/§5) — a rota valida isso,
 * não o schema.
 */
export const PatchMatriculaRequest = Pedido.partial()
  .extend({
    contexto: z.object({ testemunhas: z.array(Testemunha) }).strict().partial().optional(),
    papelAtuante: Papel.optional(),
  })
  .strict();
export type PatchMatriculaRequest = z.infer<typeof PatchMatriculaRequest>;

export const AcaoComPapelAtuanteRequest = z
  .object({
    papelAtuante: Papel.optional(),
  })
  .strict();
export type AcaoComPapelAtuanteRequest = z.infer<typeof AcaoComPapelAtuanteRequest>;

export const RevogacaoConsentimentoRequest = z
  .object({
    canal: Canal,
  })
  .strict();
export type RevogacaoConsentimentoRequest = z.infer<typeof RevogacaoConsentimentoRequest>;
