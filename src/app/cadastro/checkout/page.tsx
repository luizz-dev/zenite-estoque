"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CreditCard, QrCode, AlertTriangle } from "lucide-react";
import { C } from "@/lib/constants";
import { AuthBackground, OnboardingStepper } from "@/components/auth/AuthLayout";
import { Card } from "@/components/ui/Card";
import { Input, Select, FieldLabel } from "@/components/ui/Input";
import { BtnPrimary, BtnGhost } from "@/components/ui/Button";

// Etapa 2 de 2 (Assinatura/Pagamento). Ao concluir, o usuário já cai
// direto no Dashboard do Zênite — os dados fiscais (Certificado A1,
// Inscrição Estadual, Regime Tributário) são pedidos depois, dentro do
// sistema, em Perfil > Dados Fiscais, ou na primeira emissão de NF-e.
export default function CheckoutPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<"PF" | "PJ">("PF");
  const [doc, setDoc] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [pagamento, setPagamento] = useState<"cartao" | "pix">("cartao");
  const [numCartao, setNumCartao] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [nomeCartao, setNomeCartao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const continuar = async () => {
    if (!doc.trim() || !cep.trim() || !endereco.trim()) return setErro("Preencha CPF/CNPJ, CEP e endereço para continuar.");
    if (pagamento === "cartao" && (!numCartao.trim() || !validade.trim() || !cvv.trim() || !nomeCartao.trim()))
      return setErro("Preencha os dados do cartão ou selecione Pix.");
    setErro("");
    setEnviando(true);
    const res = await fetch("/api/auth/cadastro/checkout", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpfCnpj: doc, cep, endereco, formaPagamento: pagamento }),
    });
    setEnviando(false);
    if (!res.ok) {
      const data = await res.json();
      return setErro(data.erro || "Não foi possível concluir o cadastro.");
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthBackground>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 640 }}>
        <OnboardingStepper atual={2} total={2} />
        <Card style={{ width: "100%", background: "rgba(13,18,38,0.88)", backdropFilter: "blur(12px)" }}>
          <h2 style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Assinatura</h2>
          <p style={{ color: C.textMuted, fontSize: 12.5, margin: "0 0 20px" }}>Dados de cobrança do plano Zênite MEI</p>

          <div style={{ borderRadius: 12, border: "1px solid rgba(72,55,232,0.3)", background: "rgba(72,55,232,0.08)", padding: "14px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ color: C.white, fontSize: 13.5, fontWeight: 700, margin: 0 }}>Plano Zênite MEI</p>
              <p style={{ color: C.textMuted, fontSize: 11.5, margin: "2px 0 0" }}>Estoque + emissão de NF-e ilimitada</p>
            </div>
            <p style={{ color: C.purpleText, fontSize: 16, fontWeight: 700, margin: 0 }}>Grátis</p>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {(["PF", "PJ"] as const).map((t) => (
              <button key={t} onClick={() => setTipo(t)} style={{
                padding: "6px 14px", borderRadius: 8, border: `1px solid ${tipo === t ? C.purple1 : C.border}`, cursor: "pointer",
                fontSize: 12, fontWeight: 600, background: tipo === t ? "rgba(72,55,232,0.2)" : "rgba(255,255,255,0.02)",
                color: tipo === t ? C.purpleText : C.textSec,
              }}>{t === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><FieldLabel>{tipo === "PF" ? "CPF" : "CNPJ"}</FieldLabel><Input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder={tipo === "PF" ? "000.000.000-00" : "00.000.000/0000-00"} /></div>
            <div><FieldLabel>CEP</FieldLabel><Input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" /></div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <FieldLabel>Endereço</FieldLabel>
            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade/UF" />
          </div>

          <FieldLabel>Forma de pagamento</FieldLabel>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {([["cartao", "Cartão", <CreditCard key="c" size={14} />], ["pix", "Pix", <QrCode key="p" size={14} />]] as const).map(([v, l, icon]) => (
              <button key={v as string} onClick={() => setPagamento(v as "cartao" | "pix")} style={{
                padding: "6px 14px", borderRadius: 8, border: `1px solid ${pagamento === v ? C.purple1 : C.border}`, cursor: "pointer",
                fontSize: 12, fontWeight: 600, background: pagamento === v ? "rgba(72,55,232,0.2)" : "rgba(255,255,255,0.02)",
                color: pagamento === v ? C.purpleText : C.textSec, display: "flex", alignItems: "center", gap: 6,
              }}>{icon} {l}</button>
            ))}
          </div>

          {pagamento === "cartao" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div style={{ gridColumn: "1/-1" }}><FieldLabel>Número do Cartão</FieldLabel><Input value={numCartao} onChange={(e) => setNumCartao(e.target.value)} placeholder="0000 0000 0000 0000" /></div>
              <div><FieldLabel>Validade</FieldLabel><Input value={validade} onChange={(e) => setValidade(e.target.value)} placeholder="MM/AA" /></div>
              <div><FieldLabel>CVV</FieldLabel><Input value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" /></div>
              <div style={{ gridColumn: "1/-1" }}><FieldLabel>Nome no Cartão</FieldLabel><Input value={nomeCartao} onChange={(e) => setNomeCartao(e.target.value)} placeholder="Como está impresso no cartão" /></div>
            </div>
          ) : (
            <div style={{ borderRadius: 12, border: `1px dashed ${C.border}`, padding: 18, textAlign: "center", marginBottom: 18 }}>
              <QrCode size={40} style={{ color: C.textMuted, margin: "0 auto 10px" }} />
              <p style={{ color: C.textSec, fontSize: 12, margin: 0 }}>Chave Pix copia e cola será gerada após a confirmação do cadastro.</p>
            </div>
          )}

          {erro && (
            <div style={{ borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "9px 12px", marginBottom: 16, color: C.red, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} /> {erro}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <BtnGhost icon={<ArrowLeft size={14} />} onClick={() => router.push("/cadastro")}>Voltar</BtnGhost>
            <BtnPrimary onClick={continuar} disabled={enviando} icon={<ArrowRight size={14} />}>
              {enviando ? "Concluindo..." : "Concluir e Entrar no Zênite"}
            </BtnPrimary>
          </div>
        </Card>
      </div>
    </AuthBackground>
  );
}
