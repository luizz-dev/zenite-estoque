"use client";

// Destino: src/app/cadastro/assinatura/page.tsx
// Etapa 2 de 2. Lê os dados da Etapa 1 do sessionStorage (nome, email,
// celular, senha) e, ao finalizar, envia TUDO junto num único POST pra
// /api/auth/cadastro — que cria o Usuario e a Assinatura na mesma
// transação. Depois mostra a tela de verificação e leva ao login.
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IdCard, MapPin, Home, Hash, AlertTriangle, CreditCard, QrCode, Check } from "lucide-react";
import { C, PLANOS_ASSINATURA } from "@/lib/constants";
import { AuthBackground, AuthSplitCard, AuthField, OnboardingStepper } from "@/components/auth/AuthLayout";
import { BtnPrimary } from "@/components/ui/Button";
import ModelCredito, { type DadosCartao } from "@/components/Models/ModelCredito";
import ModelPix from "@/components/Models/ModelPix";

type FormaPagamento = "cartao" | "pix";
type PlanoValor = (typeof PLANOS_ASSINATURA)[number]["v"];
type DadosEtapa1 = { nome: string; email: string; celular: string; senha: string };
type Etapa = "form" | "aguardando" | "sucesso";

const ATRASO_CONFIRMACAO_MS = 3000;
const ATRASO_REDIRECIONAMENTO_MS = 2500;

export default function AssinaturaEtapa2Page() {
  const router = useRouter();
  const [dadosEtapa1, setDadosEtapa1] = useState<DadosEtapa1 | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("cartao");
  const [plano, setPlano] = useState<PlanoValor>("mensal");
  const [erro, setErro] = useState("");

  const [etapa, setEtapa] = useState<Etapa>("form");
  const [modal, setModal] = useState<null | "cartao" | "pix">(null);
  const [cartao, setCartao] = useState<DadosCartao | null>(null);
  const [pixConfirmado, setPixConfirmado] = useState(false);

  const planoAtual = PLANOS_ASSINATURA.find((p) => p.v === plano)!;
  const maxParcelas = plano === "anual" ? 12 : 1;

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

  const trocarPlano = (novo: PlanoValor) => {
    setPlano(novo);
    setPixConfirmado(false); // o valor mudou, o Pix precisa ser gerado de novo
    setCartao((c) => (c ? { ...c, parcelas: 1 } : c)); // parcelas dependem do plano
  };

  const escolherPagamento = (forma: FormaPagamento) => {
    setFormaPagamento(forma);
    setModal(forma); // abre o popup correspondente
  };

  const validarDados = () => {
    if (!cpfCnpj.trim() || !cep.trim() || !endereco.trim() || !numero.trim()) {
      setErro("Preencha CPF/CNPJ, CEP, endereço e número para continuar.");
      return false;
    }
    setErro("");
    return true;
  };

  const processar = async () => {
    if (!dadosEtapa1) return;
    setEtapa("aguardando");

    // Envia o cadastro e espera no mínimo 3s (simula a confirmação do pagamento).
    // Dados de cartão NÃO são enviados: o popup é apenas demonstrativo.
    const [res] = await Promise.all([
      fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dadosEtapa1,
          cpfCnpj,
          cep,
          endereco: `${endereco}, nº ${numero.trim()}`,
          formaPagamento,
          plano,
        }),
      }).catch(() => null),
      new Promise((r) => setTimeout(r, ATRASO_CONFIRMACAO_MS)),
    ]);

    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      setEtapa("form");
      setErro(data.erro || "Não foi possível concluir o cadastro.");
      return;
    }

    sessionStorage.removeItem("zenite_cadastro_etapa1");
    setEtapa("sucesso");
    setTimeout(() => router.push("/login"), ATRASO_REDIRECIONAMENTO_MS);
  };

  const finalizar = () => {
    if (!validarDados()) return;
    if (formaPagamento === "cartao" && !cartao) return setModal("cartao");
    if (formaPagamento === "pix" && !pixConfirmado) return setModal("pix");
    processar();
  };

  const aoConfirmarCartao = (dados: DadosCartao) => {
    setCartao(dados);
    setModal(null);
    if (validarDados()) processar();
  };

  const aoConfirmarPix = () => {
    setPixConfirmado(true);
    setModal(null);
    if (validarDados()) processar();
  };

  if (carregando) return null;

  return (
    <AuthBackground>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 720 }}>
        <OnboardingStepper atual={2} total={2} />
        <AuthSplitCard orangeSide="left">
          {etapa !== "form" ? (
            <TelaStatus etapa={etapa} />
          ) : (
            <>
              <h2 style={{ color: C.white, fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Dados de Cobrança</h2>
              <p style={{ color: C.textMuted, fontSize: 12.5, margin: "0 0 22px" }}>
                Última etapa — escolha seu plano e confirme seus dados.
              </p>

              <AuthField label="CPF ou CNPJ" icon={<IdCard size={14} />} value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="Ex: 123.456.789-00" />
              <AuthField label="CEP" icon={<MapPin size={14} />} value={cep} onChange={(e) => setCep(e.target.value)} placeholder="Ex: 01310-100" />
              {buscandoCep && <p style={{ color: C.textMuted, fontSize: 11, margin: "-10px 0 12px" }}>Buscando endereço...</p>}

              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <AuthField label="Endereço" icon={<Home size={14} />} value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Ex: Av. Paulista — São Paulo/SP" />
                </div>
                <div style={{ width: 110, flexShrink: 0 }}>
                  <AuthField label="Número" icon={<Hash size={14} />} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 1000" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 16, color: C.textMuted, marginBottom: 6, fontWeight: 500 }}>
                  Forma de pagamento
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  <SeletorBotao ativo={formaPagamento === "cartao"} onClick={() => escolherPagamento("cartao")} icon={<CreditCard size={16} />} label="Cartão de Crédito" />
                  <SeletorBotao ativo={formaPagamento === "pix"} onClick={() => escolherPagamento("pix")} icon={<QrCode size={16} />} label="Pix" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 16, color: C.textMuted, marginBottom: 6, fontWeight: 500 }}>
                  Plano
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PLANOS_ASSINATURA.map((p) => (
                    <CardPlano key={p.v} ativo={plano === p.v} plano={p} onClick={() => trocarPlano(p.v)} />
                  ))}
                </div>
              </div>

              {erro && (
                <div style={{ borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "9px 12px", marginBottom: 16, color: C.red, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={14} /> {erro}
                </div>
              )}

              <BtnPrimary onClick={finalizar} style={{ width: "100%", padding: 12 }}>
                Finalizar cadastro →
              </BtnPrimary>
            </>
          )}
        </AuthSplitCard>
      </div>

      {modal === "cartao" && (
        <ModelCredito
          valor={planoAtual.valor}
          maxParcelas={maxParcelas}
          inicial={cartao}
          onClose={() => setModal(null)}
          onConfirmar={aoConfirmarCartao}
        />
      )}
      {modal === "pix" && (
        <ModelPix valor={planoAtual.valor} onClose={() => setModal(null)} onConfirmar={aoConfirmarPix} />
      )}
    </AuthBackground>
  );
}

