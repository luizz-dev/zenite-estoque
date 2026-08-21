import { redirect } from "next/navigation";
import { obterUsuarioIdDaSessao } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { C } from "@/lib/constants";

// Este layout envolve TODAS as páginas internas do Zênite (dashboard,
// estoque, alertas, histórico, ajuda, perfil). Ele roda no servidor e
// verifica a sessão antes de renderizar qualquer coisa — se não houver
// usuário logado, redireciona para /login sem chegar a mostrar o estoque.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
