"use client";

import { useState } from "react";
import { X, Check, AlertTriangle, CreditCard } from "lucide-react";
import { C, PLANOS_ASSINATURA } from "@/lib/constants";
import { brl } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BtnPrimary, BtnGhost, BtnIcon } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import type { PlanoAssinatura } from "@/lib/types";

export function ModalAssinatura({ onClose, modoInicial = "plano" }: { onClose: () => void; modoInicial?: "plano" | "cancelar" }) {
  const { assinatura, trocarPlano, cancelarAssinatura, reativarAssinatura } = useApp();
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(modoInicial === "cancelar");
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoAssinatura>(assinatura?.plano ?? "mensal");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const trocarDePlano = async () => {
    setErro(""); setSalvando(true);
    const r = await trocarPlano(planoSelecionado);
    setSalvando(false);
    if (!r.ok) setErro(r.erro || "Erro ao trocar de plano.");
    else onClose();
  };

  const confirmarCancelamento = async () => {
    setErro(""); setSalvando(true);
    const r = await cancelarAssinatura();
    setSalvando(false);
    if (!r.ok) setErro(r.erro || "Erro ao cancelar a assinatura.");
    else onClose();
  };

  const reativar = async () => {
    setErro(""); setSalvando(true);
    const r = await reativarAssinatura();
    setSalvando(false);
    if (!r.ok) setErro(r.erro || "Erro ao reativar a assinatura.");
    else onClose();
  };

  if (confirmandoCancelamento) {
    return (
      <div className="zn-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(5,10,20,0.65)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }} onClick={onClose}>
        <div className="zn-modal-enter" style={{ width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
          <Card>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: C.red, marginBottom: 16 }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>Cancelar assinatura?</h3>
            <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
              Você perde acesso às funcionalidades do Zênite ao fim do período já pago. Seus dados continuam salvos e você pode reativar quando quiser.
            </p>
            {erro && <p style={{ color: C.red, fontSize: 12.5, margin: "0 0 14px" }}>{erro}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <BtnGhost onClick={() => setConfirmandoCancelamento(false)}>Voltar</BtnGhost>
              <BtnPrimary style={{ background: C.red, boxShadow: "0 4px 16px rgba(248,113,113,0.28)" }} onClick={confirmarCancelamento} disabled={salvando}>
                {salvando ? "Cancelando..." : "Confirmar Cancelamento"}
              </BtnPrimary>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="zn-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(5,10,20,0.65)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }} onClick={onClose}>
      <div className="zn-modal-enter" style={{ width: "100%", maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h3 style={{ color: C.white, fontSize: 16, fontWeight: 700, margin: 0 }}>Sua Assinatura</h3>
            <BtnIcon onClick={onClose}><X size={16} /></BtnIcon>
          </div>
          <p style={{ color: C.textMuted, fontSize: 12.5, margin: "0 0 18px" }}>
            Plano atual: <strong style={{ color: C.white }}>{assinatura?.plano === "anual" ? "Anual" : "Mensal"}</strong>{" "}
            {assinatura?.status === "cancelada" ? <Badge tone="red">Cancelada</Badge> : <Badge tone="green">Ativa</Badge>}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {PLANOS_ASSINATURA.map((p) => {
              const active = planoSelecionado === p.v;
              const isAtual = assinatura?.plano === p.v;
              return (
                <button key={p.v} onClick={() => setPlanoSelecionado(p.v)} style={{
                  textAlign: "left", padding: "16px", borderRadius: 14, cursor: "pointer",
                  border: `1.5px solid ${active ? C.purple1 : C.border}`,
                  background: active ? "rgba(72,55,232,0.12)" : "rgba(255,255,255,0.02)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: active ? C.purpleText : C.white, fontSize: 14, fontWeight: 700 }}>{p.l}</span>
                    {isAtual && <Badge tone="cyan">Atual</Badge>}
                  </div>
                  <p style={{ color: C.white, fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>{brl(p.valor)}</p>
                  <p style={{ color: C.textMuted, fontSize: 11, margin: 0, lineHeight: 1.5 }}>{p.sub}</p>
                </button>
              );
            })}
          </div>

          <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, background: C.cardInner, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ color: C.textMuted, display: "flex" }}><CreditCard size={14} /></span>
            <p style={{ color: C.textMuted, fontSize: 11.5, margin: 0 }}>Cobrança simulada neste protótipo — nenhum pagamento real é processado.</p>
          </div>

          {erro && <p style={{ color: C.red, fontSize: 12.5, margin: "0 0 14px" }}>{erro}</p>}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            {assinatura?.status === "cancelada" ? (
              <BtnGhost onClick={reativar} disabled={salvando}>{salvando ? "Reativando..." : "Reativar assinatura"}</BtnGhost>
            ) : (
              <BtnGhost style={{ color: C.red }} onClick={() => setConfirmandoCancelamento(true)}>Cancelar assinatura</BtnGhost>
            )}
            <BtnPrimary icon={<Check size={15} />} onClick={trocarDePlano} disabled={salvando || planoSelecionado === assinatura?.plano}>
              {salvando ? "Salvando..." : "Confirmar Plano"}
            </BtnPrimary>
          </div>
        </Card>
      </div>
    </div>
  );
}