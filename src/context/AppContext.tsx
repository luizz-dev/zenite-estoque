"use client";

// ============================================================================
// APP CONTEXT — fonte única de estado no cliente.
// ----------------------------------------------------------------------------
// Toda página/componente que precisa de produtos, notas fiscais,
// notificações, dados da empresa ou do usuário logado usa o hook
// `useApp()` em vez de buscar isso sozinho. Por baixo dos panos, este
// provider conversa com as rotas em src/app/api/*.
// ============================================================================
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Produto, NotaFiscal, Notificacao, Movimentacao, Empresa, Usuario, NovaNotaPayload, ContaFixa, Assinatura, PlanoAssinatura } from "@/lib/types";

interface AppContextValue {
  carregando: boolean;
  usuario: Usuario | null;
  empresa: Empresa | null;
  produtos: Produto[];
  notas: NotaFiscal[];
  movimentacoes: Movimentacao[];
  notificacoes: Notificacao[];
  contasFixas: ContaFixa[];
  assinatura: Assinatura | null;
  naoLidas: number;

  recarregarTudo: () => Promise<void>;
  definirUsuario: (u: Usuario | null) => void;

  criarProduto: (dados: Partial<Produto>) => Promise<void>;
  editarProduto: (id: string, dados: Partial<Produto>) => Promise<void>;
  excluirProduto: (id: string) => Promise<void>;

  emitirNota: (payload: NovaNotaPayload) => Promise<{ ok: boolean; erro?: string }>;
  registrarMovimentacao: (dados: { produtoId: string; tipo: "entrada" | "saida"; quantidade: number; motivo: string; observacao?: string }) => Promise<{ ok: boolean; erro?: string }>;

  marcarNotificacaoLida: (id: string) => Promise<void>;
  marcarTodasLidas: () => Promise<void>;

  salvarDadosFiscais: (dados: Partial<Empresa>) => Promise<{ ok: boolean; erro?: string }>;

  criarConta: (dados: Partial<ContaFixa>) => Promise<void>;
  editarConta: (id: string, dados: Partial<ContaFixa>) => Promise<void>;
  excluirConta: (id: string) => Promise<void>;

