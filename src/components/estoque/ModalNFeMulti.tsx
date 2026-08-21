"use client";

import { useMemo, useState } from "react";
import { FileText, Search, Plus, Trash2, X, Info, MapPin, CreditCard, ShieldCheck, AlertTriangle, Check } from "lucide-react";
import { C } from "@/lib/constants";
import { FORMAS_PAGAMENTO, CSOSN_OPTS, UFS, EMPRESA } from "@/lib/constants";
import { getCfop, brl } from "@/lib/utils";
import { Input, Select, FieldLabel } from "@/components/ui/Input";
import { BtnPrimary, BtnGhost, BtnIcon } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import type { Produto, Destinatario, EnderecoEntrega } from "@/lib/types";

interface ItemCarrinho {
  produtoId: string; nome: string; sku: string; ncm: string; estoqueMax: number;
  qtd: number; valorUnit: number; cfop: string | null;
}

export function ModalNFeMulti({ itensIniciais, onClose }: { itensIniciais: Produto[]; onClose: () => void }) {
  const { produtos, empresa, emitirNota } = useApp();
  const ufEmpresa = empresa?.uf || EMPRESA.uf;

  const [itens, setItens] = useState<ItemCarrinho[]>(() =>
    itensIniciais.map((p) => ({ produtoId: p.id, nome: p.nome, sku: p.sku, ncm: p.ncm, estoqueMax: p.quantidade, qtd: 1, valorUnit: p.precoVenda, cfop: null }))
  );
  const [busca, setBusca] = useState("");
  const [destinatario, setDestinatario] = useState<Destinatario>({ tipo: "PF", doc: "", nome: "", ie: "", uf: ufEmpresa });
  const [entregaDiferente, setEntregaDiferente] = useState(false);
  const [endereco, setEndereco] = useState<EnderecoEntrega>({ logradouro: "", numero: "", bairro: "", cidade: "", uf: ufEmpresa, cep: "" });
  const [csosn, setCsosn] = useState("102");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cfopAuto = getCfop(destinatario.uf, ufEmpresa);

  const sugestoes = useMemo(() => {
    if (!busca.trim()) return [];
    const q = busca.toLowerCase();
    const idsNoCarrinho = new Set(itens.map((i) => i.produtoId));
    return produtos.filter((p) => p.quantidade > 0 && !idsNoCarrinho.has(p.id) && (p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))).slice(0, 5);
  }, [busca, itens, produtos]);

  const addItem = (p: Produto) => {
    setItens((prev) => [...prev, { produtoId: p.id, nome: p.nome, sku: p.sku, ncm: p.ncm, estoqueMax: p.quantidade, qtd: 1, valorUnit: p.precoVenda, cfop: null }]);
    setBusca("");
  };
  const removeItem = (id: string) => setItens((prev) => prev.filter((i) => i.produtoId !== id));
  const setQtd = (id: string, qtd: number) => setItens((prev) => prev.map((i) => (i.produtoId === id ? { ...i, qtd: Math.max(1, Math.min(qtd || 1, i.estoqueMax)) } : i)));

  const total = itens.reduce((a, i) => a + i.qtd * i.valorUnit, 0);
  const csosnInfo = CSOSN_OPTS.find((c) => c.v === csosn);

  const confirmar = async () => {
    if (itens.length === 0) return setErro("Adicione ao menos um produto à nota.");
    if (!destinatario.doc.trim()) return setErro("Informe o CPF/CNPJ do destinatário.");
    if (!destinatario.nome.trim()) return setErro("Informe o nome ou razão social do destinatário.");
    if (destinatario.tipo === "PJ" && !destinatario.ie?.trim()) return setErro("Informe a Inscrição Estadual do destinatário (PJ).");
    if (!formaPagamento) return setErro("Selecione a forma de pagamento.");
    setErro("");
    setEnviando(true);
    const resultado = await emitirNota({
      destinatario, endereco: entregaDiferente ? endereco : null, csosn, formaPagamento,
      itens: itens.map((i) => ({ produtoId: i.produtoId, nome: i.nome, sku: i.sku, ncm: i.ncm, cfop: i.cfop || cfopAuto, quantidade: i.qtd, valorUnitario: i.valorUnit })),
    });
    setEnviando(false);
    if (resultado.ok) onClose();
    else setErro(resultado.erro || "Erro ao emitir a nota.");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 20, width: "100%", maxWidth: 720, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: `linear-gradient(135deg,${C.purple2},${C.purple1})`, display: "flex", alignItems: "center", justifyContent: "center", color: C.white }}>
              <FileText size={17} />
            </div>
            <div>
              <p style={{ color: C.white, fontSize: 15, fontWeight: 700, margin: 0 }}>Emitir Nota Fiscal</p>
              <p style={{ color: C.textMuted, fontSize: 13.5, margin: 0 }}>Aceita múltiplos produtos, de categorias diferentes</p>
            </div>
          </div>
          <BtnIcon onClick={onClose}><X size={16} /></BtnIcon>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18, maxHeight: "64vh", overflowY: "auto" }}>
          {/* Itens */}
          <div>
            <FieldLabel>Produtos desta nota <span style={{ color: C.red }}>*</span></FieldLabel>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted, display: "flex" }}><Search size={15} /></span>
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto por nome ou SKU..." style={{ paddingLeft: 32 }} />
              {sugestoes.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 10, overflow: "hidden" }}>
                  {sugestoes.map((p) => (
                    <div key={p.id} onClick={() => addItem(p)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", cursor: "pointer" }}>
                      <div>
                        <p style={{ color: C.white, fontSize: 14.5, fontWeight: 500, margin: 0 }}>{p.nome}</p>
                        <p style={{ color: C.textMuted, fontSize: 13, margin: "1px 0 0" }}>SKU {p.sku} · {p.quantidade} un. · NCM {p.ncm}</p>
                      </div>
                      <span style={{ color: C.purpleText, display: "flex" }}><Plus size={15} /></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {itens.length === 0 ? (
              <div style={{ border: `1px dashed ${C.border}`, borderRadius: 12, padding: 22, textAlign: "center", color: C.textMuted, fontSize: 14.5 }}>
                Nenhum produto adicionado. Busque acima para incluir peças (podem ser de tipos diferentes) na mesma nota.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {itens.map((i) => (
                  <div key={i.produtoId} style={{ display: "grid", gridTemplateColumns: "1.6fr 60px 90px 90px 32px", gap: 8, alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 10px" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: C.white, fontSize: 14.5, fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.nome}</p>
                      <p style={{ color: C.textMuted, fontSize: 13, margin: "1px 0 0" }}>SKU {i.sku} · NCM {i.ncm}</p>
                    </div>
                    <input type="number" min={1} max={i.estoqueMax} value={i.qtd} onChange={(e) => setQtd(i.produtoId, +e.target.value)}
                      style={{ background: C.cardInner, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", fontSize: 14.5, color: C.white, textAlign: "center" }} />
                    <div style={{ fontSize: 14, color: C.textSec, textAlign: "right" }}>{brl(i.valorUnit)}</div>
                    <div style={{ fontSize: 14, color: C.white, fontWeight: 600, textAlign: "right" }}>{brl(i.qtd * i.valorUnit)}</div>
                    <BtnIcon tone="danger" onClick={() => removeItem(i.produtoId)}><Trash2 size={13} /></BtnIcon>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: C.border }} />

          {/* Destinatário */}
          <div>
            <FieldLabel>Destinatário <span style={{ color: C.red }}>*</span></FieldLabel>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(["PF", "PJ"] as const).map((t) => (
                <button key={t} onClick={() => setDestinatario((d) => ({ ...d, tipo: t }))}
                  style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${destinatario.tipo === t ? C.purple1 : C.border}`, cursor: "pointer", fontSize: 13, fontWeight: 600, background: destinatario.tipo === t ? "rgba(72,55,232,0.2)" : "rgba(255,255,255,0.02)", color: destinatario.tipo === t ? C.purpleText : C.textSec }}>
                  {t === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10, marginBottom: 10 }}>
              <Input value={destinatario.doc} onChange={(e) => setDestinatario((d) => ({ ...d, doc: e.target.value }))} placeholder={destinatario.tipo === "PF" ? "CPF" : "CNPJ"} />
              <Input value={destinatario.nome} onChange={(e) => setDestinatario((d) => ({ ...d, nome: e.target.value }))} placeholder={destinatario.tipo === "PF" ? "Nome completo" : "Razão social"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: destinatario.tipo === "PJ" ? "1fr 100px" : "100px", gap: 10 }}>
              {destinatario.tipo === "PJ" && <Input value={destinatario.ie} onChange={(e) => setDestinatario((d) => ({ ...d, ie: e.target.value }))} placeholder="Inscrição Estadual" />}
              <Select value={destinatario.uf} onChange={(e) => setDestinatario((d) => ({ ...d, uf: e.target.value }))}>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </Select>
            </div>
            <p style={{ color: C.textMuted, fontSize: 13, margin: "8px 0 0", display: "flex", alignItems: "center", gap: 5 }}>
              <Info size={13} /> Operação {destinatario.uf === ufEmpresa ? `interna (${ufEmpresa})` : "interestadual"} → CFOP sugerido <strong style={{ color: C.cyanText }}>{cfopAuto}</strong>.
            </p>
          </div>

          <div style={{ height: 1, background: C.border }} />

          {/* Entrega */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: entregaDiferente ? 10 : 0 }}>
              <input type="checkbox" checked={entregaDiferente} onChange={(e) => setEntregaDiferente(e.target.checked)} style={{ accentColor: C.purple1 }} />
              <span style={{ color: C.textSec, fontSize: 13.5, display: "flex", alignItems: "center", gap: 5 }}><MapPin size={13} /> Entregar em endereço diferente</span>
            </label>
            {entregaDiferente && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <Input value={endereco.logradouro} onChange={(e) => setEndereco((v) => ({ ...v, logradouro: e.target.value }))} placeholder="Rua / Avenida" />
                <Input value={endereco.numero} onChange={(e) => setEndereco((v) => ({ ...v, numero: e.target.value }))} placeholder="Número" />
                <Input value={endereco.bairro} onChange={(e) => setEndereco((v) => ({ ...v, bairro: e.target.value }))} placeholder="Bairro" />
                <Input value={endereco.cidade} onChange={(e) => setEndereco((v) => ({ ...v, cidade: e.target.value }))} placeholder="Cidade" />
                <Select value={endereco.uf} onChange={(e) => setEndereco((v) => ({ ...v, uf: e.target.value }))}>{UFS.map((u) => <option key={u} value={u}>{u}</option>)}</Select>
                <Input value={endereco.cep} onChange={(e) => setEndereco((v) => ({ ...v, cep: e.target.value }))} placeholder="CEP" />
              </div>
            )}
          </div>

          <div style={{ height: 1, background: C.border }} />

          {/* Tributação + pagamento */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel>Tributação (CSOSN)</FieldLabel>
              <Select value={csosn} onChange={(e) => setCsosn(e.target.value)}>{CSOSN_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</Select>
              {csosnInfo && <p style={{ color: C.textMuted, fontSize: 13.5, margin: "6px 0 0" }}>{csosnInfo.nota}</p>}
            </div>
            <div>
              <FieldLabel>Forma de Pagamento <span style={{ color: C.red }}>*</span></FieldLabel>
              <Select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                <option value="">Selecione...</option>
                {FORMAS_PAGAMENTO.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
              </Select>
              <p style={{ color: C.textMuted, fontSize: 13.5, margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}><CreditCard size={13} /> Tag &lt;tPag&gt; da NF-e</p>
            </div>
          </div>

          <div style={{ borderRadius: 12, border: "1px solid rgba(0,180,216,0.22)", background: "rgba(0,180,216,0.06)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: C.cyan, display: "flex" }}><ShieldCheck size={16} /></span>
            <div>
              <p style={{ color: C.cyanText, fontSize: 13.5, fontWeight: 600, margin: 0 }}>Emissão autorizada para {empresa?.razaoSocial || EMPRESA.razaoSocial}</p>
              <p style={{ color: C.textMuted, fontSize: 13.5, margin: "2px 0 0" }}>{empresa?.regime || EMPRESA.regime}</p>
            </div>
          </div>

          {erro && (
            <div style={{ borderRadius: 12, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, color: C.red, fontSize: 13.5, fontWeight: 500 }}>
              <AlertTriangle size={15} /> {erro}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", borderTop: `1px solid ${C.border}` }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: 13.5, margin: 0 }}>Total ({itens.length} item{itens.length !== 1 ? "s" : ""})</p>
            <p style={{ color: C.green, fontSize: 19, fontWeight: 700, margin: 0 }}>{brl(total)}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
            <BtnPrimary icon={enviando ? undefined : <Check size={15} />} onClick={confirmar} disabled={enviando}>
              {enviando ? "Emitindo..." : "Confirmar Emissão"}
            </BtnPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}
