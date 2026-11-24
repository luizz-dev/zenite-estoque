"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Search, X, AlertTriangle } from "lucide-react";
import { C } from "@/lib/constants";
import { brl, MOTIVO_VENDA } from "@/lib/utils";
import { rotuloVariacao } from "@/lib/variacoes";
import { Input, Select, FieldLabel } from "@/components/ui/Input";
import { BtnPrimary, BtnGhost, BtnIcon } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import type { Produto } from "@/lib/types";

const MOTIVOS_SAIDA = [MOTIVO_VENDA, "Perda / Avaria", "Uso Interno", "Doação", "Ajuste de Inventário", "Devolução ao Fornecedor", "Outro"];
const MOTIVOS_ENTRADA = ["Reposição de Fornecedor", "Devolução de Cliente", "Ajuste de Inventário", "Outro"];

export function ModalMovimentacao({ produtoInicial, variacaoInicialId, onClose }: { produtoInicial: Produto | null; variacaoInicialId?: string; onClose: () => void }) {
  const { produtos, registrarMovimentacao } = useApp();
  const [tipo, setTipo] = useState<"saida" | "entrada">("saida");
  const [produtoId, setProdutoId] = useState(produtoInicial?.id || "");
  const [variacaoId, setVariacaoId] = useState(variacaoInicialId || "");
  const [busca, setBusca] = useState("");
  const [qtd, setQtd] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [obs, setObs] = useState("");
  // Valor total da venda digitado pelo usuário; null = usar preço de venda × quantidade.
  const [valorManual, setValorManual] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const produto = produtos.find((p) => p.id === produtoId) || null;
  const motivos = tipo === "saida" ? MOTIVOS_SAIDA : MOTIVOS_ENTRADA;

  // Estoque por variação: com mais de uma, o usuário escolhe tamanho/cor; com uma só, ela é usada direto.
  const variacoes = produto?.variacoes ?? [];
  const variacao = variacoes.find((v) => v.id === variacaoId) ?? (variacoes.length === 1 ? variacoes[0] : null);
  const ehVenda = tipo === "saida" && motivo === MOTIVO_VENDA;
  const valorPadrao = produto ? Math.round(produto.precoVenda * (Number(qtd) || 0) * 100) / 100 : 0;
  const valorVenda = valorManual !== null ? Number(valorManual) : valorPadrao;

  const sugestoes = useMemo(() => {
    if (!busca.trim()) return [];
    const q = busca.toLowerCase();
    return produtos.filter((p) => p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 5);
  }, [busca, produtos]);

  const confirmar = async () => {
    if (!produto) return setErro("Selecione um produto.");
    if (!variacao) return setErro("Selecione a variação (tamanho e cor).");
    if (!qtd || qtd <= 0) return setErro("Informe uma quantidade válida.");
    if (tipo === "saida" && qtd > variacao.quantidade) return setErro(`Estoque insuficiente (${rotuloVariacao(variacao) || "Única"}). Disponível: ${variacao.quantidade} un.`);
    if (!motivo) return setErro("Selecione o motivo da movimentação.");
    if (ehVenda && !(valorVenda > 0)) return setErro("Informe o valor da venda.");
    setErro("");
    setEnviando(true);
    const resultado = await registrarMovimentacao({ produtoId: produto.id, variacaoId: variacao.id, tipo, quantidade: Number(qtd), motivo, observacao: obs, ...(ehVenda ? { valor: valorVenda } : {}) });
    setEnviando(false);
    if (resultado.ok) onClose();
    else setErro(resultado.erro || "Erro ao registrar a movimentação.");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 20, width: "100%", maxWidth: 460, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(0,180,216,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: C.cyanText }}>
              <ArrowUpDown size={16} />
            </div>
            <div>
              <p style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: 0 }}>Movimentar Estoque</p>
              <p style={{ color: C.textMuted, fontSize: 14.5, margin: 0 }}>Ajuste manual de estoque — a NF-e da venda é emitida em Histórico</p>
            </div>
          </div>
          <BtnIcon onClick={onClose}><X size={16} /></BtnIcon>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {([["saida", "Dar Baixa (Saída)"], ["entrada", "Registrar Entrada"]] as const).map(([t, l]) => (
              <button key={t} onClick={() => { setTipo(t); setMotivo(""); setValorManual(null); }}
                style={{
                  flex: 1, padding: "9px 12px", borderRadius: 9, cursor: "pointer", fontSize: 13.5, fontWeight: 600,
                  border: `1px solid ${tipo === t ? (t === "saida" ? "rgba(248,113,113,0.4)" : "rgba(74,222,128,0.4)") : C.border}`,
                  background: tipo === t ? (t === "saida" ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.12)") : "rgba(255,255,255,0.02)",
                  color: tipo === t ? (t === "saida" ? C.red : C.green) : C.textSec,
                }}>{l}</button>
            ))}
          </div>

          <div>
            <FieldLabel>Produto <span style={{ color: C.red }}>*</span></FieldLabel>
            {produto ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px" }}>
                <div>
                  <p style={{ color: C.white, fontSize: 14, fontWeight: 500, margin: 0 }}>{produto.nome}</p>
                  <p style={{ color: C.textMuted, fontSize: 13.5, margin: "2px 0 0" }}>SKU {produto.sku} · {variacao ? `${variacao.quantidade} un. em estoque${rotuloVariacao(variacao) ? ` (${rotuloVariacao(variacao)})` : ""}` : `${produto.quantidade} un. no total`}</p>
                </div>
                <BtnIcon onClick={() => { setProdutoId(""); setVariacaoId(""); setValorManual(null); }}><X size={16} /></BtnIcon>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted, display: "flex" }}><Search size={15} /></span>
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." style={{ paddingLeft: 32 }} />
                {sugestoes.length > 0 && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 10, overflow: "hidden" }}>
                    {sugestoes.map((p) => (
                      <div key={p.id} onClick={() => { setProdutoId(p.id); setVariacaoId(""); setBusca(""); }} style={{ padding: "10px 12px", cursor: "pointer" }}>
                        <p style={{ color: C.white, fontSize: 14.5, fontWeight: 500, margin: 0 }}>{p.nome}</p>
                        <p style={{ color: C.textMuted, fontSize: 13, margin: "1px 0 0" }}>SKU {p.sku} · {p.quantidade} un.</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {produto && variacoes.length > 1 && (
            <div>
              <FieldLabel>Variação (tamanho / cor) <span style={{ color: C.red }}>*</span></FieldLabel>
              <Select value={variacao?.id ?? ""} onChange={(e) => { setVariacaoId(e.target.value); setValorManual(null); }}>
                <option value="">Selecione...</option>
                {variacoes.map((v) => (
                  <option key={v.id} value={v.id}>{rotuloVariacao(v) || "Única"} — {v.quantidade} un.</option>
                ))}
              </Select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10 }}>
            <div><FieldLabel>Quantidade <span style={{ color: C.red }}>*</span></FieldLabel><Input type="number" min={1} value={qtd} onChange={(e) => setQtd(+e.target.value)} /></div>
            <div>
              <FieldLabel>Motivo <span style={{ color: C.red }}>*</span></FieldLabel>
              <Select value={motivo} onChange={(e) => { setMotivo(e.target.value); setValorManual(null); }}>
                <option value="">Selecione...</option>
                {motivos.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>
          </div>

          {ehVenda && (
            <div>
              <FieldLabel>Valor total da venda (R$) <span style={{ color: C.red }}>*</span></FieldLabel>
              <Input type="number" min={0} step="0.01"
                value={valorManual !== null ? valorManual : String(valorPadrao)}
                onChange={(e) => setValorManual(e.target.value)} />
              <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>
                Sugerido: preço de venda × quantidade ({brl(valorPadrao)}). Altere se houve desconto. Esta venda entra no faturamento; depois você pode emitir a NF-e dela em Histórico.
              </p>
            </div>
          )}

          <div>
            <FieldLabel>Observação (opcional)</FieldLabel>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Detalhe o motivo, se necessário..."
              style={{ width: "100%", background: C.cardInner, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 13.5, color: C.white, height: 64, resize: "vertical", boxSizing: "border-box" }} />
          </div>

          {erro && (
            <div style={{ borderRadius: 12, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, color: C.red, fontSize: 13.5, fontWeight: 500 }}>
              <AlertTriangle size={15} /> {erro}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: `1px solid ${C.border}` }}>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimary icon={<ArrowUpDown size={14} />} onClick={confirmar} disabled={enviando}>
            {enviando ? "Salvando..." : tipo === "saida" ? "Confirmar Baixa" : "Confirmar Entrada"}
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
}