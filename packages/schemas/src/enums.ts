import { z } from "zod";

/** PRD §8.2 — turma matriculada. */
export const Turma = z.enum([
  "BERCARIO",
  "MINI_MATERNAL",
  "MATERNAL",
  "JARDIM",
  "ALFA_I",
  "ALFA_II",
]);
export type Turma = z.infer<typeof Turma>;

/** PRD §7 — faixa de preço. Várias turmas mapeiam para a mesma faixa. */
export const Faixa = z.enum(["BERCARIO", "MINI_MATERNAL", "MATERNAL_JARDIM_ALFA"]);
export type Faixa = z.infer<typeof Faixa>;

/** PRD §7 — "Mapa turma → faixa". */
export const FAIXA_PRECO: Record<Turma, Faixa> = {
  BERCARIO: "BERCARIO",
  MINI_MATERNAL: "MINI_MATERNAL",
  MATERNAL: "MATERNAL_JARDIM_ALFA",
  JARDIM: "MATERNAL_JARDIM_ALFA",
  ALFA_I: "MATERNAL_JARDIM_ALFA",
  ALFA_II: "MATERNAL_JARDIM_ALFA",
};

export const Periodo = z.enum(["MEIO", "INTEGRAL"]);
export type Periodo = z.infer<typeof Periodo>;

export const Alim = z.enum(["NENHUMA", "ALMOCO", "ALMOCO_JANTAR", "ALMOCO_OU_JANTAR"]);
export type Alim = z.infer<typeof Alim>;

export const Fraldario = z.enum(["NENHUM", "MEIO", "INTEGRAL", "AVULSO"]);
export type Fraldario = z.infer<typeof Fraldario>;

export const Canal = z.enum([
  "SITE",
  "REDES_SOCIAIS",
  "ALBUM_TURMA",
  "USO_PEDAGOGICO_INTERNO",
  "MATERIAL_IMPRESSO",
]);
export type Canal = z.infer<typeof Canal>;

export const Papel = z.enum(["SECRETARIA", "COORDENACAO", "DIRECAO", "AUDITOR"]);
export type Papel = z.infer<typeof Papel>;

/** D-06 — antitérmico era texto livre avaliado por truthiness; agora é enum fechado. */
export const Antitermico = z.enum(["NENHUM", "AUTORIZADO"]);
export type Antitermico = z.infer<typeof Antitermico>;

/** PRD §7 — "Escada de matrícula", 8 degraus sobre a matrícula cheia. */
export const DegrauChave = z.enum([
  "AVISTA_ATE_31_08",
  "AVISTA_ATE_15_09",
  "AVISTA_1X",
  "CARTAO_2X",
  "CARTAO_3X",
  "CARTAO_4X",
  "CARTAO_5X",
  "CARTAO_6X",
]);
export type DegrauChave = z.infer<typeof DegrauChave>;

export const TipoVinculo = z.enum(["LEGAL", "FINANCEIRO", "AUTORIZADO_RETIRADA"]);
export type TipoVinculo = z.infer<typeof TipoVinculo>;

export const Ambiente = z.enum(["sandbox", "homologacao", "producao"]);
export type Ambiente = z.infer<typeof Ambiente>;
