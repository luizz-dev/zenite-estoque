"use client";

// Destino: src/components/estoque/ModalEditProduto.tsx
import { useMemo, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { C } from "@/lib/constants";
import { Input, FieldLabel } from "@/components/ui/Input";
import { BtnPrimary, BtnGhost, BtnIcon } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { EditorVariacoes, linhasParaEntrada, validarLinhas, type LinhaVariacao } from "@/components/estoque/EditorVariacoes";
import type { Produto } from "@/lib/types";

export function ModalEditProduto({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const { editarProduto, produtos } = useApp();
  const [form, setForm] = useState({ nome: produto.nome, sku: produto.sku, categoria: produto.categoria, ncm: produto.ncm, precoCusto: produto.precoCusto, precoVenda: produto.precoVenda });
  const [linhas, setLinhas] = useState<LinhaVariacao[]>(() =>
    (produto.variacoes ?? []).map((v) => ({ id: v.id, tamanho: v.tamanho, cor: v.cor, quantidade: String(v.quantidade) }))
  );
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const coresSugeridas = useMemo(
    () => Array.from(new Set(produtos.flatMap((p) => (p.variacoes ?? []).map((v) => v.cor)).filter((c) => c && c !== "Única"))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [produtos]
  );

  const salvar = async () => {
    const msg = validarLinhas(linhas);
    if (msg) return setErro(msg);
    setErro("");
    setSalvando(true);
    try {
      await editarProduto(produto.id, {
        ...form,
        precoVenda: Number(form.precoVenda),
        precoCusto: Number(form.precoCusto),
        variacoes: linhasParaEntrada(linhas),
      });
      onClose();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar o produto.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 20, width: "100%", maxWidth: 560, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: 0 }}>Editar Produto</p>
          <BtnIcon onClick={onClose}><X size={16} /></BtnIcon>
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "68vh", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}><FieldLabel>Nome do Produto</FieldLabel><Input value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
            <div><FieldLabel>SKU</FieldLabel><Input value={form.sku} onChange={(e) => set("sku", e.target.value)} /></div>
            <div><FieldLabel>Categoria</FieldLabel><Input value={form.categoria} onChange={(e) => set("categoria", e.target.value)} /></div>
            <div><FieldLabel>NCM</FieldLabel><Input value={form.ncm} onChange={(e) => set("ncm", e.target.value)} /></div>
            <div />
            <div><FieldLabel>Preço de Custo (R$)</FieldLabel><Input type="number" value={form.precoCusto} onChange={(e) => set("precoCusto", +e.target.value)} /></div>
            <div><FieldLabel>Preço de Venda (R$)</FieldLabel><Input type="number" value={form.precoVenda} onChange={(e) => set("precoVenda", +e.target.value)} /></div>
          </div>

          <div>
            <FieldLabel>Variações e estoque <span style={{ color: C.red }}>*</span></FieldLabel>
            <EditorVariacoes linhas={linhas} onChange={setLinhas} coresSugeridas={coresSugeridas} />
          </div>

          {erro && (
            <div style={{ borderRadius: 12, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, color: C.red, fontSize: 13.5, fontWeight: 500 }}>
              <AlertTriangle size={15} /> {erro}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: `1px solid ${C.border}` }}>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimary onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar Alterações"}</BtnPrimary>
        </div>
      </div>
    </div>
  );
}