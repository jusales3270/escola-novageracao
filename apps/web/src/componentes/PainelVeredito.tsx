import { ORDEM_EXIBICAO } from "@somaverso/motor";
import type { EstadoAvaliacao, Pendencia, Veredito } from "@somaverso/schemas";

const estilos = {
  ok: { background: "#e6f4ea", border: "1px solid #34a853", padding: "8px 12px", borderRadius: 6, marginBottom: 6 },
  bloqueia: { background: "#fce8e6", border: "1px solid #d93025", padding: "8px 12px", borderRadius: 6, marginBottom: 6 },
  alerta: { background: "#fef7e0", border: "1px solid #f9ab00", padding: "8px 12px", borderRadius: 6, marginBottom: 6 },
};

function ordenaVereditos(vereditos: Veredito[]): Veredito[] {
  const posicao = new Map<string, number>(ORDEM_EXIBICAO.map((r, i) => [r, i]));
  return [...vereditos].sort((a, b) => (posicao.get(a.regra) ?? 99) - (posicao.get(b.regra) ?? 99));
}

export function PainelVeredito({
  pendenciasLocais,
  estadoServidor,
}: {
  pendenciasLocais: Pendencia[];
  estadoServidor: EstadoAvaliacao | null;
}) {
  if (!estadoServidor) {
    return (
      <div>
        <p>Ainda não simulado no servidor.</p>
        {pendenciasLocais.length > 0 && (
          <div style={estilos.bloqueia}>
            <strong>{pendenciasLocais.length} campo(s) obrigatório(s) pendente(s) (verificação local):</strong>
            <ul>
              {pendenciasLocais.map((p) => (
                <li key={p.campo}>{p.rotulo}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (estadoServidor.status === "INCOMPLETO") {
    return (
      <div style={estilos.bloqueia}>
        <strong>INCOMPLETO — {estadoServidor.pendencias.length} campo(s) pendente(s):</strong>
        <ul>
          {estadoServidor.pendencias.map((p) => (
            <li key={p.campo}>{p.rotulo}</li>
          ))}
        </ul>
      </div>
    );
  }

  const { resultado } = estadoServidor;
  return (
    <div>
      <h3>{estadoServidor.status === "LIBERADO" ? "✅ LIBERADO" : "🚫 BLOQUEADO"}</h3>
      {ordenaVereditos(resultado.vereditos).map((v) => (
        <div key={v.regra} style={v.conforme ? estilos.ok : v.severidade === "BLOQUEIA" ? estilos.bloqueia : estilos.alerta}>
          <strong>
            {v.regra} — {v.titulo}
          </strong>
          <p style={{ margin: "4px 0 0" }}>{v.detalhe}</p>
        </div>
      ))}
      {resultado.calculo && (
        <div style={{ marginTop: 12 }}>
          <strong>Mensalidade com pontualidade: R$ {resultado.calculo.mensal.totalComPontualidade.toFixed(2)}</strong>
          <br />
          <strong>
            Matrícula ({resultado.calculo.matricula.chave}): {resultado.calculo.matricula.parcelas}x R${" "}
            {resultado.calculo.matricula.valorParcela.toFixed(2)}
          </strong>
        </div>
      )}
    </div>
  );
}
