import { useMemo, useState } from "react";
import { pendencias } from "@somaverso/motor";
import type { EstadoAvaliacao, Papel } from "@somaverso/schemas";
import { simulaMatricula } from "../api/matriculas.js";

/**
 * PRD §6 — "A interface mostra o veredito em tempo real; o servidor
 * reavalia e reemite o veredito antes de qualquer efeito. O veredito do
 * cliente é conveniência de UX e não tem autoridade."
 *
 * `pendencias()` (de `@somaverso/motor`, rodando no navegador — o mesmo
 * pacote isomórfico do servidor) dá feedback instantâneo de campos
 * faltando, sem precisar de rede. A decisão LIBERADO/BLOQUEADO em si
 * depende de `Contexto` (tabela aprovada, testemunhas, DPA — I-6: estado
 * do servidor, o navegador não tem essa informação com autoridade), então
 * só o resultado de `/simulacao` no servidor conta para habilitar
 * qualquer ação real.
 */
export function useVeredito(pedidoBruto: Record<string, unknown>) {
  const pendenciasLocais = useMemo(() => pendencias(pedidoBruto), [pedidoBruto]);

  const [estadoServidor, setEstadoServidor] = useState<EstadoAvaliacao | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function simular(token: string, matriculaId: string, papelAtuante?: Papel) {
    setSimulando(true);
    setErro(null);
    try {
      const estado = await simulaMatricula(token, matriculaId, papelAtuante);
      setEstadoServidor(estado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao simular.");
    } finally {
      setSimulando(false);
    }
  }

  return { pendenciasLocais, estadoServidor, simulando, erro, simular };
}
