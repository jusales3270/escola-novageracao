import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth.js";
import { useSessao } from "../estado/sessao.js";
import { ErroApi } from "../api/cliente.js";

export function PaginaLogin() {
  const sessao = useSessao();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await login(email, senha);
      sessao.entrar(resposta.token, resposta.usuario);
      navigate("/matriculas");
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Falha ao entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto" }}>
      <h1>SomaEscola</h1>
      <form onSubmit={aoEnviar}>
        <div>
          <label>E-mail</label>
          <br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%" }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Senha</label>
          <br />
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required style={{ width: "100%" }} />
        </div>
        {erro && <p style={{ color: "#d93025" }}>{erro}</p>}
        <button type="submit" disabled={enviando} style={{ marginTop: 12 }}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
