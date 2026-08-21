"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { C } from "@/lib/constants";
import { BtnGhost } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import type { Produto } from "@/lib/types";

export function ModalExcluir({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const { excluirProduto } = useApp();
  const [excluindo, setExcluindo] = useState(false);

  const confirmar = async () => {
    setExcluindo(true);
    await excluirProduto(produto.id);
    setExcluindo(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 20, width: "100%", maxWidth: 380, overflow: "hidden" }}>
        <div style={{ padding: "28px 24px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: C.red, margin: "0 auto 16px" }}>
            <Trash2 size={20} />
          </div>
          <h3 style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>Excluir Produto</h3>
          <p style={{ color: C.textSec, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Tem certeza que deseja excluir <strong style={{ color: C.white }}>{produto.nome}</strong>? Esta ação não pode ser desfeita.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 24px 22px" }}>
          <BtnGhost onClick={onClose} style={{ flex: 1 }}>Cancelar</BtnGhost>
          <button onClick={confirmar} disabled={excluindo} style={{
            flex: 1, padding: 10, borderRadius: 12, border: "1px solid rgba(248,113,113,0.3)",
            background: "rgba(248,113,113,0.12)", color: C.red, fontSize: 14.5, fontWeight: 600, cursor: "pointer",
          }}>{excluindo ? "Excluindo..." : "Sim, Excluir"}</button>
        </div>
      </div>
    </div>
  );
}
