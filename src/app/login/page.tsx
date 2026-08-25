"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, KeyRound, AlertTriangle } from "lucide-react";
import { C } from "@/lib/constants";
import { AuthBackground, AuthSplitCard, AuthField } from "@/components/auth/AuthLayout";
import { BtnPrimary } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";

export default function LoginPage() {
  const router = useRouter();
  const { recarregarTudo } = useApp();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  const entrar = async () => {
    if (!email.trim() || !senha.trim()) return setErro("Preencha e-mail e senha para continuar.");
    setErro("");
    setEntrando(true);
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, senha }) });
    setEntrando(false);
    if (!res.ok) {
      const data = await res.json();
      return setErro(data.erro || "Não foi possível entrar.");
    }
    await recarregarTudo();
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthBackground>
      <AuthSplitCard orangeSide="left">
        <h2 style={{ color: C.white, fontSize: 22, fontWeight: 700, margin: "0 0 22px" }}>Login</h2>
        <AuthField label="E-mail" icon={<Mail size={14} />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex: exemplo@mail.com" />
        <AuthField label="Senha" icon={<KeyRound size={14} />} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Ex: exemplo123"
          onKeyDown={(e) => e.key === "Enter" && entrar()} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, fontSize: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#A8B5D1", cursor: "pointer" }}>
            <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} style={{ accentColor: C.purple1 }} />
            Lembrar-me
          </label>
          <span style={{ color: C.cyanText, cursor: "pointer" }}>Esqueci minha senha</span>
        </div>
        {erro && (
          <div style={{ borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "9px 12px", marginBottom: 16, color: C.red, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} /> {erro}
          </div>
        )}
        <BtnPrimary onClick={entrar} disabled={entrando} style={{ width: "100%", padding: 12 }}>{entrando ? "Entrando..." : "Entrar"}</BtnPrimary>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.border }} /><span style={{ color: C.textMuted, fontSize: 11 }}>ou</span><div style={{ flex: 1, height: 1, background: C.border }} />
        </div>
        <p style={{ textAlign: "center", color: "#A8B5D1", fontSize: 12.5, margin: 0 }}>
          Não possui conta? <Link href="/cadastro" style={{ color: C.cyanText, fontWeight: 600, textDecoration: "none" }}>Cadastro</Link>
        </p>
      </AuthSplitCard>
    </AuthBackground>
  );
}