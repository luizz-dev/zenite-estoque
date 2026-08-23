"use client";

import { useState } from "react";
import { AlertTriangle, Check, CalendarClock } from "lucide-react";
import { C, TONE } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BtnGhost } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/context/AppContext";
import { PageLoading } from "@/components/ui/Loading";
import type { TipoNotificacao } from "@/lib/types";

const TIPO_INFO: Record<TipoNotificacao, { label: string; tone: "amber" | "cyan" | "purple" | "green" }> = {
  estoque: { label: "Estoque", tone: "amber" },
  fiscal: { label: "Fiscal", tone: "cyan" },
  mei: { label: "MEI", tone: "purple" },
  sistema: { label: "Sistema", tone: "green" },
};

const POR_PAGINA = 7;

export default function AlertasPage() {
  const { notificacoes, naoLidas, marcarNotificacaoLida, marcarTodasLidas, alertasVencimento, carregando } = useApp();
  const [filtro, setFiltro] = useState("todos");
  const [pagina, setPagina] = useState(1);

  if (carregando) return <PageLoading titulo="Alertas" sub="Central de notificações" />;

  const mudarFiltro = (k: string) => { setFiltro(k); setPagina(1); };

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

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const paginados = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  // vencimentos de contas fixas só aparecem nos filtros "Todos" e "Não lidas"
  // (são avisos persistentes, não "pertencem" a nenhuma das outras categorias)
  const mostrarVencimentos = (filtro === "todos" || filtro === "nao-lidas") && alertasVencimento.length > 0;

  return (
    <div className="zn-page-enter">
      <Topbar titulo="Alertas" sub="Central de notificações" />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {filtros.map((f) => (
              <button key={f.k} onClick={() => mudarFiltro(f.k)} style={{
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

        {mostrarVencimentos && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {alertasVencimento.map((a) => (
              <div key={a.id} style={{
                display: "flex", gap: 12, alignItems: "flex-start", border: "1px solid rgba(255,169,77,0.3)",
                background: "rgba(255,169,77,0.07)", borderRadius: 12, padding: "14px 16px",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: TONE.amber.bg, border: `1px solid ${TONE.amber.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: TONE.amber.color }}>
                  <CalendarClock size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: C.white, fontSize: 16.5, fontWeight: 700, margin: 0 }}>{a.titulo}</p>
                  <p style={{ color: C.textSec, fontSize: 14.5, margin: "4px 0 0", lineHeight: 1.5 }}>{a.descricao}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                    <Badge tone="amber">Vencimento</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtrados.length === 0 && !mostrarVencimentos ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.textMuted, fontSize: 14.5 }}>Nenhuma notificação encontrada para esse filtro.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {paginados.map((n) => {
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

        {filtrados.length > POR_PAGINA && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>Mostrando {paginados.length} de {filtrados.length} notificações</p>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <BtnGhost onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual <= 1}>← Ant.</BtnGhost>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPagina(n)} style={{
                  width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500,
                  background: paginaAtual === n ? C.purple1 : "transparent", color: paginaAtual === n ? C.white : C.textMuted,
                }}>{n}</button>
              ))}
              <BtnGhost onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual >= totalPaginas}>Próx. →</BtnGhost>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}