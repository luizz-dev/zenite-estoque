"use client";

// Destino: src/app/(app)/assinatura/page.tsx
// Página de gerenciamento da assinatura: ver plano atual, trocar de
// plano, cancelar/reativar. Funciona com a rota atual de /api/assinatura
// (sem usuarioId por enquanto — ver comentários no route.ts).
//
// PRÓXIMOS PASSOS — Integração com gateway de pagamento (ex: Asaas):
// Hoje trocar de plano só atualiza o registro no banco, sem cobrar de
// verdade. Quando for integrar, veja o bloco comentado dentro de
// trocarPlano() abaixo — é ali que a chamada ao gateway deveria entrar,
// antes do PATCH em /api/assinatura.

import { useEffect, useState } from "react";
import { Calendar, Check, CreditCard, RefreshCw, XCircle } from "lucide-react";
import { C, PLANOS_ASSINATURA, TONE } from "@/lib/constants";

type PlanoValor = (typeof PLANOS_ASSINATURA)[number]["v"];

type Assinatura = {
  id: string;
  plano: PlanoValor;
  status: "ativa" | "cancelada";
  valor: number;
  formaPagamento: string;
  proximaCobranca: string | null;
};

export default function AssinaturaPage() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/assinatura")
      .then((r) => r.json())
      .then(setAssinatura)
      .finally(() => setCarregando(false));
  }, []);

  const trocarPlano = async (novoPlano: PlanoValor) => {
    if (!assinatura || novoPlano === assinatura.plano || salvando) return;
    setErro("");
    setSalvando(true);

    // PRÓXIMO PASSO: cobrar antes de confirmar a troca (gateway de pagamento).
    // const cobranca = await fetch("/api/pagamentos/asaas", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ plano: novoPlano }),
    // });
    // if (!cobranca.ok) {
    //   setSalvando(false);
    //   return setErro("Não foi possível processar o pagamento.");
    // }

    const res = await fetch("/api/assinatura", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "trocar-plano", plano: novoPlano }),
    });
    setSalvando(false);
    if (!res.ok) {
      const data = await res.json();
      return setErro(data.erro || "Não foi possível trocar o plano.");
    }
    setAssinatura(await res.json());
  };

  const alternarStatus = async () => {
    if (!assinatura || salvando) return;
    setErro("");
    setSalvando(true);
    const acao = assinatura.status === "ativa" ? "cancelar" : "reativar";
    const res = await fetch("/api/assinatura", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao }),
    });
    setSalvando(false);
    if (!res.ok) {
      const data = await res.json();
      return setErro(data.erro || "Não foi possível atualizar a assinatura.");
    }
    setAssinatura(await res.json());
  };

  if (carregando) {
    return <div style={{ color: C.textMuted, padding: 32, fontSize: 13 }}>Carregando assinatura...</div>;
  }

  if (!assinatura) {
    return <div style={{ color: C.red, padding: 32, fontSize: 13 }}>Não foi possível carregar sua assinatura.</div>;
  }

  const statusTone = assinatura.status === "ativa" ? TONE.green : TONE.muted;
  const proxima = assinatura.proximaCobranca ? new Date(assinatura.proximaCobranca).toLocaleDateString("pt-BR") : "—";

  return (
    <div style={{ padding: 32, maxWidth: 720 }}>
      <h1 style={{ color: C.white, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Assinatura</h1>
      <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 24px" }}>Gerencie seu plano no Zênite.</p>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ color: C.textMuted, fontSize: 12 }}>Plano atual</div>
            <div style={{ color: C.white, fontSize: 18, fontWeight: 700 }}>
              {PLANOS_ASSINATURA.find((p) => p.v === assinatura.plano)?.l ?? assinatura.plano}
            </div>
          </div>
          <span
            style={{
              background: statusTone.bg,
              color: statusTone.color,
              border: `1px solid ${statusTone.border}`,
              borderRadius: 999,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {assinatura.status}
          </span>
        </div>

        <div style={{ display: "flex", gap: 24, color: C.textSec, fontSize: 13, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CreditCard size={14} /> R$ {assinatura.valor.toFixed(2).replace(".", ",")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={14} /> Próxima cobrança: {proxima}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ color: C.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Trocar de plano</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PLANOS_ASSINATURA.map((p) => (
            <button
              key={p.v}
              type="button"
              disabled={salvando}
              onClick={() => trocarPlano(p.v)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${assinatura.plano === p.v ? C.orange : C.border}`,
                background: assinatura.plano === p.v ? "rgba(245,124,0,0.10)" : "rgba(255,255,255,0.03)",
                cursor: salvando ? "default" : "pointer",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>{p.l}</div>
                <div style={{ color: C.textMuted, fontSize: 11.5 }}>{p.sub}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: C.white, fontSize: 15, fontWeight: 700 }}>R$ {p.valor.toFixed(2).replace(".", ",")}</span>
                {assinatura.plano === p.v && <Check size={16} color={C.orange} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(248,113,113,0.3)",
            background: "rgba(248,113,113,0.08)",
            padding: "9px 12px",
            marginBottom: 16,
            color: C.red,
            fontSize: 12,
          }}
        >
          {erro}
        </div>
      )}

      <button
        type="button"
        onClick={alternarStatus}
        disabled={salvando}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 8,
          border: `1px solid ${assinatura.status === "ativa" ? "rgba(248,113,113,0.3)" : "rgba(74,222,128,0.3)"}`,
          background: "transparent",
          color: assinatura.status === "ativa" ? C.red : C.green,
          fontSize: 13,
          fontWeight: 600,
          cursor: salvando ? "default" : "pointer",
        }}
      >
        {assinatura.status === "ativa" ? <XCircle size={15} /> : <RefreshCw size={15} />}
        {assinatura.status === "ativa" ? "Cancelar assinatura" : "Reativar assinatura"}
      </button>
    </div>
  );
}