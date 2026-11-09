"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, AlertTriangle } from "lucide-react";
import { C } from "@/lib/constants";
import { AuthBackground, AuthSplitCard, AuthField } from "@/components/auth/AuthLayout";
import { BtnPrimary } from "@/components/ui/Button";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  const salvar = async () => {
    if (!token) return setErro("Link inválido. Solicite um novo.");
    if (senha.length < 6) return setErro("A senha deve ter pelo menos 6 caracteres.");
    if (senha !== confirmar) return setErro("As senhas não coincidem.");
    setErro("");
    setSalvando(true);
    const res = await fetch("/api/auth/redefinir-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, senha }),
    });
    setSalvando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setErro(data.erro || "Não foi possível redefinir a senha.");
    }
    router.push("/login?senha=redefinida");
  };

  return (
    <AuthBackground>
      <AuthSplitCard orangeSide="left">
        <h2 style={{ color: C.white, fontSize: 22, fontWeight: 700, margin: "0 0 22px" }}>Nova senha</h2>

        <AuthField label="Nova senha" icon={<KeyRound size={14} />} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
        <AuthField label="Confirmar senha" icon={<KeyRound size={14} />} type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
          placeholder="Repita a senha" onKeyDown={(e) => e.key === "Enter" && salvar()} />

        {erro && (
          <div style={{ borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "9px 12px", marginBottom: 16, color: C.red, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} /> {erro}
          </div>
        )}

        <BtnPrimary onClick={salvar} disabled={salvando} style={{ width: "100%", padding: 12 }}>
          {salvando ? "Salvando..." : "Salvar nova senha"}
        </BtnPrimary>

        <p style={{ textAlign: "center", color: "#A8B5D1", fontSize: 12.5, margin: "18px 0 0" }}>
          Link expirado? <Link href="/esqueci-senha" style={{ color: C.cyanText, fontWeight: 600, textDecoration: "none" }}>Solicitar outro</Link>
        </p>
      </AuthSplitCard>
    </AuthBackground>
  );
}