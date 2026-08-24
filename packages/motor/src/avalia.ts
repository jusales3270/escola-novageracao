import type { Pedido, Contexto, TabelaPreco, Resultado, Veredito } from "@somaverso/schemas";
import { buscaLinha } from "./tabela/faixa.js";
import { calculaComposicaoMensal, calculaMatricula } from "./calculo.js";
import { FAIXA_PRECO } from "@somaverso/schemas";
import {
  r01_reconciliaAnuidade,
  r02_alimentacaoDupla,
  r03_alcadaDesconto,
  r04_consentimentoGranular,
  r05_medicacaoComPrescricao,
  r06_testemunhas,
  r07_tabelaAprovada,
  r08_anoCoerente,
  r09_responsavelFinanceiro,
  r10_restricaoGuarda,
  r11_escadaMatricula,
  r12_dpaAssinado,
} from "./regras/index.js";
import { motorVersao } from "./versao.js";

/**
 * PRD §9 — `avalia(pedido, ctx, tabela): Resultado`. Pura: sem I/O, sem
 * relógio, sem aleatoriedade, sem rede. `agora` é recebido por parâmetro
 * (I-7: nenhuma inferência probabilística, e nenhuma dependência oculta de
 * ambiente também vale para o tempo).
 *
 * O servidor reavalia e reemite o veredito antes de qualquer efeito (§6);
 * o veredito calculado no navegador é conveniência de UX, nunca autoridade.
 */
export function avalia(pedido: Pedido, ctx: Contexto, tabela: TabelaPreco, agora: Date = new Date()): Resultado {
  const faixa = FAIXA_PRECO[pedido.servicos.turma];
  const linha = buscaLinha(tabela, faixa, pedido.servicos.periodo);

  const vereditos: Veredito[] = [
    r07_tabelaAprovada(tabela, agora),
    r08_anoCoerente(pedido.anoLetivo, tabela.anoLetivo),
    r01_reconciliaAnuidade(linha),
    r02_alimentacaoDupla(linha, pedido.servicos.alimentacao),
    r03_alcadaDesconto(pedido.operador.papel, pedido.descontoExcepcionalPct, pedido.justificativaDesconto),
    r04_consentimentoGranular(pedido.consentimentos),
    r05_medicacaoComPrescricao(pedido.aluno.ficha, ctx.prescricaoAnexoId),
    r06_testemunhas(ctx.testemunhas),
    r09_responsavelFinanceiro(pedido.contratante, pedido.responsavelFinanceiro),
    r10_restricaoGuarda(pedido.aluno.restricaoJudicial, pedido.aluno.restricaoJudicialAnexoId, pedido.aluno.autorizadosRetirada.length),
    r11_escadaMatricula(tabela),
    r12_dpaAssinado(ctx.dpaAssinado, ctx.ambiente),
  ];

  const bloqueios = vereditos.filter((v) => v.severidade === "BLOQUEIA" && !v.conforme);
  const decisao = bloqueios.length === 0 ? "LIBERADO" : "BLOQUEADO";

  return {
    decisao,
    vereditos,
    bloqueios,
    calculo:
      decisao === "LIBERADO"
        ? {
            mensal: calculaComposicaoMensal(
              linha,
              pedido.servicos,
              tabela.adicionais,
              pedido.descontoExcepcionalPct,
              tabela.descontoPontualidadePct,
            ),
            matricula: calculaMatricula(tabela, pedido.formaPagamentoMatricula),
          }
        : null,
    motorVersao: motorVersao(),
  };
}
