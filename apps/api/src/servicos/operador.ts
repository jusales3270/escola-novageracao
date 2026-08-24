import type { Papel, Pedido } from "@somaverso/schemas";
import type { ClaimsJwt } from "../plugins/auth.js";
import { SemPermissaoErro } from "../erros/problema.js";

/**
 * `Pedido.operador` ({id, nome, papel}) vem no CORPO da requisição — mas
 * R-03 (alçada de desconto) decide com base nele. Se a API confiasse
 * nesse valor, uma SECRETARIA autenticada poderia mandar
 * `operador.papel: "DIRECAO"` no corpo e ganhar teto de 100% de desconto.
 * Isso é a mesma classe de problema que I-6 já resolve para ambiente/
 * aprovação de tabela/testemunhas/DPA — decisão de negócio nunca vem do
 * cliente sem checagem do servidor.
 *
 * Validado ANTES de qualquer avaliação (mesmo para pedido INCOMPLETO) —
 * é uma checagem de autorização, não deve depender do estado do pedido.
 * `papelAtuante` (o usuário pode ter mais de um papel — `usuario_papel`
 * permite isso) precisa: (a) estar entre os papéis do token, e (b) estar
 * entre `papeisPermitidosNaRota`.
 */
export function validaPapelAtuante(usuario: ClaimsJwt, papeisPermitidosNaRota: Papel[], papelAtuante?: Papel): Papel {
  const papel = papelAtuante ?? usuario.papeis[0];
  if (!papel) throw new SemPermissaoErro("Usuário sem papel atribuído.");
  if (!usuario.papeis.includes(papel)) {
    throw new SemPermissaoErro(`Papel "${papel}" não pertence ao usuário autenticado.`);
  }
  if (!papeisPermitidosNaRota.includes(papel)) {
    throw new SemPermissaoErro(`Papel "${papel}" não pode atuar nesta rota.`);
  }
  return papel;
}

/** O que o cliente mandou em `pedido.operador` é sempre substituído pelo valor resolvido do servidor. */
export function comOperadorServidor(pedido: Pedido, usuario: ClaimsJwt, papel: Papel): Pedido {
  return {
    ...pedido,
    operador: { id: usuario.sub, nome: usuario.nome, papel },
  };
}
