"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Coins, Boxes, FileText, AlertTriangle, ArrowUp, ArrowDown, ExternalLink, Wallet } from "lucide-react";
import { C, STATUS_FISCAL_INFO } from "@/lib/constants";
import { MEI } from "@/lib/constants";
import { brl, pctVariacao, produtosComEstoqueBaixo, calcularLucroMes, ticketPorFormaPagamento } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BtnGhost } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/context/AppContext";
import Link from "next/link";

const BAR_COLORS = ["#7C6CF0", "#00B4D8", "#F57C00", "#A99AF5", "#4ADE80"];
const URL_GUIA_DAS = "https://www8.receita.fazenda.gov.br/SimplesNacional/aplicacoes.aspx?id=21";

function ChartTooltipTicket({ active, payload }: { active?: boolean; payload?: { payload: { forma: string; total: number; ticketMedio: number; qtd: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", fontSize: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
      <p style={{ color: C.white, margin: "0 0 4px", fontWeight: 700, fontSize: 17 }}>{d.forma}</p>
      <p style={{ color: C.textSec, margin: "2px 0" }}>Total no mês: <strong style={{ color: C.white }}>{brl(d.total)}</strong></p>
      <p style={{ color: C.textSec, margin: "2px 0" }}>Ticket médio: <strong style={{ color: C.white }}>{brl(d.ticketMedio)}</strong></p>
      <p style={{ color: C.textMuted, margin: "2px 0" }}>{d.qtd} venda{d.qtd > 1 ? "s" : ""}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { produtos, notas, contasFixas, naoLidas } = useApp();
  const [considerarContas, setConsiderarContas] = useState(true);

  const { lucroBruto, totalContas, lucroLiquido } = useMemo(
    () => calcularLucroMes(notas, produtos, contasFixas, considerarContas),
    [notas, produtos, contasFixas, considerarContas]
  );
  const lucroExibido = considerarContas ? lucroLiquido : lucroBruto;

  const dadosTicket = useMemo(() => ticketPorFormaPagamento(notas), [notas]);

  const totalUnidadesEstoque = produtos.reduce((a, p) => a + p.quantidade, 0);

  const metrics: { label: string; val: string; delta: string; pos?: boolean; neutral?: boolean; icon: ReactNode; glow: string }[] = [
    { label: "Faturamento do Mês", val: brl(MEI.faturamentoMes), delta: `+${pctVariacao(MEI.faturamentoMes, MEI.faturamentoMesAnterior)}% vs. mês anterior`, pos: true, icon: <Coins size={22} />, glow: "rgba(72,55,232,0.2)" },
    { label: "Total em Estoque", val: `${totalUnidadesEstoque} un.`, delta: `${produtos.length} produto${produtos.length !== 1 ? "s" : ""} cadastrado${produtos.length !== 1 ? "s" : ""}`, neutral: true, icon: <Boxes size={22} />, glow: "rgba(0,180,216,0.2)" },
    { label: "Notas Fiscais Emitidas", val: `${229 + notas.length}`, delta: "+12,8% este mês", pos: true, icon: <FileText size={22} />, glow: "rgba(87,57,196,0.2)" },
    { label: "Alertas Ativos", val: `${naoLidas}`, delta: naoLidas > 0 ? `${naoLidas} pendente${naoLidas > 1 ? "s" : ""}` : "Tudo em dia", pos: naoLidas === 0, icon: <AlertTriangle size={22} />, glow: "rgba(245,124,0,0.2)" },
  ];

  const pctLimite = Math.round((MEI.faturamentoAnualAcumulado / MEI.limiteAnualMEI) * 100);
  const toneLimite = pctLimite >= 85 ? "red" : pctLimite >= 60 ? "amber" : "purple";
  const restante = MEI.limiteAnualMEI - MEI.faturamentoAnualAcumulado;
  const baixoEstoque = produtosComEstoqueBaixo(produtos);

  return (
    <div className="zn-page-enter">
      <Topbar titulo="Dashboard" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {metrics.map((m, i) => (
          <Card key={i} style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -30, top: -30, width: 100, height: 100, borderRadius: "50%", background: m.glow, filter: "blur(20px)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p style={{ color: C.textSec, fontSize: 14, fontWeight: 500, margin: 0 }}>{m.label}</p>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "#9D8DF1" }}>{m.icon}</div>
            </div>
            <p style={{ color: C.white, fontSize: 26, fontWeight: 700, margin: "10px 0 0" }}>{m.val}</p>
            <p style={{ color: m.neutral ? C.textMuted : m.pos ? C.green : C.amber, fontSize: 14.5, fontWeight: 500, margin: "7px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
              {m.neutral ? <Boxes size={13} /> : m.pos ? <ArrowUp size={13.5} /> : <ArrowDown size={13.5} />} {m.delta}
            </p>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginTop: 14 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ color: C.white, fontSize: 20, fontWeight: 700, margin: 0 }}>Limite Anual do MEI</h3>
              <p style={{ color: C.textSec, fontSize: 16, margin: "2px 0 0" }}>Simples Nacional · Ano-calendário 2026</p>
            </div>
            <Badge tone={toneLimite}>{pctLimite}% utilizado</Badge>
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ color: C.white, fontSize: 18, fontWeight: 700 }}>{brl(MEI.faturamentoAnualAcumulado)}</span>
              <span style={{ color: C.textMuted, fontSize: 16 }}>de {brl(MEI.limiteAnualMEI)}</span>
            </div>
            <ProgressBar pct={pctLimite} tone={toneLimite as "purple" | "amber" | "red"} />
            <p style={{ color: C.textSec, fontSize: 16, margin: "10px 0 0", lineHeight: 1.55 }}>
              Restam <strong style={{ color: C.white }}>{brl(restante)}</strong> até o teto anual permitido para o MEI.
              {pctLimite >= 85 && " Atenção: você está próximo do limite — avalie o desenquadramento para ME."}
            </p>
            <a href={URL_GUIA_DAS} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginTop: 14 }}>
              <BtnGhost icon={<ExternalLink size={18} />} style={{ width: "100%" }}>Ver Guia do DAS (PGMEI)</BtnGhost>
            </a>
          </div>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: C.textSec, fontSize: 14, fontWeight: 500, margin: 0 }}>Este mês</p>
              <h3 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: "2px 0 0" }}>Lucro do Mês</h3>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: C.cyanText, flexShrink: 0 }}>
              <Wallet size={22} />
            </div>
          </div>
          <p style={{ color: lucroExibido >= 0 ? C.white : C.red, fontSize: 26, fontWeight: 700, margin: "16px 0 0" }}>{brl(lucroExibido)}</p>
          <p style={{ color: C.textMuted, fontSize: 14, fontWeight: 500, margin: "7px 0 16px" }}>
            (Preço de venda − preço de custo) dos itens vendidos{considerarContas ? " − contas fixas do mês" : ""}
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}>
            <input type="checkbox" checked={considerarContas} onChange={(e) => setConsiderarContas(e.target.checked)} style={{ accentColor: C.purple1, width: 15, height: 15, cursor: "pointer" }} />
            <span style={{ color: C.textSec, fontSize: 14 }}>Considerando as contas fixas ({brl(totalContas)})</span>
          </label>

          <Link href="/contas" style={{ textDecoration: "none" }}>
            <BtnGhost icon={<FileText size={18} />} style={{ width: "100%" }}>Gerenciar Contas Fixas</BtnGhost>
          </Link>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.9fr 1fr", gap: 14, marginTop: 14 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0 }}>Ticket Médio por Forma de Pagamento</h3>
              <p style={{ color: C.textSec, fontSize: 16, margin: "2px 0 0" }}>Comparativo do mês atual</p>
            </div>
          </div>
          <div style={{ width: "100%", height: 210, marginTop: 10 }}>
            {dadosTicket.length === 0 ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 13.5 }}>
                Nenhuma venda registrada este mês ainda.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosTicket} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.05} />
                  <XAxis dataKey="forma" tick={{ fill: C.textMuted, fontSize: 14.5 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltipTicket />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {dadosTicket.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0 }}>Alertas de Estoque</h3>
            <Link href="/alertas" style={{ color: C.amber, display: "flex" }}><AlertTriangle size={22} /></Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            {baixoEstoque.length === 0 && <p style={{ color: C.textMuted, fontSize: 14.5 }}>Nenhum item com estoque baixo agora.</p>}
            {baixoEstoque.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(245,124,0,0.18)", background: "rgba(245,124,0,0.04)", borderRadius: 12, padding: "10px 12px" }}>
                <div>
                  <p style={{ color: C.white, fontSize: 15.5, fontWeight: 500, margin: 0 }}>{p.nome}</p>
                  <p style={{ color: C.textMuted, fontSize: 14, margin: "2px 0 0" }}>SKU {p.sku}</p>
                </div>
                <Badge tone="amber">{p.quantidade} un.</Badge>
              </div>
            ))}
          </div>
          <Link href="/alertas" style={{ display: "block", marginTop: 16, textAlign: "center", color: C.cyanText, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Ver todos os alertas →</Link>
        </Card>
      </div>

      <Card style={{ marginTop: 14 }}>
        <h3 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Notas Fiscais Recentes</h3>
        <table style={{ width: "100%", fontSize: 15.5, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: C.textMuted, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              <th style={{ textAlign: "left", paddingBottom: 10, fontWeight: 500 }}>Nota</th>
              <th style={{ textAlign: "left", paddingBottom: 10, fontWeight: 500 }}>Itens</th>
              <th style={{ textAlign: "left", paddingBottom: 10, fontWeight: 500 }}>Total</th>
              <th style={{ textAlign: "left", paddingBottom: 10, fontWeight: 500 }}>Situação Fiscal</th>
            </tr>
          </thead>
          <tbody>
            {notas.slice(0, 4).map((n) => {
              const info = STATUS_FISCAL_INFO[n.statusFiscal] ?? STATUS_FISCAL_INFO.autorizada;
              return (
                <tr key={n.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 0", color: "#E2E8F5" }}>NF-e #{String(n.numero).padStart(5, "0")}</td>
                  <td style={{ padding: "10px 0", color: C.textSec }}>{n.itens.length}</td>
                  <td style={{ padding: "10px 0", color: C.white, fontWeight: 500 }}>{brl(n.valorTotal)}</td>
                  <td style={{ padding: "10px 0" }}><Badge tone={info.tone}>{info.label}</Badge></td>
                </tr>
              );
            })}
            {notas.length === 0 && (
              <tr><td colSpan={4} style={{ padding: "20px 0", color: C.textMuted, textAlign: "center" }}>Nenhuma nota emitida ainda.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}