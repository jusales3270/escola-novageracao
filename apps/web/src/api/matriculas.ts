import type { EstadoAvaliacao, Papel, Testemunha, Canal } from "@somaverso/schemas";
import { chamaApi } from "./cliente.js";

export interface MatriculaCriada {
  matriculaId: string;
  status: string;
}

export function criaMatricula(token: string, anoLetivo: number, tipo: "MATRICULA" | "REMATRICULA"): Promise<MatriculaCriada> {
  return chamaApi<MatriculaCriada>("/v1/matriculas", { method: "POST", token, body: { anoLetivo, tipo } });
}

export function atualizaMatricula(token: string, matriculaId: string, pedidoParcial: Record<string, unknown>): Promise<unknown> {
  return chamaApi(`/v1/matriculas/${matriculaId}`, { method: "PATCH", token, body: pedidoParcial });
}

export function definheTestemunhas(token: string, matriculaId: string, testemunhas: Testemunha[]): Promise<unknown> {
  return chamaApi(`/v1/matriculas/${matriculaId}`, { method: "PATCH", token, body: { contexto: { testemunhas } } });
}

export function simulaMatricula(token: string, matriculaId: string, papelAtuante?: Papel): Promise<EstadoAvaliacao> {
  return chamaApi<EstadoAvaliacao>(`/v1/matriculas/${matriculaId}/simulacao`, {
    method: "POST",
    token,
    body: papelAtuante ? { papelAtuante } : {},
  });
}

export interface RespostaEmissao {
  matriculaId: string;
  decisao: "LIBERADO";
  vereditoHash: string;
  proximaEtapa: string;
  mensagem: string;
}

export function emiteMatricula(token: string, matriculaId: string, idempotencyKey: string, papelAtuante?: Papel): Promise<RespostaEmissao> {
  return chamaApi<RespostaEmissao>(`/v1/matriculas/${matriculaId}/emissao`, {
    method: "POST",
    token,
    idempotencyKey,
    body: papelAtuante ? { papelAtuante } : {},
  });
}

export interface EventoTrilha {
  seq: number;
  em: string;
  tipo: string;
  ator: string;
  matriculaId: string | null;
}

export function buscaTrilha(token: string, matriculaId: string): Promise<{ matriculaId: string; eventos: EventoTrilha[] }> {
  return chamaApi(`/v1/matriculas/${matriculaId}/trilha`, { token });
}

export function revogaConsentimento(token: string, matriculaId: string, canal: Canal): Promise<unknown> {
  return chamaApi(`/v1/consentimentos/${matriculaId}/revogacao`, { method: "POST", token, body: { canal } });
}
