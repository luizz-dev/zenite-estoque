"use client";

// Destino: src/app/cadastro/checkout/page.tsx
// Etapa 2 de 2 (Cadastro). Usuário já está autenticado nesse ponto
// (a etapa 1 chama criarSessao). Aqui só completamos:
//   1) dados de cobrança do Usuario (PATCH /api/auth/cadastro)
//   2) o plano de assinatura (PATCH /api/assinatura)
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IdCard, MapPin, Home, AlertTriangle, CreditCard, QrCode, Check } from "lucide-react";
import { C, PLANOS_ASSINATURA } from "@/lib/constants";
import { AuthBackground, AuthSplitCard, AuthField, OnboardingStepper } from "@/components/auth/AuthLayout";
import { BtnPrimary } from "@/components/ui/Button";

type FormaPagamento = "cartao" | "pix";
type PlanoValor = (typeof PLANOS_ASSINATURA)[number]["v"];

export default function CheckoutPage() {
  const router = useRouter();
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("cartao");
  const [plano, setPlano] = useState<PlanoValor>("mensal");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const finalizar = async () => {
    if (!cpfCnpj.trim() || !cep.trim() || !endereco.trim()) {
      return setErro("Preencha CPF/CNPJ, CEP e endereço para continuar.");
    }

    setErro("");
    setEnviando(true);

    const resDados = await fetch("/api/auth/cadastro", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpfCnpj, cep, endereco, formaPagamento }),
    });
    if (!resDados.ok) {
      setEnviando(false);
      const data = await resDados.json();
      return setErro(data.erro || "Não foi possível salvar seus dados de cobrança.");
    }

    const resPlano = await fetch("/api/assinatura", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "trocar-plano", plano }),
    });
    setEnviando(false);
    if (!resPlano.ok) {
      const data = await resPlano.json();
      return setErro(data.erro || "Não foi possível confirmar o plano escolhido.");
    }

    router.push("/dashboard");
  };

  return (
    <AuthBackground>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 720 }}>
        <OnboardingStepper atual={2} total={2} />
        <AuthSplitCard orangeSide="left">
          <h2 style={{ color: C.white, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Dados de Cobrança</h2>
          <p style={{ color: C.textMuted, fontSize: 12.5, margin: "0 0 22px" }}>
            Última etapa — escolha seu plano e confirme seus dados.
          </p>

          <AuthField label="CPF ou CNPJ" icon={<IdCard size={14} />} value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="Ex: 123.456.789-00" />
          <AuthField label="CEP" icon={<MapPin size={14} />} value={cep} onChange={(e) => setCep(e.target.value)} placeholder="Ex: 01310-100" />
          <AuthField label="Endereço" icon={<Home size={14} />} value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Ex: Av. Paulista, 1000 — São Paulo/SP" />

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 16, color: C.textMuted, marginBottom: 6, fontWeight: 500 }}>
              Forma de pagamento
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <SeletorBotao ativo={formaPagamento === "cartao"} onClick={() => setFormaPagamento("cartao")} icon={<CreditCard size={16} />} label="Cartão de Crédito" />
              <SeletorBotao ativo={formaPagamento === "pix"} onClick={() => setFormaPagamento("pix")} icon={<QrCode size={16} />} label="Pix" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 16, color: C.textMuted, marginBottom: 6, fontWeight: 500 }}>
              Plano
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PLANOS_ASSINATURA.map((p) => (
                <CardPlano key={p.v} ativo={plano === p.v} plano={p} onClick={() => setPlano(p.v)} />
              ))}
            </div>
          </div>

          {erro && (
            <div style={{ borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "9px 12px", marginBottom: 16, color: C.red, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} /> {erro}
            </div>
          )}

          <BtnPrimary onClick={finalizar} disabled={enviando} style={{ width: "100%", padding: 12 }}>
            {enviando ? "Finalizando..." : "Finalizar cadastro →"}
          </BtnPrimary>
        </AuthSplitCard>
      </div>
    </AuthBackground>
  );
}

function SeletorBotao({ ativo, onClick, icon, label }: { ativo: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 8,
        border: `1px solid ${ativo ? C.orange : C.border}`,
        background: ativo ? "rgba(245,124,0,0.12)" : "rgba(255,255,255,0.05)",
        color: ativo ? C.orange : C.textMuted,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {icon} {label}
    </button>
  );
}

function CardPlano({
  ativo,
  plano,
  onClick,
}: {
  ativo: boolean;
  plano: (typeof PLANOS_ASSINATURA)[number];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderRadius: 10,
        border: `1px solid ${ativo ? C.orange : C.border}`,
        background: ativo ? "rgba(245,124,0,0.10)" : "rgba(255,255,255,0.03)",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div>
        <div style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>{plano.l}</div>
        <div style={{ color: C.textMuted, fontSize: 11.5 }}>{plano.sub}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.white, fontSize: 15, fontWeight: 700 }}>
          R$ {plano.valor.toFixed(2).replace(".", ",")}
        </span>
        {ativo && <Check size={16} color={C.orange} />}
      </div>
    </button>
  );
}