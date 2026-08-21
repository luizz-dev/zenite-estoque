"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { C } from "@/lib/constants";
import { Input, FieldLabel } from "@/components/ui/Input";
import { BtnPrimary, BtnGhost, BtnIcon } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import type { Produto } from "@/lib/types";

export function ModalEditProduto({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const { editarProduto } = useApp();
  const [form, setForm] = useState({ ...produto });
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof Produto>(k: K, v: Produto[K]) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = async () => {
    setSalvando(true);
    await editarProduto(produto.id, { ...form, quantidade: Number(form.quantidade), precoVenda: Number(form.precoVenda), precoCusto: Number(form.precoCusto) });
    setSalvando(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 20, width: "100%", maxWidth: 480, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${C.border}` }}>
          <p style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: 0 }}>Editar Produto</p>
          <BtnIcon onClick={onClose}><X size={16} /></BtnIcon>
        </div>
        <div style={{ padding: "20px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}><FieldLabel>Nome do Produto</FieldLabel><Input value={form.nome} onChange={(e) => set("nome", e.target.value)} /></div>
          <div><FieldLabel>SKU</FieldLabel><Input value={form.sku} onChange={(e) => set("sku", e.target.value)} /></div>
          <div><FieldLabel>Categoria</FieldLabel><Input value={form.categoria} onChange={(e) => set("categoria", e.target.value)} /></div>
          <div><FieldLabel>Quantidade</FieldLabel><Input type="number" value={form.quantidade} onChange={(e) => set("quantidade", +e.target.value)} /></div>
          <div><FieldLabel>NCM</FieldLabel><Input value={form.ncm} onChange={(e) => set("ncm", e.target.value)} /></div>
          <div><FieldLabel>Preço de Custo (R$)</FieldLabel><Input type="number" value={form.precoCusto} onChange={(e) => set("precoCusto", +e.target.value)} /></div>
          <div><FieldLabel>Preço de Venda (R$)</FieldLabel><Input type="number" value={form.precoVenda} onChange={(e) => set("precoVenda", +e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: `1px solid ${C.border}` }}>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimary onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar Alterações"}</BtnPrimary>
        </div>
      </div>
    </div>
  );
}