/* ───────────── Tela de espera / sucesso ───────────── */

function TelaStatus({ etapa }: { etapa: "aguardando" | "sucesso" }) {
  return (
    <div style={{ minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16 }}>
      <style>{`
        @keyframes zenite-spin { to { transform: rotate(360deg); } }
        @keyframes zenite-pop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      {etapa === "aguardando" ? (
        <>
          <div
            style={{
              width: 56, height: 56, borderRadius: "50%",
              border: "4px solid rgba(245,124,0,0.2)", borderTopColor: C.orange,
              animation: "zenite-spin 0.9s linear infinite",
            }}
          />
          <h3 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0 }}>Aguardando confirmação do pagamento</h3>
          <p style={{ color: C.textMuted, fontSize: 12.5, margin: 0 }}>Não feche esta página. Isso leva apenas alguns segundos.</p>
        </>
      ) : (
        <>
          <div
            style={{
              width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(52,211,153,0.12)", border: "2px solid #34D399", animation: "zenite-pop 0.4s ease-out",
            }}
          >
            <Check size={30} color="#34D399" />
          </div>
          <h3 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0 }}>Conta criada com sucesso!</h3>
          <p style={{ color: C.textMuted, fontSize: 12.5, margin: 0 }}>Redirecionando para o login...</p>
        </>
      )}
    </div>
  );
}

/* ───────────── Componentes de seleção (inalterados) ───────────── */

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