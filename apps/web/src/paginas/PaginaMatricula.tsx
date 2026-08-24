import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSessao } from "../estado/sessao.js";
import { criaMatricula, atualizaMatricula, definheTestemunhas, emiteMatricula, buscaTrilha, type EventoTrilha } from "../api/matriculas.js";
import { useVeredito } from "../hooks/useVeredito.js";
import { PainelVeredito } from "../componentes/PainelVeredito.js";
import { ErroApi } from "../api/cliente.js";

const CANAIS = ["SITE", "REDES_SOCIAIS", "ALBUM_TURMA", "USO_PEDAGOGICO_INTERNO", "MATERIAL_IMPRESSO"] as const;

function estadoInicialPedido(operadorId: string, operadorNome: string) {
  return {
    aluno: {
      nome: "",
      nascimento: "",
      endereco: "",
      bairro: "",
      cidade: "",
      cep: "",
      irmaosNaEscola: [] as string[],
      restricaoJudicial: false,
      restricaoJudicialAnexoId: null,
      ficha: {
        usoContinuoMedicamento: false,
        alergico: false,
        antitermico: "NENHUM",
        contatoEmergencia: { nome: "", telefone: "" },
      },
      autorizadosRetirada: [] as unknown[],
    },
    contratante: { nome: "", cpf: "", email: "", telefone: "" },
    responsavelFinanceiro: { nome: "", cpf: "", email: "", telefone: "", contatoEmergencia: { nome: "", telefone: "" } },
    servicos: { turma: "MATERNAL", periodo: "MEIO", alimentacao: "NENHUMA", fraldario: "NENHUM", horaAdicionalDiasMes: 0 },
    formaPagamentoMatricula: "AVISTA_1X",
    descontoExcepcionalPct: 0,
    consentimentos: {} as Record<string, boolean>,
    operador: { id: operadorId, nome: operadorNome, papel: "SECRETARIA" },
  };
}

