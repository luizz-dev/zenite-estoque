"use client";

// Destino: src/app/cadastro/assinatura/page.tsx
// (Renomeado de "checkout" — o nome antigo não refletia o que a página
// faz: aqui é a Etapa 2 do cadastro, onde a conta e a assinatura são
// criadas juntas.)
//
// Etapa 2 de 2. Lê os dados da Etapa 1 do sessionStorage (nome, email,
// celular, senha) e, ao finalizar, envia TUDO junto num único POST pra
// /api/auth/cadastro — que cria o Usuario e a Assinatura na mesma
// transação e só então autentica a sessão.
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IdCard, MapPin, Home, AlertTriangle, CreditCard, QrCode, Check } from "lucide-react";
import { C, PLANOS_ASSINATURA } from "@/lib/constants";
import { AuthBackground, AuthSplitCard, AuthField, OnboardingStepper } from "@/components/auth/AuthLayout";
import { BtnPrimary } from "@/components/ui/Button";

type FormaPagamento = "cartao" | "pix";
type PlanoValor = (typeof PLANOS_ASSINATURA)[number]["v"];
type DadosEtapa1 = { nome: string; email: string; celular: string; senha: string };

export default function AssinaturaEtapa2Page() {
  const router = useRouter();
  const [dadosEtapa1, setDadosEtapa1] = useState<DadosEtapa1 | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("cartao");
  const [plano, setPlano] = useState<PlanoValor>("mensal");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Sem os dados da Etapa 1, não tem como finalizar — volta pro começo.
  useEffect(() => {
    const salvo = sessionStorage.getItem("zenite_cadastro_etapa1");
    if (!salvo) {
      router.replace("/cadastro");
      return;
    }
    setDadosEtapa1(JSON.parse(salvo));
    setCarregando(false);
  }, [router]);

  // Autocomplete de endereço via ViaCEP (API pública/gratuita, sem chave).
  // Dispara sozinho quando o CEP tiver 8 dígitos.
  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    let cancelado = false;
    setBuscandoCep(true);
    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelado || data.erro) return;
        const partes = [data.logradouro, data.bairro, data.localidade && data.uf ? `${data.localidade}/${data.uf}` : ""].filter(Boolean);
        if (partes.length) setEndereco(partes.join(" - "));
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) setBuscandoCep(false); });

    return () => { cancelado = true; };
  }, [cep]);

  const finalizar = async () => {
    if (!dadosEtapa1) return;
    if (!cpfCnpj.trim() || !cep.trim() || !endereco.trim()) {
      return setErro("Preencha CPF/CNPJ, CEP e endereço para continuar.");
    }

    setErro("");
    setEnviando(true);

    const res = await fetch("/api/auth/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...dadosEtapa1, cpfCnpj, cep, endereco, formaPagamento, plano }),
    });
    setEnviando(false);
    if (!res.ok) {
      const data = await res.json();
      return setErro(data.erro || "Não foi possível concluir o cadastro.");
    }

    sessionStorage.removeItem("zenite_cadastro_etapa1");
    router.push("/dashboard");
  };

  if (carregando) return null;

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
          {buscandoCep && <p style={{ color: C.textMuted, fontSize: 11, margin: "-10px 0 12px" }}>Buscando endereço...</p>}
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