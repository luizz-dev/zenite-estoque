"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { C, TONE } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BtnGhost } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/context/AppContext";
import type { TipoNotificacao } from "@/lib/types";

const TIPO_INFO: Record<TipoNotificacao, { label: string; tone: "amber" | "cyan" | "purple" | "green" }> = {
  estoque: { label: "Estoque", tone: "amber" },
  fiscal: { label: "Fiscal", tone: "cyan" },
  mei: { label: "MEI", tone: "purple" },
  sistema: { label: "Sistema", tone: "green" },
};

export default function AlertasPage() {
  const { notificacoes, naoLidas, marcarNotificacaoLida, marcarTodasLidas } = useApp();
  const [filtro, setFiltro] = useState("todos");

  const filtros = [
    { k: "todos", l: "Todos", count: notificacoes.length },
    { k: "nao-lidas", l: "Não lidas", count: naoLidas },
    { k: "estoque", l: "Estoque", count: notificacoes.filter((n) => n.tipo === "estoque").length },
    { k: "fiscal", l: "Fiscal", count: notificacoes.filter((n) => n.tipo === "fiscal").length },
    { k: "mei", l: "MEI", count: notificacoes.filter((n) => n.tipo === "mei").length },
    { k: "sistema", l: "Sistema", count: notificacoes.filter((n) => n.tipo === "sistema").length },
  ];

  const filtrados = notificacoes
    .filter((n) => filtro === "todos" || (filtro === "nao-lidas" ? !n.lida : n.tipo === filtro))
    .sort((a, b) => (a.lida === b.lida ? 0 : a.lida ? 1 : -1));

  return (
    <div>
      <Topbar titulo="Alertas" sub="Central de notificações" />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {filtros.map((f) => (
              <button key={f.k} onClick={() => setFiltro(f.k)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: `1px solid ${C.border}`,
                fontSize: 14.5, fontWeight: 500, cursor: "pointer", background: filtro === f.k ? C.purple1 : "rgba(255,255,255,0.02)", color: filtro === f.k ? C.white : C.textSec,
              }}>
                {f.l}
                {f.count > 0 && <span style={{ fontSize: 14.5, padding: "2px 6px", borderRadius: 999, background: filtro === f.k ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)", color: filtro === f.k ? C.white : C.textMuted }}>{f.count}</span>}
              </button>
            ))}
          </div>
          {naoLidas > 0 && <BtnGhost icon={<Check size={19} />} onClick={marcarTodasLidas}>Marcar todas como lidas</BtnGhost>}
        </div>

        {filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.textMuted, fontSize: 14.5 }}>Nenhuma notificação encontrada para esse filtro.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtrados.map((n) => {
              const info = TIPO_INFO[n.tipo];
              const tone = TONE[info.tone];
              return (
                <div key={n.id} onClick={() => !n.lida && marcarNotificacaoLida(n.id)} style={{
                  display: "flex", gap: 12, alignItems: "flex-start", position: "relative",
                  border: `1px solid ${n.lida ? C.border : "rgba(72,55,232,0.3)"}`, background: n.lida ? "rgba(255,255,255,0.015)" : "rgba(72,55,232,0.07)",
                  borderRadius: 12, padding: "14px 16px 14px 22px", cursor: n.lida ? "default" : "pointer",
                }}>
                  {!n.lida && <span style={{ position: "absolute", left: 8, top: 20, width: 6, height: 6, borderRadius: "50%", background: C.purple1 }} />}
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: tone.bg, border: `1px solid ${tone.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: tone.color }}>
                    <AlertTriangle size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                      <p style={{ color: C.white, fontSize: 16.5, fontWeight: n.lida ? 500 : 700, margin: 0 }}>{n.titulo}</p>
                      <span style={{ color: C.textMuted, fontSize: 14, whiteSpace: "nowrap" }}>{new Date(n.criadoEm).toLocaleString("pt-BR")}</span>
                    </div>
                    <p style={{ color: C.textSec, fontSize: 14.5, margin: "4px 0 0", lineHeight: 1.5 }}>{n.descricao}</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                      <Badge tone={info.tone}>{info.label}</Badge>
                      {n.prioridade === "alta" && <Badge tone="red">Prioridade alta</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
