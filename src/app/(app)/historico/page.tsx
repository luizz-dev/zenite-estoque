"use client";

import { useMemo, useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { C, STATUS_FISCAL_INFO } from "@/lib/constants";
import { FORMAS_PAGAMENTO } from "@/lib/constants";
import { brl } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/context/AppContext";
import type { StatusFiscal } from "@/lib/types";

type Evento =
  | { tipo: "entrada" | "saida"; id: string; item: string; qtd: number; motivo?: string | null; observacao?: string | null; data: string }
  | { tipo: "nfe"; id: string; numero: number; itens: { nome: string; sku: string; ncm: string; cfop: string; quantidade: number; valorUnitario: number }[]; valorTotal: number; destinatarioNome: string; destinatarioDoc: string; destinatarioUf: string; formaPagamento: string; statusFiscal: StatusFiscal; motivoRejeicao?: string | null; data: string };

export default function HistoricoPage() {
  const { movimentacoes, notas } = useApp();
  const [filtro, setFiltro] = useState<"todos" | "entrada" | "saida" | "nfe">("todos");
  const [expandido, setExpandido] = useState<Set<string>>(new Set());
  const toggleExpandir = (id: string) => setExpandido((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const eventos: Evento[] = useMemo(() => {
    const movs: Evento[] = movimentacoes.map((m) => ({ tipo: m.tipo, id: m.id, item: m.item, qtd: m.quantidade, motivo: m.motivo, observacao: m.observacao, data: m.data }));
    const nfes: Evento[] = notas.map((n) => ({
      tipo: "nfe", id: n.id, numero: n.numero, itens: n.itens, valorTotal: n.valorTotal,
      destinatarioNome: n.destinatarioNome, destinatarioDoc: n.destinatarioDoc, destinatarioUf: n.destinatarioUf,
      formaPagamento: n.formaPagamento, statusFiscal: n.statusFiscal, motivoRejeicao: n.motivoRejeicao, data: n.emitidaEm,
    }));
    return [...movs, ...nfes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [movimentacoes, notas]);

  const exibidos = filtro === "todos" ? eventos : eventos.filter((e) => e.tipo === filtro);

  const infoTipo = { entrada: { label: "Entrada de Item", color: C.green, dot: "#4ADE80" }, saida: { label: "Saída de Item", color: C.cyanText, dot: C.cyan }, nfe: { label: "NF-e Emitida", color: C.purpleText, dot: C.purple1 } };

  return (
    <div>
      <Topbar titulo="Histórico de Movimentações" />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.textSec, fontSize: 18 }}><Filter size={18} /> Filtrar por tipo</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {([["todos", "Todos"], ["entrada", "Entradas"], ["saida", "Saídas"], ["nfe", "Notas Fiscais"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFiltro(k)} style={{
                padding: "7px 14px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 14.5, fontWeight: 500, cursor: "pointer",
                background: filtro === k ? C.purple1 : "rgba(255,255,255,0.02)", color: filtro === k ? C.white : C.textSec,
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {exibidos.length === 0 && <p style={{ color: C.textMuted, fontSize: 15, textAlign: "center", padding: "30px 0" }}>Nenhuma movimentação para esse filtro.</p>}
          {exibidos.map((ev, idx) => {
            const info = infoTipo[ev.tipo];
            const isNfe = ev.tipo === "nfe";
            const isOpen = expandido.has(ev.id);
            const qtdTotal = isNfe ? ev.itens.reduce((a, i) => a + i.quantidade, 0) : ev.qtd;
            return (
              <div key={ev.id} style={{ display: "flex", gap: 14, paddingBottom: idx < exibidos.length - 1 ? 18 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: info.dot, marginTop: 14, boxShadow: `0 0 0 3px ${C.card}` }} />
                  {idx < exibidos.length - 1 && <span style={{ flex: 1, width: 1, background: C.border, marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.015)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", cursor: isNfe ? "pointer" : "default" }}
                  onClick={() => isNfe && toggleExpandir(ev.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <p style={{ color: C.white, fontSize: 16.5, fontWeight: 500, margin: 0, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {isNfe ? `NF-e #${String(ev.numero).padStart(5, "0")}` : ev.item}
                        {qtdTotal != null && <span style={{ color: C.textSec, fontWeight: 400 }}> ({qtdTotal} un.)</span>}
                        {isNfe && <Badge tone="purple">{ev.itens.length} produto{ev.itens.length > 1 ? "s" : ""}</Badge>}
                        {isNfe && <Badge tone={(STATUS_FISCAL_INFO[ev.statusFiscal] ?? STATUS_FISCAL_INFO.autorizada).tone}>{(STATUS_FISCAL_INFO[ev.statusFiscal] ?? STATUS_FISCAL_INFO.autorizada).label}</Badge>}
                      </p>
                      <p style={{ color: info.color, fontSize: 14.5, fontWeight: 500, margin: "2px 0 0" }}>
                        {info.label}{isNfe && ` · ${brl(ev.valorTotal)}`}{!isNfe && ev.motivo && ` · ${ev.motivo}`}
                      </p>
                      {!isNfe && ev.observacao && <p style={{ color: C.textMuted, fontSize: 13, margin: "3px 0 0" }}>{ev.observacao}</p>}
                      {isNfe && ev.statusFiscal === "rejeitada" && ev.motivoRejeicao && (
                        <p style={{ color: C.red, fontSize: 13, margin: "3px 0 0" }}>{ev.motivoRejeicao}</p>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <p style={{ color: C.textMuted, fontSize: 16, margin: 0 }}>{new Date(ev.data).toLocaleString("pt-BR")}</p>
                      {isNfe && <span style={{ color: C.textMuted, display: "flex", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><ChevronDown size={16} /></span>}
                    </div>
                  </div>

                  {isNfe && isOpen && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12, fontSize: 16 }}>
                        <div><span style={{ color: C.textMuted }}>Destinatário: </span><span style={{ color: C.white }}>{ev.destinatarioNome}</span></div>
                        <div><span style={{ color: C.textMuted }}>Doc.: </span><span style={{ color: C.white }}>{ev.destinatarioDoc}</span></div>
                        <div><span style={{ color: C.textMuted }}>UF destino: </span><span style={{ color: C.white }}>{ev.destinatarioUf}</span></div>
                        <div><span style={{ color: C.textMuted }}>Pagamento: </span><span style={{ color: C.white }}>{FORMAS_PAGAMENTO.find((f) => f.v === ev.formaPagamento)?.l || "—"}</span></div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {ev.itens.map((it, i) => (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 60px 90px 90px", gap: 8, fontSize: 15, padding: "10px 10px", background: C.cardInner, borderRadius: 8 }}>
                            <span style={{ color: C.white }}>{it.nome} <span style={{ color: C.textMuted, fontSize: 14.5 }}>NCM {it.ncm} · CFOP {it.cfop}</span></span>
                            <span style={{ color: C.textSec, textAlign: "center" }}>{it.quantidade} un.</span>
                            <span style={{ color: C.textSec, textAlign: "right" }}>{brl(it.valorUnitario)}</span>
                            <span style={{ color: C.white, fontWeight: 600, textAlign: "right" }}>{brl(it.quantidade * it.valorUnitario)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
