import { useEffect, useState } from "react";
import { useSessao } from "../estado/sessao.js";
import { listaTabelasPreco, aprovaTabelaPreco, type TabelaPrecoResumo } from "../api/tabelasPreco.js";

export function PaginaTabelasPreco() {
  const sessao = useSessao();
  const [tabelas, setTabelas] = useState<TabelaPrecoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const podeAprovar = sessao.usuario?.papeis.includes("DIRECAO") ?? false;

  async function recarrega() {
    if (!sessao.token) return;
    setCarregando(true);
    const resposta = await listaTabelasPreco(sessao.token);
    setTabelas(resposta.tabelas);
    setCarregando(false);
  }

  useEffect(() => {
    void recarrega();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao.token]);

  async function aprova(id: string) {
    if (!sessao.token) return;
    await aprovaTabelaPreco(sessao.token, id);
    await recarrega();
  }

  return (
    <div>
      <h2>Tabelas de preço</h2>
      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ano letivo</th>
              <th>Status</th>
              <th>Aprovada por</th>
              {podeAprovar && <th />}
            </tr>
          </thead>
          <tbody>
            {tabelas.map((t) => (
              <tr key={t.id}>
                <td>{t.ano_letivo}</td>
                <td>{t.status}</td>
                <td>{t.aprovada_por_nome ?? "—"}</td>
                {podeAprovar && (
                  <td>
                    {t.status === "RASCUNHO" && <button onClick={() => aprova(t.id)}>Aprovar</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!podeAprovar && <p style={{ color: "#666" }}>Só o papel DIRECAO pode aprovar tabelas de preço.</p>}
    </div>
  );
}