export function PaginaMatricula() {
  const sessao = useSessao();
  const usuario = sessao.usuario!;
  const token = sessao.token!;
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(() => estadoInicialPedido(usuario.id, usuario.nome));
  const [anoLetivo, setAnoLetivo] = useState(2028);
  // O id vem da URL (/matriculas/:id) — sobrevive a navegar para outra
  // página e voltar, ao contrário de um useState puro (que remonta zerado
  // quando o React Router troca de rota).
  const [matriculaId, setMatriculaId] = useState<string | null>(params.id ?? null);
  const [testemunhas, setTestemunhas] = useState("");
  const [trilha, setTrilha] = useState<EventoTrilha[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const pedidoParaAvaliacao = useMemo(() => ({ anoLetivo, tipo: "MATRICULA", ...pedido }), [pedido, anoLetivo]);
  const { pendenciasLocais, estadoServidor, simulando, erro, simular } = useVeredito(pedidoParaAvaliacao);

  function atualiza<K extends keyof typeof pedido>(chave: K, valor: (typeof pedido)[K]) {
    setPedido((p) => ({ ...p, [chave]: valor }));
  }

  async function aoCriar() {
    const resposta = await criaMatricula(token, anoLetivo, "MATRICULA");
    setMatriculaId(resposta.matriculaId);
    setMensagem(`Matrícula ${resposta.matriculaId} criada (RASCUNHO).`);
    navigate(`/matriculas/${resposta.matriculaId}`, { replace: true });
  }

  async function aoSalvar() {
    if (!matriculaId) return;
    await atualizaMatricula(token, matriculaId, pedido);
    setMensagem("Pedido atualizado.");
  }

  async function aoSimular() {
    if (!matriculaId) return;
    try {
      await aoSalvar();
    } catch {
      // Formulário ainda incompleto (campos em branco não passam no Zod
      // do PATCH) — segue e simula contra o último snapshot salvo com
      // sucesso, que é exatamente o caso INCOMPLETO que queremos mostrar.
    }
    await simular(token, matriculaId);
  }

  async function aoDefinirTestemunhas() {
    if (!matriculaId) return;
    const nomes = testemunhas
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    if (nomes.length !== 2) {
      setMensagem("Informe exatamente 2 testemunhas no formato: Nome,CPF,email; Nome,CPF,email");
      return;
    }
    const objs = nomes.map((linha) => {
      const [nome, cpf, email] = linha.split(",").map((s) => s.trim());
      return { nome: nome ?? "", cpf: cpf ?? "", email: email ?? "" };
    });
    await definheTestemunhas(token, matriculaId, objs);
    setMensagem("Testemunhas definidas.");
  }

  async function aoEmitir() {
    if (!matriculaId) return;
    try {
      const resposta = await emiteMatricula(token, matriculaId, crypto.randomUUID());
      setMensagem(`${resposta.mensagem} (hash: ${resposta.vereditoHash.slice(0, 12)}...)`);
    } catch (e) {
      setMensagem(e instanceof ErroApi ? e.message : "Falha ao emitir.");
    }
    const t = await buscaTrilha(token, matriculaId);
    setTrilha(t.eventos);
  }

  const podeEmitir = estadoServidor?.status === "LIBERADO";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        <h2>Matrícula {matriculaId ? `#${matriculaId.slice(0, 8)}` : "(nova)"}</h2>
        {!matriculaId && (
          <div>
            <label>
              Ano letivo{" "}
              <input type="number" value={anoLetivo} onChange={(e) => setAnoLetivo(Number(e.target.value))} style={{ width: 80 }} />
            </label>{" "}
            <button onClick={aoCriar}>Criar rascunho</button>
          </div>
        )}

        {matriculaId && (
          <>
            <fieldset>
              <legend>Aluno</legend>
              <input
                placeholder="Nome do aluno"
                value={pedido.aluno.nome}
                onChange={(e) => atualiza("aluno", { ...pedido.aluno, nome: e.target.value })}
              />
              <input
                type="date"
                value={pedido.aluno.nascimento}
                onChange={(e) => atualiza("aluno", { ...pedido.aluno, nascimento: e.target.value })}
              />
              <input
                placeholder="Endereço"
                value={pedido.aluno.endereco}
                onChange={(e) => atualiza("aluno", { ...pedido.aluno, endereco: e.target.value })}
              />
              <input
                placeholder="Bairro"
                value={pedido.aluno.bairro}
                onChange={(e) => atualiza("aluno", { ...pedido.aluno, bairro: e.target.value })}
              />
              <input
                placeholder="Cidade"
                value={pedido.aluno.cidade}
                onChange={(e) => atualiza("aluno", { ...pedido.aluno, cidade: e.target.value })}
              />
              <input placeholder="CEP" value={pedido.aluno.cep} onChange={(e) => atualiza("aluno", { ...pedido.aluno, cep: e.target.value })} />
              <input
                placeholder="Contato de emergência — nome"
                value={pedido.aluno.ficha.contatoEmergencia.nome}
                onChange={(e) =>
                  atualiza("aluno", { ...pedido.aluno, ficha: { ...pedido.aluno.ficha, contatoEmergencia: { ...pedido.aluno.ficha.contatoEmergencia, nome: e.target.value } } })
                }
              />
              <input
                placeholder="Contato de emergência — telefone"
                value={pedido.aluno.ficha.contatoEmergencia.telefone}
                onChange={(e) =>
                  atualiza("aluno", { ...pedido.aluno, ficha: { ...pedido.aluno.ficha, contatoEmergencia: { ...pedido.aluno.ficha.contatoEmergencia, telefone: e.target.value } } })
                }
              />
            </fieldset>

            <fieldset>
              <legend>Contratante</legend>
              <input placeholder="Nome" value={pedido.contratante.nome} onChange={(e) => atualiza("contratante", { ...pedido.contratante, nome: e.target.value })} />
              <input placeholder="CPF" value={pedido.contratante.cpf} onChange={(e) => atualiza("contratante", { ...pedido.contratante, cpf: e.target.value })} />
              <input placeholder="E-mail" value={pedido.contratante.email} onChange={(e) => atualiza("contratante", { ...pedido.contratante, email: e.target.value })} />
              <input placeholder="Telefone" value={pedido.contratante.telefone} onChange={(e) => atualiza("contratante", { ...pedido.contratante, telefone: e.target.value })} />
            </fieldset>

            <fieldset>
              <legend>Responsável financeiro</legend>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) =>
                    e.target.checked &&
                    atualiza("responsavelFinanceiro", {
                      ...pedido.contratante,
                      contatoEmergencia: pedido.aluno.ficha.contatoEmergencia,
                    })
                  }
                />{" "}
                Mesma pessoa que o contratante
              </label>
              <input
                placeholder="Contato de emergência — nome"
                value={pedido.responsavelFinanceiro.contatoEmergencia.nome}
                onChange={(e) =>
                  atualiza("responsavelFinanceiro", { ...pedido.responsavelFinanceiro, contatoEmergencia: { ...pedido.responsavelFinanceiro.contatoEmergencia, nome: e.target.value } })
                }
              />
              <input
                placeholder="Contato de emergência — telefone"
                value={pedido.responsavelFinanceiro.contatoEmergencia.telefone}
                onChange={(e) =>
                  atualiza("responsavelFinanceiro", { ...pedido.responsavelFinanceiro, contatoEmergencia: { ...pedido.responsavelFinanceiro.contatoEmergencia, telefone: e.target.value } })
                }
              />
            </fieldset>

            <fieldset>
              <legend>Serviços</legend>
              <select value={pedido.servicos.turma} onChange={(e) => atualiza("servicos", { ...pedido.servicos, turma: e.target.value })}>
                {["BERCARIO", "MINI_MATERNAL", "MATERNAL", "JARDIM", "ALFA_I", "ALFA_II"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select value={pedido.servicos.periodo} onChange={(e) => atualiza("servicos", { ...pedido.servicos, periodo: e.target.value })}>
                <option value="MEIO">Meio período</option>
                <option value="INTEGRAL">Integral</option>
              </select>
              <select value={pedido.servicos.alimentacao} onChange={(e) => atualiza("servicos", { ...pedido.servicos, alimentacao: e.target.value })}>
                {["NENHUMA", "ALMOCO", "ALMOCO_JANTAR", "ALMOCO_OU_JANTAR"].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <label>
                Desconto excepcional (%){" "}
                <input
                  type="number"
                  value={pedido.descontoExcepcionalPct}
                  onChange={(e) => atualiza("descontoExcepcionalPct", Number(e.target.value))}
                  style={{ width: 60 }}
                />
              </label>
            </fieldset>

            <fieldset>
              <legend>Consentimento de imagem por canal</legend>
              {CANAIS.map((c) => (
                <label key={c} style={{ display: "block" }}>
                  <input
                    type="checkbox"
                    checked={pedido.consentimentos[c] ?? false}
                    onChange={(e) => atualiza("consentimentos", { ...pedido.consentimentos, [c]: e.target.checked })}
                  />{" "}
                  {c}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>Testemunhas (papel DIRECAO)</legend>
              <input
                placeholder="Nome,CPF,email; Nome,CPF,email"
                value={testemunhas}
                onChange={(e) => setTestemunhas(e.target.value)}
                style={{ width: "100%" }}
              />
              <button onClick={aoDefinirTestemunhas} disabled={!usuario.papeis.includes("DIRECAO")}>
                Definir testemunhas
              </button>
            </fieldset>

            <div style={{ marginTop: 12 }}>
              <button onClick={aoSalvar}>Salvar pedido</button>{" "}
              <button onClick={aoSimular} disabled={simulando}>
                {simulando ? "Simulando..." : "Simular"}
              </button>{" "}
              <button onClick={aoEmitir} disabled={!podeEmitir} title={podeEmitir ? "" : "Só habilita quando o SERVIDOR responde LIBERADO"}>
                Emitir
              </button>
            </div>
            {erro && <p style={{ color: "#d93025" }}>{erro}</p>}
            {mensagem && <p>{mensagem}</p>}

            {trilha.length > 0 && (
              <fieldset>
                <legend>Trilha</legend>
                <ol>
                  {trilha.map((e) => (
                    <li key={e.seq}>
                      seq {e.seq} — {e.tipo} ({e.em})
                    </li>
                  ))}
                </ol>
              </fieldset>
            )}
          </>
        )}
      </div>

      <div>
        <h2>Veredito</h2>
        <PainelVeredito pendenciasLocais={pendenciasLocais} estadoServidor={estadoServidor} />
      </div>
    </div>
  );
}
