import { z } from "zod";

/**
 * Valida um CPF já normalizado (11 dígitos, só números).
 * Algoritmo padrão de dígito verificador (módulo 11); rejeita sequências
 * de dígito repetido (ex.: "00000000000"), que passariam no cálculo mas
 * nunca são CPFs reais emitidos.
 */
export function validaCPF(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digitos = cpf.split("").map(Number);

  const calculaDigito = (base: number[]): number => {
    let soma = 0;
    let peso = base.length + 1;
    for (const d of base) {
      soma += d * peso;
      peso -= 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calculaDigito(digitos.slice(0, 9));
  const d2 = calculaDigito(digitos.slice(0, 10));

  return d1 === digitos[9] && d2 === digitos[10];
}

/**
 * PRD §8.2 — CPF normalizado para 11 dígitos em toda comparação e persistência.
 * D-05 (o protótipo comparava ora bruto ora normalizado): normalizar aqui,
 * na fronteira do schema, é o que garante que a comparação nunca mais diverge.
 */
export const CPF = z
  .string()
  .transform((s) => s.replace(/\D/g, ""))
  .refine(validaCPF, "CPF inválido");
