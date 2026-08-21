"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, Check, AlertTriangle } from "lucide-react";
import { C } from "@/lib/constants";
import { UFS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Input, Select, FieldLabel } from "@/components/ui/Input";
import { BtnPrimary, BtnGhost } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { useApp } from "@/context/AppContext";

const REGIMES_TRIBUTARIOS = ["MEI — Simples Nacional", "Simples Nacional — ME", "Lucro Presumido", "Lucro Real"];

function DadosFiscaisForm() {
  const { empresa, salvarDadosFiscais } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const veioDaEmissaoNfe = params.get("motivo") === "nfe";

  const [razaoSocial, setRazaoSocial] = useState(empresa?.razaoSocial || "");
  const [ie, setIe] = useState(empresa?.ie || "");
  const [certificado, setCertificado] = useState<File | null>(null);
  const [senhaCert, setSenhaCert] = useState("");
  const [regime, setRegime] = useState(empresa?.regime || REGIMES_TRIBUTARIOS[0]);
  const [cep, setCep] = useState(empresa?.cep || "");
  const [ibge, setIbge] = useState<{ codigo: string; municipio: string; uf: string } | null>(null);
  const [rua, setRua] = useState(empresa?.rua || "");
  const [numero, setNumero] = useState(empresa?.numero || "");
  const [bairro, setBairro] = useState(empresa?.bairro || "");
  const [cidade, setCidade] = useState(empresa?.cidade || "");
  const [uf, setUf] = useState(empresa?.uf || "SP");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Consulta de CEP → IBGE simulada (offline, sem chamada externa real).
  // Troque por uma chamada real ao ViaCEP/IBGE quando integrar de verdade.
  const buscarIbge = () => {
    const limpo = cep.replace(/\D/g, "");
    if (limpo.length !== 8) return;
    setIbge({ codigo: "3550308", municipio: "São Paulo", uf: "SP" });
    setCidade("São Paulo"); setUf("SP");
  };

  const salvar = async () => {
    if (!razaoSocial.trim() || !ie.trim()) return setErro("Preencha Razão Social e Inscrição Estadual.");
    // A exigência do certificado A1 (.pfx) fica comentada abaixo para
    // facilitar testes — reative removendo o comentário em produção.
    // if (!certificado) return setErro("Envie o Certificado Digital A1 (.pfx).");
    if (!cep.trim() || !rua.trim() || !cidade.trim()) return setErro("Preencha o endereço fiscal completo.");
    setErro("");
    setSalvando(true);
    const resultado = await salvarDadosFiscais({
      razaoSocial, ie, regime, uf, cep, rua, numero, bairro, cidade,
      certificadoNome: certificado?.name || "",
    });
    setSalvando(false);
    if (!resultado.ok) return setErro(resultado.erro || "Erro ao salvar.");
    router.push(veioDaEmissaoNfe ? "/estoque" : "/perfil");
  };

  return (
    <div>
      <Topbar titulo="Dados Fiscais" sub="Perfil › Dados Fiscais para NF-e" />
      <div style={{ maxWidth: 640 }}>
        {veioDaEmissaoNfe && (
          <div style={{ borderRadius: 12, border: "1px solid rgba(255,169,77,0.3)", background: "rgba(255,169,77,0.08)", padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={16} style={{ color: C.amber, flexShrink: 0 }} />
            <p style={{ color: C.amber, fontSize: 14.5, margin: 0 }}>Você precisa configurar os dados fiscais antes de emitir a primeira nota. Assim que salvar, você volta direto para o Estoque.</p>
          </div>
        )}

        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><FieldLabel>Razão Social</FieldLabel><Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Ex: Bom Tecido Confecções ME" /></div>
            <div><FieldLabel>Inscrição Estadual</FieldLabel><Input value={ie} onChange={(e) => setIe(e.target.value)} placeholder="000.000.000.000" /></div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Certificado Digital A1 (.pfx)</FieldLabel>
            <label style={{ display: "flex", alignItems: "center", gap: 10, border: `1px dashed ${C.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}>
              <Upload size={16} style={{ color: C.cyanText, flexShrink: 0 }} />
              <span style={{ color: certificado ? C.white : C.textMuted, fontSize: 14.5 }}>{certificado ? certificado.name : "Clique para selecionar o arquivo .pfx"}</span>
              <input type="file" accept=".pfx" onChange={(e) => setCertificado(e.target.files?.[0] || null)} style={{ display: "none" }} />
            </label>
          </div>
          <div style={{ marginBottom: 18 }}>
            <FieldLabel>Senha do Certificado</FieldLabel>
            <Input type="password" value={senhaCert} onChange={(e) => setSenhaCert(e.target.value)} placeholder="Senha do arquivo .pfx" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <FieldLabel>Regime Tributário</FieldLabel>
            <Select value={regime} onChange={(e) => setRegime(e.target.value)}>{REGIMES_TRIBUTARIOS.map((r) => <option key={r} value={r}>{r}</option>)}</Select>
          </div>

          <FieldLabel>Endereço Fiscal (com consulta IBGE)</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 12 }}>
            <Input value={cep} onChange={(e) => setCep(e.target.value)} onBlur={buscarIbge} placeholder="CEP — Ex: 01310-100" />
            <BtnGhost onClick={buscarIbge}>Buscar</BtnGhost>
          </div>
          {ibge && (
            <div style={{ borderRadius: 10, border: "1px solid rgba(0,180,216,0.22)", background: "rgba(0,180,216,0.06)", padding: "9px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color: C.cyanText, fontSize: 14.5 }}>
              <Check size={16} /> Código IBGE {ibge.codigo} — {ibge.municipio}/{ibge.uf}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
            <Input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua / Avenida" />
            <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 10, marginBottom: 18 }}>
            <Input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" />
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" />
            <Select value={uf} onChange={(e) => setUf(e.target.value)}>{UFS.map((u) => <option key={u} value={u}>{u}</option>)}</Select>
          </div>

          {erro && (
            <div style={{ borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "9px 12px", marginBottom: 16, color: C.red, fontSize: 14.5, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={16} /> {erro}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <BtnGhost onClick={() => router.push("/perfil")}>Cancelar</BtnGhost>
            <BtnPrimary onClick={salvar} disabled={salvando} icon={<Check size={16} />}>{salvando ? "Salvando..." : "Salvar Dados Fiscais"}</BtnPrimary>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function DadosFiscaisPage() {
  return (
    <Suspense fallback={null}>
      <DadosFiscaisForm />
    </Suspense>
  );
}
