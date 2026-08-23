"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { C } from "@/lib/constants";
import { useApp } from "@/context/AppContext";

// Primeira letra do primeiro nome + primeira do segundo (se existir).
// Sem segundo nome, usa as duas primeiras letras do primeiro nome mesmo.
function iniciaisUsuario(nome?: string | null): string {
  const partes = (nome || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "US";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

export function Topbar({ titulo, sub }: { titulo: string; sub?: string }) {
  const { naoLidas, usuario } = useApp();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ color: C.white, fontSize: 28, fontWeight: 700, margin: 0 }}>{titulo}</h1>
        <p style={{ color: C.textMuted, fontSize: 16.5, margin: "4px 0 0", textTransform: "capitalize" }}>
          {sub || new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/alertas" style={{
          width: 46, height: 46, borderRadius: 9, background: C.card, border: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", color: C.textSec, position: "relative",
        }}>
          <Bell size={20} />
          {naoLidas > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 999, background: C.orange,
              color: C.white, fontSize: 10.5, fontWeight: 600, padding: "8px 6px", display: "flex", alignItems: "center",
              justifyContent: "center", border: `2px solid ${C.sidebar}`,
            }}>{naoLidas > 9 ? "9+" : naoLidas}</span>
          )}
        </Link>
        <Link href="/perfil" title="Perfil & Configurações" style={{
          width: 46, height: 46, borderRadius: 9, background: `linear-gradient(135deg,${C.purple2},${C.purple1})`,
          display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 14, fontWeight: 700,
          textDecoration: "none",
        }}>{iniciaisUsuario(usuario?.nome)}</Link>
      </div>
    </div>
  );
}