/** Lançado quando a tabela de preços não tem linha para a faixa/período pedidos — nunca `undefined` silencioso. */
export class LinhaPrecoNaoEncontrada extends Error {
  constructor(faixa: string, periodo: string) {
    super(`Nenhuma linha de preço para faixa=${faixa} periodo=${periodo}`);
    this.name = "LinhaPrecoNaoEncontrada";
  }
}

/** Lançado quando a tabela de preços não tem degrau para a chave pedida. */
export class DegrauNaoEncontrado extends Error {
  constructor(chave: string) {
    super(`Nenhum degrau de matrícula para chave=${chave}`);
    this.name = "DegrauNaoEncontrado";
  }
}
