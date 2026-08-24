import { Pedido, type Pendencia } from "@somaverso/schemas";

/**
 * PRD §9 — "Estado INCOMPLETO: anterior à avaliação. Campos obrigatórios
 * ausentes (pendencias()) suspendem o motor — nenhuma regra é marcada
 * conforme ou não conforme enquanto houver pendência. É estado de
 * interface, não veredito."
 *
 * D-13 — o protótipo não incluía `operador.nome`/`operador.papel` nem o
 * contato de emergência do responsável financeiro na lista obrigatória.
 * Aqui esses campos vêm de graça: fazem parte do schema `Pedido`
 * (`packages/schemas`), então qualquer ausência já produz uma `issue` do
 * Zod — o mapa abaixo só dá um rótulo legível para a secretaria, não
 * decide o que é obrigatório.
 */
const ROTULO_CAMPO: Record<string, string> = {
  "aluno.nome": "Nome do aluno",
  "aluno.nascimento": "Data de nascimento",
  "aluno.endereco": "Endereço",
  "aluno.bairro": "Bairro",
  "aluno.cidade": "Cidade",
  "aluno.cep": "CEP",
  "aluno.ficha.contatoEmergencia": "Aluno — contato de emergência",
  "aluno.ficha.contatoEmergencia.nome": "Aluno — contato de emergência (nome)",
  "aluno.ficha.contatoEmergencia.telefone": "Aluno — contato de emergência (telefone)",
  "contratante.nome": "Contratante — nome",
  "contratante.cpf": "Contratante — CPF",
  "contratante.email": "Contratante — e-mail",
  "contratante.telefone": "Contratante — telefone",
  "responsavelFinanceiro.nome": "Responsável financeiro — nome",
  "responsavelFinanceiro.cpf": "Responsável financeiro — CPF",
  "responsavelFinanceiro.email": "Responsável financeiro — e-mail",
  "responsavelFinanceiro.telefone": "Responsável financeiro — telefone",
  "responsavelFinanceiro.contatoEmergencia": "Responsável financeiro — contato de emergência",
  "responsavelFinanceiro.contatoEmergencia.nome": "Responsável financeiro — contato de emergência (nome)",
  "responsavelFinanceiro.contatoEmergencia.telefone": "Responsável financeiro — contato de emergência (telefone)",
  "operador.nome": "Operador — nome",
  "operador.papel": "Operador — papel",
};

export function pendencias(input: unknown): Pendencia[] {
  const r = Pedido.safeParse(input);
  if (r.success) return [];
  return r.error.issues.map((i) => {
    const caminho = i.path.join(".");
    return { campo: caminho, rotulo: ROTULO_CAMPO[caminho] ?? caminho, motivo: i.message };
  });
}
