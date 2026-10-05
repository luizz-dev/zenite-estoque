// Destino: src/app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { obterUsuarioIdDaSessao } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import { C } from "@/lib/constants";

// Envolve todas as páginas internas. Verifica sessão E assinatura ativa
// antes de renderizar — sem uma das duas, não entra. A própria página
// "/assinatura" é a exceção: precisa ficar acessível mesmo sem assinatura
// ativa, senão quem cancelar nunca consegue reativar.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) redirect("/login");

  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";

  if (pathname !== "/assinatura") {
    const assinatura = await prisma.assinatura.findUnique({ where: { usuarioId } });
    if (!assinatura || assinatura.status !== "ativa") {
      redirect("/assinatura");
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}