"use client";

import { C } from "@/lib/constants";
import { Topbar } from "@/components/layout/Topbar";

// Mostrado enquanto o AppContext ainda está buscando os dados da página
// (produtos, notas, contas, etc.) — evita a tela aparecer "quebrada"
// (vazia) por um instante antes dos dados chegarem.
export function PageLoading({ titulo, sub }: { titulo: string; sub?: string }) {
  return (
    <div className="zn-page-enter">
      <Topbar titulo={titulo} sub={sub} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", gap: 16 }}>
        <div className="zn-spinner" style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.purple1 }} />
        <p style={{ color: C.textMuted, fontSize: 14 }}>Carregando dados...</p>
      </div>
    </div>
  );
}