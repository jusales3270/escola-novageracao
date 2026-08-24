import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { UsuarioLogado } from "../api/auth.js";

interface Sessao {
  token: string | null;
  usuario: UsuarioLogado | null;
  entrar: (token: string, usuario: UsuarioLogado) => void;
  sair: () => void;
}

const SessaoContext = createContext<Sessao | null>(null);

const CHAVE_STORAGE = "somaescola.sessao";

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{ token: string; usuario: UsuarioLogado } | null>(() => {
    try {
      const bruto = sessionStorage.getItem(CHAVE_STORAGE);
      return bruto ? (JSON.parse(bruto) as { token: string; usuario: UsuarioLogado }) : null;
    } catch {
      return null;
    }
  });

  const valor = useMemo<Sessao>(
    () => ({
      token: estado?.token ?? null,
      usuario: estado?.usuario ?? null,
      entrar: (token, usuario) => {
        setEstado({ token, usuario });
        sessionStorage.setItem(CHAVE_STORAGE, JSON.stringify({ token, usuario }));
      },
      sair: () => {
        setEstado(null);
        sessionStorage.removeItem(CHAVE_STORAGE);
      },
    }),
    [estado],
  );

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao(): Sessao {
  const ctx = useContext(SessaoContext);
  if (!ctx) throw new Error("useSessao() fora de <SessaoProvider>");
  return ctx;
}
