"use client";

import { useMemo, useState } from "react";
import { Filter, Info, Package, BarChart3, AlertTriangle, Trash2, Tag, ArrowUp, FileText, Pencil, ArrowUpDown } from "lucide-react";
import { C } from "@/lib/constants";
import { brl, pctMargem, getStatusEstoque } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { BtnPrimary, BtnGhost, BtnIcon } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/context/AppContext";
import { ModalNFeMulti } from "@/components/estoque/ModalNFeMulti";
import { ModalEditProduto } from "@/components/estoque/ModalEditProduto";
import { ModalExcluir } from "@/components/estoque/ModalExcluir";
import { ModalMovimentacao } from "@/components/estoque/ModalMovimentacao";
import type { Produto, StatusEstoque } from "@/lib/types";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/ui/Loading";

const POR_PAGINA = 5;
const TONE_STATUS: Record<StatusEstoque, "green" | "amber" | "red" | "muted"> = { ativo: "green", alerta: "amber", critico: "red", esgotado: "muted" };
const LABEL_STATUS: Record<StatusEstoque, string> = { ativo: "Ativo", alerta: "Alerta", critico: "Crítico", esgotado: "Esgotado" };

export default function EstoquePage() {
  const { produtos, empresa, carregando } = useApp();
  const router = useRouter();

  const [catFiltro, setCatFiltro] = useState("Todas");
  const [stFiltro, setStFiltro] = useState<"todos" | StatusEstoque>("todos");
  const [sortCol, setSortCol] = useState<keyof Produto>("nome");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [pagina, setPagina] = useState(1);

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [produtoAtivo, setProdutoAtivo] = useState<Produto | null>(null);
  const [modal, setModal] = useState<"nfe" | "edit" | "del" | "mov" | null>(null);
  const [itensNfe, setItensNfe] = useState<Produto[]>([]);

  const categorias = useMemo(() => ["Todas", ...new Set(produtos.map((p) => p.categoria))], [produtos]);

  const filtrados = useMemo(() => {
    const r = produtos.filter((p) => {
      const catOk = catFiltro === "Todas" || p.categoria === catFiltro;
      const stOk = stFiltro === "todos" || getStatusEstoque(p.quantidade) === stFiltro;
      return catOk && stOk;
    });
    return [...r].sort((a, b) => {
      const va = a[sortCol], vb = b[sortCol];
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return cmp * sortDir;
    });
  }, [produtos, catFiltro, stFiltro, sortCol, sortDir]);

  if (carregando) return <PageLoading titulo="Visualização do Estoque" />;

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const exibidos = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const ordenarPor = (col: keyof Produto) => {
    if (sortCol === col) setSortDir((d) => (d * -1) as 1 | -1);
    else { setSortCol(col); setSortDir(1); }
  };

  const toggleSel = (id: string) => setSelecionados((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const todosVisiveisSelecionados = exibidos.length > 0 && exibidos.every((p) => selecionados.has(p.id));
  const toggleSelAll = () => setSelecionados((prev) => {
    const n = new Set(prev);
    exibidos.forEach((p) => (todosVisiveisSelecionados ? n.delete(p.id) : n.add(p.id)));
    return n;
  });

  const abrirNfe = (produtosIniciais: Produto[]) => {
    if (!empresa?.configurada) { router.push("/perfil/dados-fiscais?motivo=nfe"); return; }
    setItensNfe(produtosIniciais);
    setModal("nfe");
  };

  const totalUn = produtos.reduce((a, p) => a + p.quantidade, 0);
  const valorTotal = produtos.reduce((a, p) => a + p.precoVenda * p.quantidade, 0);
  const alertas = produtos.filter((p) => p.quantidade > 0 && p.quantidade <= 8).length;
  const esgotados = produtos.filter((p) => p.quantidade === 0).length;

  const metricCards = [
    { l: "Unidades em Estoque", v: `${totalUn.toLocaleString("pt-BR")} un.`, sub: "Total de produtos ativos", icon: <Package size={22} />, glow: "rgba(72,55,232,0.18)" },
    { l: "Valor Total do Estoque", v: brl(valorTotal), sub: "Soma preço × quantidade", icon: <BarChart3 size={22} />, glow: "rgba(0,180,216,0.18)" },
    { l: "Itens com Alerta", v: `${alertas} produtos`, sub: "Quantidade ≤ 8 unidades", icon: <AlertTriangle size={22} />, glow: "rgba(245,124,0,0.18)" },
    { l: "Itens Esgotados", v: `${esgotados} produtos`, sub: "Quantidade = 0 no estoque", icon: <Trash2 size={22} />, glow: "rgba(248,113,113,0.18)" },
  ];

  return (
    <div>
      <Topbar titulo="Visualização do Estoque" sub="Estoque › Visualização" />

      {!empresa?.configurada && (
        <div style={{ borderRadius: 12, border: "1px solid rgba(255,169,77,0.3)", background: "rgba(255,169,77,0.08)", padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <p style={{ color: C.amber, fontSize: 15.5, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={15} /> Configure os dados fiscais da sua empresa para poder emitir notas fiscais.
          </p>
          <BtnGhost onClick={() => router.push("/perfil/dados-fiscais")}>Configurar agora</BtnGhost>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {metricCards.map((m, i) => (
          <Card key={i} style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -30, top: -30, width: 100, height: 100, borderRadius: "50%", background: m.glow, filter: "blur(20px)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p style={{ color: C.textSec, fontSize: 14, fontWeight: 500, margin: 0 }}>{m.l}</p>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "#9D8DF1" }}>{m.icon}</div>
            </div>
            <p style={{ color: C.white, fontSize: 22, fontWeight: 700, margin: "10px 0 2px" }}>{m.v}</p>
            <p style={{ color: C.textMuted, fontSize: 15.5, margin: 0 }}>{m.sub}</p>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: "18px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
              <Select value={stFiltro} onChange={(e) => { setStFiltro(e.target.value as typeof stFiltro); setPagina(1); }} style={{ width: 160 }}>
                <option value="todos">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="alerta">Alerta</option>
                <option value="critico">Crítico</option>
                <option value="esgotado">Esgotado</option>
              </Select>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {selecionados.size > 0 && <Badge tone="purple">{selecionados.size} selecionado{selecionados.size > 1 ? "s" : ""}</Badge>}
              <BtnGhost icon={<ArrowUpDown size={14} />} onClick={() => { setProdutoAtivo(null); setModal("mov"); }}>Movimentar Estoque</BtnGhost>
              <BtnPrimary icon={<FileText size={15} />} onClick={() => abrirNfe(produtos.filter((p) => selecionados.has(p.id) && p.quantidade > 0))}>
                {selecionados.size > 0 ? `Emitir NF-e (${selecionados.size} itens)` : "Emitir Nota Fiscal"}
              </BtnPrimary>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            <span style={{ color: C.textMuted, fontSize: 15, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}><Filter size={16} /> Categoria:</span>
            {categorias.map((c) => {
              const active = catFiltro === c;
              return (
                <button key={c} onClick={() => { setCatFiltro(c); setPagina(1); }} style={{
                  padding: "5px 14px", borderRadius: 8, border: `1px solid ${active ? "#4837E8" : C.border}`, fontSize: 14, fontWeight: 500, cursor: "pointer",
                  whiteSpace: "nowrap", background: active ? "rgba(72,55,232,0.2)" : "rgba(255,255,255,0.02)", color: active ? C.purpleText : C.textSec,
                }}>{c}</button>
              );
            })}
          </div>
          <p style={{ color: C.textMuted, fontSize: 14.5, margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
            <Info size={15} /> Marque várias peças (mesmo de categorias diferentes) e clique em &quot;Emitir NF-e&quot; para gerar uma única nota com todos os itens.
          </p>
        </div>
        <div style={{ height: 1, background: C.border, margin: "14px 0 0" }} />

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 16, borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: C.cardInner }}>
                <th style={{ padding: "12px 10px 12px 16px", width: 18 }}>
                  <input type="checkbox" checked={todosVisiveisSelecionados} onChange={toggleSelAll} style={{ accentColor: C.purple1 }} />
                </th>
                {([["nome", "Produto"], ["categoria", "Categoria"], ["quantidade", "Qtd. Estoque"], ["precoVenda", "Preço Venda"]] as const).map(([col, label]) => (
                  <th key={col} style={{ textAlign: "left", padding: "12px 10px" }}>
                    <button onClick={() => ordenarPor(col)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.04em", color: sortCol === col ? C.purpleText : C.textMuted }}>
                      {label}{sortCol === col && <span style={{ fontSize: 12 }}>{sortDir === 1 ? "▲" : "▼"}</span>}
                    </button>
                  </th>
                ))}
                <th style={{ textAlign: "left", padding: "12px 10px", fontSize: 14, textTransform: "uppercase", color: C.textMuted }}>Margem</th>
                <th style={{ textAlign: "left", padding: "12px 10px", fontSize: 14, textTransform: "uppercase", color: C.textMuted }}>Status</th>
                <th style={{ padding: "12px 16px 12px 10px", textAlign: "right", fontSize: 14, textTransform: "uppercase", color: C.textMuted }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {exibidos.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Nenhum produto encontrado com esses filtros.</td></tr>
              ) : exibidos.map((p) => {
                const status = getStatusEstoque(p.quantidade);
                const isChecked = selecionados.has(p.id);
                const margem = pctMargem(p.precoCusto, p.precoVenda);
                const qtdPct = Math.min(100, (p.quantidade / 80) * 100);
                const qtdColor = p.quantidade === 0 || p.quantidade <= 3 ? C.red : p.quantidade <= 8 ? C.amber : "#E2E8F5";
                const barColor = p.quantidade === 0 ? C.red : p.quantidade <= 8 ? C.amber : C.green;
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${C.border}`, background: isChecked ? "rgba(72,55,232,0.08)" : "transparent" }}>
                    <td style={{ padding: "11px 10px 11px 16px" }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSel(p.id)} style={{ accentColor: C.purple1 }} />
                    </td>
                    <td style={{ padding: "11px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(72,55,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.purpleText, flexShrink: 0 }}><Tag size={16} /></div>
                        <div>
                          <p style={{ color: C.white, fontWeight: 500, margin: 0, fontSize: 16 }}>{p.nome}</p>
                          <p style={{ color: C.textMuted, fontSize: 14, margin: "1px 0 0" }}>SKU: {p.sku} · NCM {p.ncm}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 10px", color: C.textSec }}>{p.categoria}</td>
                    <td style={{ padding: "11px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 44, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden", flexShrink: 0 }}>
                          <div style={{ height: "100%", width: `${qtdPct}%`, background: barColor, borderRadius: 99 }} />
                        </div>
                        <span style={{ color: qtdColor, fontWeight: 500 }}>{p.quantidade} un.</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 10px", color: "#E2E8F5", fontWeight: 500 }}>{brl(p.precoVenda)}</td>
                    <td style={{ padding: "11px 10px" }}>
                      <span style={{ color: +margem >= 40 ? C.green : +margem >= 25 ? C.amber : C.red, fontWeight: 500, fontSize: 14, display: "flex", alignItems: "center", gap: 3 }}>
                        <ArrowUp size={16} />{margem}%
                      </span>
                    </td>
                    <td style={{ padding: "11px 10px" }}><Badge tone={TONE_STATUS[status]}>{LABEL_STATUS[status]}</Badge></td>
                    <td style={{ padding: "11px 16px 11px 10px" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                        <BtnIcon tone="cyan" onClick={() => { setProdutoAtivo(p); setModal("mov"); }}><ArrowUpDown size={16} /></BtnIcon>
                        <BtnIcon tone="cyan" onClick={() => abrirNfe([p])}><FileText size={16} /></BtnIcon>
                        <BtnIcon onClick={() => { setProdutoAtivo(p); setModal("edit"); }}><Pencil size={16} /></BtnIcon>
                        <BtnIcon tone="danger" onClick={() => { setProdutoAtivo(p); setModal("del"); }}><Trash2 size={16} /></BtnIcon>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: `1px solid ${C.border}` }}>
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>Mostrando {exibidos.length} de {filtrados.length} produtos</p>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <BtnGhost onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1}>← Ant.</BtnGhost>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPagina(n)} style={{
                width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500,
                background: pagina === n ? C.purple1 : "transparent", color: pagina === n ? C.white : C.textMuted,
              }}>{n}</button>
            ))}
            <BtnGhost onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina >= totalPaginas}>Próx. →</BtnGhost>
          </div>
        </div>
      </Card>

      {modal === "nfe" && <ModalNFeMulti itensIniciais={itensNfe} onClose={() => { setModal(null); setSelecionados(new Set()); }} />}
      {modal === "edit" && produtoAtivo && <ModalEditProduto produto={produtoAtivo} onClose={() => setModal(null)} />}
      {modal === "del" && produtoAtivo && <ModalExcluir produto={produtoAtivo} onClose={() => setModal(null)} />}
      {modal === "mov" && <ModalMovimentacao produtoInicial={produtoAtivo} onClose={() => setModal(null)} />}
    </div>
  );
}
