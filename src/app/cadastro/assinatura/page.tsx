"use client";

// Destino: src/app/cadastro/assinatura/page.tsx
// Etapa 2 de 2. Lê os dados da Etapa 1 do sessionStorage (nome, email,
// celular, senha) e, ao finalizar, envia TUDO junto num único POST pra
// /api/auth/cadastro — que cria o Usuario e a Assinatura na mesma
// transação e já autentica a sessão. Depois mostra a tela de sucesso e
// leva ao dashboard.
//
// Versão unificada: pagamento com popup (Cartão/Pix) e tela de espera
// (branch models_assinatura) + campo Estado, ViaCEP e recarga do estado
// do app após o cadastro (main).
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IdCard, MapPin, Home, Hash, Building2, AlertTriangle, CreditCard, QrCode, Check } from "lucide-react";
import { C, PLANOS_ASSINATURA, UFS } from "@/lib/constants";
import { AuthBackground, AuthSplitCard, AuthField, OnboardingStepper } from "@/components/auth/AuthLayout";
import { BtnPrimary } from "@/components/ui/Button";
import ModelCredito, { type DadosCartao } from "@/components/Models/ModelCredito";
import ModelPix from "@/components/Models/ModelPix";
import { useApp } from "@/context/AppContext";

type FormaPagamento = "cartao" | "pix";
type PlanoValor = (typeof PLANOS_ASSINATURA)[number]["v"];
type DadosEtapa1 = { nome: string; email: string; celular: string; senha: string };
type Etapa = "form" | "aguardando" | "sucesso";

const ATRASO_CONFIRMACAO_MS = 3000;
const ATRASO_REDIRECIONAMENTO_MS = 2500;