  trocarPlano: (plano: PlanoAssinatura) => Promise<{ ok: boolean; erro?: string }>;
  cancelarAssinatura: () => Promise<{ ok: boolean; erro?: string }>;
  reativarAssinatura: () => Promise<{ ok: boolean; erro?: string }>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Erro na requisição.");
  return data as T;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([]);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);

  const recarregarTudo = useCallback(async () => {
    setCarregando(true);
    try {
      const [me, emp, prods, nts, movs, notifs, contas, assin] = await Promise.all([
        fetch("/api/auth/me").then((r) => (r.ok ? r.json() : { usuario: null })),
        fetchJson<Empresa>("/api/empresa"),
        fetchJson<Produto[]>("/api/produtos"),
        fetchJson<NotaFiscal[]>("/api/notas"),
        fetchJson<Movimentacao[]>("/api/movimentacoes"),
        fetchJson<Notificacao[]>("/api/notificacoes"),
        fetchJson<ContaFixa[]>("/api/contas"),
        fetchJson<Assinatura>("/api/assinatura"),
      ]);
      setUsuario(me.usuario);
      setEmpresa(emp);
      setProdutos(prods);
      setNotas(nts);
      setMovimentacoes(movs);
      setNotificacoes(notifs);
      setContasFixas(contas);
      setAssinatura(assin);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { recarregarTudo(); }, [recarregarTudo]);

  const criarProduto: AppContextValue["criarProduto"] = async (dados) => {
    const novo = await fetchJson<Produto>("/api/produtos", { method: "POST", body: JSON.stringify(dados) });
    setProdutos((ps) => [...ps, novo]);
  };

  const editarProduto: AppContextValue["editarProduto"] = async (id, dados) => {
    const atualizado = await fetchJson<Produto>(`/api/produtos/${id}`, { method: "PUT", body: JSON.stringify(dados) });
    setProdutos((ps) => ps.map((p) => (p.id === id ? atualizado : p)));
  };

  const excluirProduto: AppContextValue["excluirProduto"] = async (id) => {
    await fetchJson(`/api/produtos/${id}`, { method: "DELETE" });
    setProdutos((ps) => ps.filter((p) => p.id !== id));
  };

  const emitirNota: AppContextValue["emitirNota"] = async (payload) => {
    try {
      const nota = await fetchJson<NotaFiscal>("/api/notas", { method: "POST", body: JSON.stringify(payload) });
      setNotas((ns) => [nota, ...ns]);
      // baixa otimista do estoque local (só quando a nota foi autorizada —
      // a origem da verdade já foi atualizada no servidor)
      if (nota.statusFiscal === "autorizada") {
        setProdutos((ps) => ps.map((p) => {
          const item = payload.itens.find((i) => i.produtoId === p.id);
          return item ? { ...p, quantidade: Math.max(0, p.quantidade - item.quantidade) } : p;
        }));
      }
      fetchJson<Notificacao[]>("/api/notificacoes").then(setNotificacoes);
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e instanceof Error ? e.message : "Erro ao emitir a nota." };
    }
  };

  const registrarMovimentacao: AppContextValue["registrarMovimentacao"] = async (dados) => {
    try {
      const mov = await fetchJson<Movimentacao>("/api/movimentacoes", { method: "POST", body: JSON.stringify(dados) });
      setMovimentacoes((ms) => [mov, ...ms]);
      setProdutos((ps) => ps.map((p) => p.id === dados.produtoId
        ? { ...p, quantidade: dados.tipo === "entrada" ? p.quantidade + dados.quantidade : Math.max(0, p.quantidade - dados.quantidade) }
        : p));
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e instanceof Error ? e.message : "Erro ao registrar movimentação." };
    }
  };

  const marcarNotificacaoLida: AppContextValue["marcarNotificacaoLida"] = async (id) => {
    setNotificacoes((ns) => ns.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    await fetchJson(`/api/notificacoes/${id}`, { method: "PATCH" });
  };

  const marcarTodasLidas: AppContextValue["marcarTodasLidas"] = async () => {
    setNotificacoes((ns) => ns.map((n) => ({ ...n, lida: true })));
    await fetchJson("/api/notificacoes", { method: "PATCH" });
  };

  const salvarDadosFiscais: AppContextValue["salvarDadosFiscais"] = async (dados) => {
    try {
      const atualizada = await fetchJson<Empresa>("/api/empresa", { method: "PATCH", body: JSON.stringify(dados) });
      setEmpresa(atualizada);
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e instanceof Error ? e.message : "Erro ao salvar dados fiscais." };
    }
  };

  const criarConta: AppContextValue["criarConta"] = async (dados) => {
    const nova = await fetchJson<ContaFixa>("/api/contas", { method: "POST", body: JSON.stringify(dados) });
    setContasFixas((cs) => [...cs, nova].sort((a, b) => a.diaVencimento - b.diaVencimento));
  };

  const editarConta: AppContextValue["editarConta"] = async (id, dados) => {
    const atualizada = await fetchJson<ContaFixa>(`/api/contas/${id}`, { method: "PUT", body: JSON.stringify(dados) });
    setContasFixas((cs) => cs.map((c) => (c.id === id ? atualizada : c)));
  };

  const excluirConta: AppContextValue["excluirConta"] = async (id) => {
    await fetchJson(`/api/contas/${id}`, { method: "DELETE" });
    setContasFixas((cs) => cs.filter((c) => c.id !== id));
  };

  const trocarPlano: AppContextValue["trocarPlano"] = async (plano) => {
    try {
      const atualizada = await fetchJson<Assinatura>("/api/assinatura", { method: "PATCH", body: JSON.stringify({ acao: "trocar-plano", plano }) });
      setAssinatura(atualizada);
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e instanceof Error ? e.message : "Erro ao trocar de plano." };
    }
  };

  const cancelarAssinatura: AppContextValue["cancelarAssinatura"] = async () => {
    try {
      const atualizada = await fetchJson<Assinatura>("/api/assinatura", { method: "PATCH", body: JSON.stringify({ acao: "cancelar" }) });
      setAssinatura(atualizada);
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e instanceof Error ? e.message : "Erro ao cancelar a assinatura." };
    }
  };

  const reativarAssinatura: AppContextValue["reativarAssinatura"] = async () => {
    try {
      const atualizada = await fetchJson<Assinatura>("/api/assinatura", { method: "PATCH", body: JSON.stringify({ acao: "reativar" }) });
      setAssinatura(atualizada);
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e instanceof Error ? e.message : "Erro ao reativar a assinatura." };
    }
  };

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <AppContext.Provider value={{
      carregando, usuario, empresa, produtos, notas, movimentacoes, notificacoes, contasFixas, assinatura, naoLidas,
      recarregarTudo, definirUsuario: setUsuario,
      criarProduto, editarProduto, excluirProduto,
      emitirNota, registrarMovimentacao,
      marcarNotificacaoLida, marcarTodasLidas,
      salvarDadosFiscais,
      criarConta, editarConta, excluirConta,
      trocarPlano, cancelarAssinatura, reativarAssinatura,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp precisa ser usado dentro de <AppProvider>.");
  return ctx;
}
