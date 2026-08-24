import type { PoolClient } from "pg";
import type { Contexto, Ambiente, Testemunha } from "@somaverso/schemas";

interface LinhaMatriculaContexto {
  testemunhas: Testemunha[];
  prescricao_anexo_id: string | null;
}

interface LinhaTabelaAprovacao {
  id: string;
  aprovada_por_nome: string | null;
}

interface LinhaEscolaDpa {
  dpa_assinado_em: string | null;
}

/**
 * PRD I-6 — "ambiente, aprovação de tabela, testemunhas e DPA são estado
 * do servidor. O cliente não os altera." Nenhum destes campos aceita
 * input de corpo de requisição em NENHUMA rota: `ambiente` vem de
 * `config.ts` (variável de ambiente do processo — é conceito de
 * deployment, não de registro); `testemunhas`/`prescricaoAnexoId` vêm da
 * coluna de `matricula` (só a rota de PATCH sob papel DIRECAO escreve
 * `testemunhas`); `tabelaAprovadaPor`/`dpaAssinado` vêm de consultas
 * próprias, resolvidas aqui.
 */
export async function montaContexto(client: PoolClient, matriculaId: string, tabelaPrecoId: string, ambiente: Ambiente): Promise<Contexto> {
  const { rows: linhasMatricula } = await client.query<LinhaMatriculaContexto>(
    "SELECT testemunhas, prescricao_anexo_id FROM matricula WHERE id = $1",
    [matriculaId],
  );
  const matricula = linhasMatricula[0];
  if (!matricula) throw new Error(`matricula ${matriculaId} não encontrada ao montar contexto`);

  const { rows: linhasTabela } = await client.query<LinhaTabelaAprovacao>(
    `SELECT tp.id, u.nome AS aprovada_por_nome
     FROM tabela_preco tp
     LEFT JOIN usuario u ON u.id = tp.aprovada_por_usuario_id
     WHERE tp.id = $1`,
    [tabelaPrecoId],
  );
  const tabela = linhasTabela[0];
  if (!tabela) throw new Error(`tabela_preco ${tabelaPrecoId} não encontrada ao montar contexto`);

  const { rows: linhasEscola } = await client.query<LinhaEscolaDpa>(
    `SELECT e.dpa_assinado_em
     FROM escola e
     JOIN matricula m ON m.escola_id = e.id
     WHERE m.id = $1`,
    [matriculaId],
  );
  const escola = linhasEscola[0];
  if (!escola) throw new Error(`escola da matricula ${matriculaId} não encontrada ao montar contexto`);

  return {
    tabelaAprovadaPor: tabela.aprovada_por_nome,
    tabelaPrecoId: tabela.id,
    testemunhas: matricula.testemunhas,
    prescricaoAnexoId: matricula.prescricao_anexo_id,
    dpaAssinado: escola.dpa_assinado_em !== null,
    ambiente,
  };
}
