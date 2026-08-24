import { BrowserRouter, Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { SessaoProvider, useSessao } from "./estado/sessao.js";
import { PaginaLogin } from "./paginas/PaginaLogin.js";
import { PaginaMatricula } from "./paginas/PaginaMatricula.js";
import { PaginaTabelasPreco } from "./paginas/PaginaTabelasPreco.js";

function Layout({ children }: { children: React.ReactNode }) {
  const sessao = useSessao();
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <nav>
          <Link to="/matriculas">Matrícula</Link> | <Link to="/tabelas-preco">Tabelas de preço</Link>
        </nav>
        {sessao.usuario && (
          <div>
            {sessao.usuario.nome} ({sessao.usuario.papeis.join(", ")}){" "}
            <button
              onClick={() => {
                sessao.sair();
                navigate("/login");
              }}
            >
              Sair
            </button>
          </div>
        )}
      </header>
      {children}
    </div>
  );
}

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const sessao = useSessao();
  if (!sessao.token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export function App() {
  return (
    <SessaoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PaginaLogin />} />
          <Route
            path="/matriculas/:id?"
            element={
              <RotaProtegida>
                <PaginaMatricula />
              </RotaProtegida>
            }
          />
          <Route
            path="/tabelas-preco"
            element={
              <RotaProtegida>
                <PaginaTabelasPreco />
              </RotaProtegida>
            }
          />
          <Route path="*" element={<Navigate to="/matriculas" replace />} />
        </Routes>
      </BrowserRouter>
    </SessaoProvider>
  );
}