export default function AssinaturaEtapa2Page() {
  const router = useRouter();
  const { recarregarTudo } = useApp();
  const [dadosEtapa1, setDadosEtapa1] = useState<DadosEtapa1 | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [estado, setEstado] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(null);
  const [plano, setPlano] = useState<PlanoValor>("mensal");
  const [planoRecolhido, setPlanoRecolhido] = useState(true);
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
  // Dispara sozinho quando o CEP tiver 8 dígitos. O estado vai pro select
  // "Estado" (por isso a UF não entra no texto do endereço).
  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    let cancelado = false;
    setBuscandoCep(true);
    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelado || data.erro) return;
        const partes = [data.logradouro, data.bairro, data.localidade].filter(Boolean);
        if (partes.length) setEndereco(partes.join(" - "));
        if (data.uf) setEstado(data.uf);
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) setBuscandoCep(false); });

    return () => { cancelado = true; };
  }, [cep]);

  const trocarPlano = (novo: PlanoValor) => {
    setPlano(novo);
    setPlanoRecolhido(true); // esconde o outro card pra economizar altura
    setPixConfirmado(false); // o valor mudou, o Pix precisa ser gerado de novo
    setCartao((c) => (c ? { ...c, parcelas: 1 } : c)); // parcelas dependem do plano
  };

  const escolherPagamento = (forma: FormaPagamento) => {
    setFormaPagamento(forma);
    setModal(forma); // abre o popup correspondente
  };

  const validarDados = () => {
    if (!cpfCnpj.trim() || !cep.trim() || !endereco.trim() || !numero.trim() || !estado.trim()) {
      setErro("Preencha CPF/CNPJ, CEP, endereço, número e estado para continuar.");
      return false;
    }
    if (!formaPagamento) {
      setErro("Escolha a forma de pagamento (Cartão ou Pix) para continuar.");
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
    const enderecoCompleto =
      `${endereco}, nº ${numero.trim()}${complemento.trim() ? ` - ${complemento.trim()}` : ""} - ${estado}`;

    const [res] = await Promise.all([
      fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dadosEtapa1,
          cpfCnpj,
          cep,
          endereco: enderecoCompleto,
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

    // Sem isso, o AppContext continuava com os dados do usuário anterior
    // em memória (ele só busca uma vez, no carregamento inicial do app).
    await recarregarTudo().catch(() => {});

    setEtapa("sucesso");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, ATRASO_REDIRECIONAMENTO_MS);
  };

  const finalizar = () => {
    if (!validarDados()) return;
    if ((formaPagamento === "cartao" && !cartao) || (formaPagamento === "pix" && !pixConfirmado)) {
      setErro("Confirme o pagamento: clique em Cartão de Crédito ou Pix e preencha os dados.");
      return;
    }
    processar();
  };

  const aoConfirmarCartao = (dados: DadosCartao) => {
    setCartao(dados);
    setModal(null);
    setErro("");
  };

  const aoConfirmarPix = () => {
    setPixConfirmado(true);
    setModal(null);
    setErro("");
  };

  // Dica de acessibilidade: deixa claro que é preciso clicar pra preencher
  const pagamentoPronto = (formaPagamento === "cartao" && !!cartao) || (formaPagamento === "pix" && pixConfirmado);

  const dicaPagamento = !formaPagamento
    ? "Selecione uma opção — uma janela abrirá para você preencher os dados."
    : formaPagamento === "cartao" && !cartao
    ? "Dados do cartão pendentes — clique em Cartão de Crédito para preencher."
    : formaPagamento === "pix" && !pixConfirmado
    ? "Pix pendente — clique em Pix para gerar o código."
    : formaPagamento === "cartao" && cartao
    ? `✓ Cartão confirmado (${cartao.bandeira.toUpperCase()} final ${cartao.numero.slice(-4)} · ${cartao.parcelas}x). Clique em Finalizar cadastro para criar sua conta.`
    : "✓ Pix confirmado. Clique em Finalizar cadastro para criar sua conta.";

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
                  <AuthField label="Endereço" icon={<Home size={14} />} value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Ex: Av. Paulista - Bela Vista - São Paulo" />
                </div>
                <div style={{ width: 110, flexShrink: 0 }}>
                  <AuthField label="Número" icon={<Hash size={14} />} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 1000" />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <AuthField label="Complemento (opcional)" icon={<Building2 size={14} />} value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Ex: Apto 12, Bloco B" />
                </div>
                <div style={{ width: 110, flexShrink: 0, marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 16, color: C.textMuted, marginBottom: 6, fontWeight: 500 }}>Estado</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.white, fontSize: 16, outline: "none" }}
                  >
                    <option value="">UF</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
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
                {dicaPagamento && (
                  pagamentoPronto ? (
                    <div
                      role="status"
                      style={{
                        display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "9px 12px", borderRadius: 10,
                        border: "1px solid rgba(52,211,153,0.5)", background: "rgba(52,211,153,0.12)",
                        color: "#34D399", fontSize: 12.5, fontWeight: 600,
                      }}
                    >
                      <Check size={16} style={{ flexShrink: 0 }} /> {dicaPagamento.replace("✓ ", "")}
                    </div>
                  ) : (
                    <p style={{ color: C.textMuted, fontSize: 11.5, margin: "6px 0 0" }}>{dicaPagamento}</p>
                  )
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 16, color: C.textMuted, fontWeight: 500 }}>Plano</label>
                  {planoRecolhido && (
                    <button
                      type="button"
                      onClick={() => setPlanoRecolhido(false)}
                      style={{ background: "none", border: "none", padding: 0, color: C.orange, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                    >
                      Alterar
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PLANOS_ASSINATURA.filter((p) => !planoRecolhido || p.v === plano).map((p) => (
                    <CardPlano
                      key={p.v}
                      ativo={plano === p.v}
                      plano={p}
                      onClick={() => (planoRecolhido ? setPlanoRecolhido(false) : trocarPlano(p.v))}
                    />
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
          <h3 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0 }}>Preparando a plataforma</h3>
          <p style={{ color: C.textMuted, fontSize: 12.5, margin: 0 }}>
            Estamos criando sua conta e configurando seu ambiente. Em instantes você será redirecionado para o dashboard.
          </p>
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
          <p style={{ color: C.textMuted, fontSize: 12.5, margin: 0 }}>Redirecionando para o dashboard...</p>
        </>
      )}
    </div>
  );
}

/* ───────────── Componentes de seleção ───────────── */

function SeletorBotao({ ativo, onClick, icon, label }: { ativo: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
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